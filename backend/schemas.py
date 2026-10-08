from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=72)
    name: Optional[str] = Field(default="", max_length=255)


class UserLogin(BaseModel):
    email: Optional[str] = None
    identity: Optional[str] = None
    password: str = Field(min_length=1, max_length=72)


class StampClaim(BaseModel):
    category: str = Field(min_length=1, max_length=100)


class StampStatusUpdate(BaseModel):
    status: str = Field(pattern="^(?i)(approved|rejected)$")
