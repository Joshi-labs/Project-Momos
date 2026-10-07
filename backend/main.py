import os
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc

from database import engine, Base, get_db, SessionLocal
from models import User, Stamp
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuthResponse,
    StampClaim,
    StampStatusUpdate,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
)

load_dotenv()


def format_stamp(s: Stamp) -> dict:
    created_iso = s.created_at.isoformat() if s.created_at else datetime.now(timezone.utc).isoformat()
    updated_iso = s.updated_at.isoformat() if s.updated_at else created_iso

    return {
        "id": s.id,
        "user": s.user_id,
        "user_id": s.user_id,
        "category": s.category,
        "status": s.status,
        "created": created_iso,
        "created_at": created_iso,
        "updated": updated_iso,
        "updated_at": updated_iso,
        "expand": {
            "user": {
                "id": s.user.id,
                "email": s.user.email,
                "name": s.user.name or "",
                "role": s.user.role,
            }
        } if s.user else None,
    }


def seed_default_users(db: Session):
    try:
        admin = db.query(User).filter(User.email == "admin@momo.com").first()
        if not admin:
            admin_user = User(
                email="admin@momo.com",
                password_hash=hash_password("admin123"),
                name="Chef Admin",
                role="admin",
            )
            db.add(admin_user)

        customer = db.query(User).filter(User.email == "customer@momo.com").first()
        if not customer:
            customer_user = User(
                email="customer@momo.com",
                password_hash=hash_password("customer123"),
                name="Rahul Sharma",
                role="user",
            )
            db.add(customer_user)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Notice] User seeding skipped or already completed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables and initial users if DB is connected
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] PostgreSQL tables verified/created successfully.")
        db = SessionLocal()
        try:
            seed_default_users(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[Database Warning] Could not automatically connect or initialize tables: {e}")
        print("Please check your DATABASE_URL in backend/.env or run schema.sql in PostgreSQL.")
    yield


app = FastAPI(
    title="Momo Food Truck Loyalty API",
    description="Backend API for Momo loyalty punch cards and chef admin verification",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "https://momoos.shop",
        "https://www.momoos.shop",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Momo Food Truck API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth/* (or /api/auth/*)",
            "stamps": "/stamps/* (or /api/stamps/*)",
            "admin": "/admin/* (or /api/admin/*)",
        },
    }


# Router for core endpoints (clean URLs without repeating /api)
api_router = APIRouter()


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@api_router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_data.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    new_user = User(
        email=email_clean,
        password_hash=hash_password(user_data.password),
        name=user_data.name.strip() if user_data.name else "",
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "record": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
        },
    }


@api_router.post("/auth/login", response_model=AuthResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    identifier = (login_data.email or login_data.identity or "").strip().lower()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or identity is required.",
        )

    user = db.query(User).filter(User.email == identifier).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or "",
            "role": user.role,
        },
    }


@api_router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name or "",
        "role": current_user.role,
    }


# ==========================================
# STAMP ENDPOINTS (CUSTOMER)
# ==========================================

@api_router.post("/stamps/claim", status_code=status.HTTP_201_CREATED)
def claim_stamp(
    stamp_in: StampClaim,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not stamp_in.category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stamp category is required.",
        )

    new_stamp = Stamp(
        user_id=current_user.id,
        category=stamp_in.category,
        status="pending",
    )
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)

    new_stamp.user = current_user
    return format_stamp(new_stamp)


@api_router.get("/stamps/my")
def get_my_stamps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stamps = (
        db.query(Stamp)
        .filter(Stamp.user_id == current_user.id)
        .order_by(desc(Stamp.created_at))
        .all()
    )
    return [format_stamp(s) for s in stamps]


# ==========================================
# ADMIN STAMP ENDPOINTS (CHEF CONSOLE)
# ==========================================

@api_router.get("/admin/stamps/pending")
def get_admin_pending_stamps(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # FIFO queue: pending stamps ordered by created_at ascending
    stamps = (
        db.query(Stamp)
        .options(joinedload(Stamp.user))
        .filter(Stamp.status == "pending")
        .order_by(asc(Stamp.created_at))
        .all()
    )
    return [format_stamp(s) for s in stamps]


@api_router.get("/admin/stamps/history")
def get_admin_history_stamps(
    limit: int = Query(default=30, ge=1, le=200),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Processed history: status != 'pending', ordered by updated_at descending
    stamps = (
        db.query(Stamp)
        .options(joinedload(Stamp.user))
        .filter(Stamp.status != "pending")
        .order_by(desc(Stamp.updated_at))
        .limit(limit)
        .all()
    )
    return [format_stamp(s) for s in stamps]


@api_router.patch("/admin/stamps/{stamp_id}")
@api_router.put("/admin/stamps/{stamp_id}")
def update_stamp_status(
    stamp_id: int,
    status_update: StampStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    valid_statuses = {"approved", "rejected", "pending"}
    new_status = status_update.status.lower().strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    stamp = (
        db.query(Stamp)
        .options(joinedload(Stamp.user))
        .filter(Stamp.id == stamp_id)
        .first()
    )
    if not stamp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stamp with id {stamp_id} not found.",
        )

    stamp.status = new_status
    stamp.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(stamp)

    return format_stamp(stamp)


# Mount routes at root (e.g., https://api.momoos.shop/auth/login)
app.include_router(api_router)

# Mount routes at /api as well for compatibility (e.g., https://api.momoos.shop/api/auth/login)
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
