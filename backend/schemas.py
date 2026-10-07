from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: Optional[str] = ""


class UserLogin(BaseModel):
    email: Optional[str] = None
    identity: Optional[str] = None
    password: str


class StampClaim(BaseModel):
    category: str


class StampStatusUpdate(BaseModel):
    status: str  # 'approved' or 'rejected'
