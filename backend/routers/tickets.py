from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Dict, Any, List
from backend.pb_client import pb_client
from backend.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

ALLOWED_CATEGORIES = {"Steam Veg", "Afghani", "Fried"}
ALLOWED_STATUSES = {"pending", "approved", "rejected"}

class ClaimTicketRequest(BaseModel):
    category: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        if v not in ALLOWED_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return v

class UpdateStatusRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in {"approved", "rejected"}:
            raise ValueError("Status must be either 'approved' or 'rejected'")
        return v

@router.post("/claim")
async def claim_ticket(req: ClaimTicketRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """User claims a purchase for 1 stamp in a category."""
    try:
        user_id = user["id"]
        ticket = await pb_client.create_ticket(
            user_id=user_id,
            category=req.category,
            user_token=user.get("_token"),
        )
        return {
            "success": True,
            "message": f"Claim for {req.category} submitted! Awaiting counter chef approval.",
            "ticket": ticket,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit ticket: {e}")

@router.get("/my")
async def get_my_tickets(user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve all tickets belonging to the logged-in customer."""
    try:
        tickets = await pb_client.list_user_tickets(user["id"], user_token=user.get("_token"))
        return {"tickets": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tickets: {e}")

@router.get("/admin/pending")
async def get_admin_pending_tickets(admin: Dict[str, Any] = Depends(require_admin)):
    """Retrieve all pending tickets in FIFO order for live counter display."""
    try:
        tickets = await pb_client.list_admin_pending_tickets()
        return {"pending": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending tickets: {e}")

@router.get("/admin/history")
async def get_admin_history_tickets(limit: int = 30, admin: Dict[str, Any] = Depends(require_admin)):
    """Retrieve recently processed tickets for admin verification audit log."""
    try:
        tickets = await pb_client.list_admin_history_tickets(limit=limit)
        return {"history": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ticket history: {e}")

@router.patch("/admin/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    req: UpdateStatusRequest,
    admin: Dict[str, Any] = Depends(require_admin),
):
    """Admin approves or rejects a customer's pending ticket."""
    try:
        updated = await pb_client.update_ticket_status(ticket_id, req.status)
        return {
            "success": True,
            "message": f"Ticket {ticket_id} marked as {req.status}",
            "ticket": updated,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update ticket: {e}")
