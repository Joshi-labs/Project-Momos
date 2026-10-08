import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@192.168.1.10:5432/momo_db"
)

# Normalize postgres:// to postgresql:// if needed (e.g., from Heroku/Supabase)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


if not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+")):
    raise ValueError(
        f"Unsupported database scheme. Only PostgreSQL is supported: {DATABASE_URL}"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
