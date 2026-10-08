import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from database import engine, Base, get_db, SessionLocal
from models import User, Stamp
from schemas import UserRegister, UserLogin, StampClaim, StampStatusUpdate
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_admin
import claims

load_dotenv()


def format_db_stamp(s: Stamp) -> dict:
    iso = s.created_at.isoformat() if s.created_at else ""
    return {
        "id": s.id, "user": s.user_id, "category": s.category, "status": "approved",
        "created": iso, "created_at": iso,
        "expand": {
            "user": {"id": s.user.id, "email": s.user.email, "name": s.user.name or "", "role": s.user.role}
        } if s.user else None,
    }


def seed_users(db: Session):
    if not db.query(User).filter(User.email == "admin@momo.com").first():
        db.add(User(email="admin@momo.com", password_hash=hash_password("admin123"), name="Chef Admin", role="admin"))
    if not db.query(User).filter(User.email == "customer@momo.com").first():
        db.add(User(email="customer@momo.com", password_hash=hash_password("customer123"), name="Vishwash Joshi", role="user"))
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_users(db)
    except Exception as e:
        print(f"[DB Notice] Startup init skipped: {e}")
    yield


app = FastAPI(title="Momo Loyalty API", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "https://momoos.shop,https://www.momoos.shop").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials="*" not in origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


# --- AUTH ---
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Account already exists with this email.")
    user = User(email=email, password_hash=hash_password(data.password), name=data.name.strip() if data.name else "")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "record": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}


@router.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    ident = (data.email or data.identity or "").strip().lower()
    user = db.query(User).filter(User.email == ident).first() if ident else None
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name or "", "role": user.role}}


@router.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name or "", "role": user.role}


# --- CUSTOMER STAMPS (In-memory 2-min claims + DB approved stamps) ---
@router.post("/stamps/claim", status_code=status.HTTP_201_CREATED)
def claim_stamp(data: StampClaim, user: User = Depends(get_current_user)):
    if not data.category:
        raise HTTPException(400, "Category is required.")
    return claims.create_claim(user, data.category)


@router.get("/stamps/my")
def get_my_stamps(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    approved = [format_db_stamp(s) for s in db.query(Stamp).filter(Stamp.user_id == user.id).order_by(desc(Stamp.created_at)).all()]
    pending = claims.get_user_pending(user.id)
    return pending + approved


# --- CHEF ADMIN (Approves memory claims into PostgreSQL) ---
@router.get("/admin/stamps/pending")
def get_pending_stamps(_: User = Depends(get_current_admin)):
    return claims.get_active_claims()


@router.get("/admin/stamps/history")
def get_history_stamps(limit: int = Query(30, ge=1, le=100), _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    stamps = db.query(Stamp).options(joinedload(Stamp.user)).order_by(desc(Stamp.created_at)).limit(limit).all()
    return [format_db_stamp(s) for s in stamps]


@router.patch("/admin/stamps/{stamp_id}")
@router.put("/admin/stamps/{stamp_id}")
def update_stamp_status(stamp_id: str, data: StampStatusUpdate, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    claim = claims.pop_claim(stamp_id)
    if not claim:
        raise HTTPException(404, "Claim expired (2-min limit) or already processed.")

    if data.status.lower() == "approved":
        new_stamp = Stamp(user_id=claim["user_id"], category=claim["category"])
        db.add(new_stamp)
        db.commit()
        db.refresh(new_stamp)
        new_stamp.user = db.query(User).filter(User.id == claim["user_id"]).first()
        return format_db_stamp(new_stamp)

    return {"id": stamp_id, "status": "rejected"}


# Mount endpoints at root (and /api for compatibility)
app.include_router(router)
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
