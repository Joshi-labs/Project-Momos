from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from backend.pb_client import pb_client

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    identity: str
    password: str

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency to extract and verify PocketBase user token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication credentials missing or invalid")
    token = authorization.split("Bearer ")[1].strip()
    user = await pb_client.verify_user_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")
    # Attach raw token for downstream calls if needed
    user["_token"] = token
    return user

async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to enforce admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@router.post("/register")
async def register(req: RegisterRequest):
    try:
        data = await pb_client.register_user(req.email, req.password, req.name)
        return {"success": True, "message": "User registered successfully", "record": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {e}")

@router.post("/login")
async def login(req: LoginRequest):
    try:
        data = await pb_client.login_user(req.identity, req.password)
        return {
            "token": data.get("token"),
            "user": data.get("record"),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {e}")

@router.get("/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role", "user"),
        "created": user.get("created"),
    }
