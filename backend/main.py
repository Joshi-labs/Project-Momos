import asyncio
import hashlib
import json
import os
import secrets
from typing import Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from database import engine, Base, get_db, SessionLocal
from models import User, Stamp
from schemas import UserRegister, UserLogin, StampClaim, StampStatusUpdate, GoogleAuthRequest
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_admin
from google_auth import get_google_oauth_url, exchange_code_for_google_user, verify_direct_google_id_token
import claims


def format_db_stamp(s: Stamp) -> dict:
    iso = s.created_at.isoformat() if s.created_at else ""
    return {
        "id": s.id,
        "user": s.user_id,
        "category": s.category,
        "status": "approved",
        "created": iso,
        "created_at": iso,
        "expand": {
            "user": {
                "id": s.user.id,
                "email": s.user.email,
                "name": s.user.name or "",
                "role": s.user.role,
            }
        }
        if s.user
        else None,
    }


def json_etag_response(request: Request, data: any) -> Response:
    """
    Returns HTTP 304 Not Modified if the client's If-None-Match header
    matches the deterministic SHA-1 hash of the JSON response.
    Eliminates redundant data transfer during high-frequency dashboard polling.
    """
    body_str = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    body_bytes = body_str.encode("utf-8")
    content_hash = hashlib.sha1(body_bytes).hexdigest()
    etag = f'"{content_hash}"'

    client_etag = request.headers.get("if-none-match")
    if client_etag:
        client_clean = client_etag.strip().lstrip("W/").strip('"')
        if client_clean == content_hash:
            return Response(
                status_code=status.HTTP_304_NOT_MODIFIED,
                headers={
                    "ETag": etag,
                    "Cache-Control": "no-cache, must-revalidate",
                },
            )

    return Response(
        content=body_bytes,
        media_type="application/json",
        headers={
            "ETag": etag,
            "Cache-Control": "no-cache, must-revalidate",
        },
    )


def seed_users(db: Session):
    admin_id = (os.getenv("ADMIN_ID") or os.getenv("ADMIN_EMAIL") or "").strip()
    admin_pass = (os.getenv("ADMIN_PASS") or os.getenv("ADMIN_PASSWORD") or "").strip()

    if not admin_id or not admin_pass:
        print("[Seed Notice] ADMIN_ID (or ADMIN_EMAIL) and ADMIN_PASS (or ADMIN_PASSWORD) not set in environment. Skipping admin pre-seeding.")
        return

    try:
        admin_email = admin_id.lower()
        user = db.query(User).filter(User.email == admin_email).first()
        if not user:
            db.add(
                User(
                    email=admin_email,
                    password_hash=hash_password(admin_pass),
                    name=os.getenv("ADMIN_NAME", "Chef Admin"),
                    role="admin",
                )
            )
            db.commit()
            print(f"[Seed Notice] Admin user '{admin_email}' pre-seeded successfully.")
        elif user.role != "admin":
            user.role = "admin"
            db.commit()
            print(f"[Seed Notice] Updated existing user '{admin_email}' to admin role.")
    except Exception as e:
        db.rollback()
        print(f"[Seed Notice] Seeding skipped or already applied: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Retry loop to gracefully wait if the PostgreSQL container is initializing
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                seed_users(db)
            print("[PostgreSQL] Connected and schema initialized successfully.")
            break
        except Exception as e:
            if attempt < max_retries:
                print(f"[PostgreSQL Notice] Connection attempt {attempt}/{max_retries} failed: {e}. Retrying in 2s...")
                await asyncio.sleep(2)
            else:
                print(f"[PostgreSQL Error] Unable to connect after {max_retries} attempts: {e}")
    yield


app = FastAPI(title="Momo Loyalty API", lifespan=lifespan)

cors_env = os.getenv("CORS_ORIGINS")
if not cors_env or not cors_env.strip():
    raise RuntimeError("CORS_ORIGINS environment variable is not set. Application startup aborted.")

origins = [o.strip() for o in cors_env.split(",") if o.strip()]
if not origins:
    raise RuntimeError("CORS_ORIGINS environment variable contains no valid origins.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials="*" not in origins,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["ETag"],
)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


router = APIRouter()


# --- AUTH ---
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if not email:
        raise HTTPException(400, "Email is required.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Account already exists with this email.")
    try:
        user = User(
            email=email,
            password_hash=hash_password(data.password),
            name=(data.name or "").strip(),
            role="user",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "success": True,
            "record": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error registering user: {str(e)}")


@router.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    ident = (data.email or data.identity or "").strip().lower()
    if not ident:
        raise HTTPException(400, "Email is required.")
    user = db.query(User).filter(User.email == ident).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name or "", "role": user.role},
    }


@router.get("/auth/google/url")
def google_auth_url(redirect_uri: Optional[str] = Query(None)):
    url = get_google_oauth_url(redirect_uri)
    return {"url": url}


@router.post("/auth/google")
@router.post("/auth/google/callback")
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    if data.code:
        google_info = exchange_code_for_google_user(data.code, data.redirect_uri)
    elif data.credential or data.id_token:
        google_info = verify_direct_google_id_token(data.credential or data.id_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code or Google credential is required.",
        )

    email = (google_info.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide a valid email address.",
        )

    name = (google_info.get("name") or google_info.get("given_name") or email.split("@")[0]).strip()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # First time login with Google: automatically create account in DB
        try:
            user = User(
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                name=name,
                role="user",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error registering user from Google OAuth: {str(e)}",
            )
    else:
        # User already exists: update name if it was empty
        if not user.name and name:
            try:
                user.name = name
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or "",
            "role": user.role,
        },
    }


@router.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name or "", "role": user.role}


# --- CUSTOMER STAMPS (In-memory 2-min claims + DB approved stamps) ---
@router.post("/stamps/claim", status_code=status.HTTP_201_CREATED)
def claim_stamp(data: StampClaim, user: User = Depends(get_current_user)):
    category = data.category.strip()
    if not category:
        raise HTTPException(400, "Category is required.")
    count = data.count if data.count is not None else 1
    return claims.create_claim(user, category, count)


@router.get("/stamps/my")
def get_my_stamps(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    approved = [
        format_db_stamp(s)
        for s in db.query(Stamp)
        .options(joinedload(Stamp.user))
        .filter(Stamp.user_id == user.id)
        .order_by(desc(Stamp.created_at))
        .all()
    ]
    pending = claims.get_user_pending(user.id)
    return json_etag_response(request, pending + approved)


# --- CHEF ADMIN (Approves memory claims into PostgreSQL) ---
@router.get("/admin/stamps/pending")
def get_pending_stamps(
    request: Request,
    _: User = Depends(get_current_admin),
):
    return json_etag_response(request, claims.get_active_claims())


@router.get("/admin/stamps/history")
def get_history_stamps(
    request: Request,
    limit: int = Query(30, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    stamps = (
        db.query(Stamp)
        .options(joinedload(Stamp.user))
        .order_by(desc(Stamp.created_at))
        .limit(limit)
        .all()
    )
    return json_etag_response(request, [format_db_stamp(s) for s in stamps])


@router.patch("/admin/stamps/{stamp_id}")
@router.put("/admin/stamps/{stamp_id}")
def update_stamp_status(
    stamp_id: str,
    data: StampStatusUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    claim = claims.pop_claim(stamp_id)
    if not claim:
        raise HTTPException(404, "Claim expired (2-min limit) or already processed.")

    status_choice = data.status.strip().lower()
    if status_choice == "approved":
        try:
            raw_count = claim.get("count", 1) or 1
            count = max(1, min(10, int(raw_count)))
            created_stamps = []
            for _ in range(count):
                new_stamp = Stamp(user_id=claim["user_id"], category=claim["category"])
                db.add(new_stamp)
                created_stamps.append(new_stamp)
            db.commit()
            for s in created_stamps:
                db.refresh(s)
            last_stamp = created_stamps[-1]
            last_stamp.user = db.query(User).filter(User.id == claim["user_id"]).first()
            result = format_db_stamp(last_stamp)
            result["count"] = count
            return result
        except Exception as e:
            db.rollback()
            claims.restore_claim(claim)
            raise HTTPException(500, f"Failed to persist approved stamp to PostgreSQL: {str(e)}")
    elif status_choice == "rejected":
        return {"id": stamp_id, "status": "rejected", "count": claim.get("count", 1) or 1}
    else:
        claims.restore_claim(claim)
        raise HTTPException(400, "Invalid status. Allowed values: 'approved' or 'rejected'.")


app.include_router(router)
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
