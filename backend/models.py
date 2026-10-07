from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), default="")
    role = Column(String(50), default="user")  # 'user' or 'admin'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stamps = relationship("Stamp", back_populates="user", cascade="all, delete-orphan")


class Stamp(Base):
    __tablename__ = "stamps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # 'Steam Veg', 'Afghani', 'Fried'
    status = Column(String(50), default="pending", index=True)  # 'pending', 'approved', 'rejected'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="stamps")

