from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: Optional[str] = ""


class UserLogin(BaseModel):
    # Support both email and identity fields for backwards compatibility
    email: Optional[str] = None
    identity: Optional[str] = None
    password: str


class UserBrief(BaseModel):
    id: int
    email: str
    name: Optional[str] = ""
    role: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = ""
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class StampClaim(BaseModel):
    category: str


class StampStatusUpdate(BaseModel):
    status: str  # 'approved' or 'rejected'


class StampExpand(BaseModel):
    user: Optional[UserBrief] = None


class StampResponse(BaseModel):
    id: int
    user: int
    user_id: int
    category: str
    status: str
    created: datetime
    created_at: datetime
    updated: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expand: Optional[StampExpand] = None

    class Config:
        from_attributes = True
