from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from backend.pb_client import pb_client
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/summary")
async def get_loyalty_summary(user: Dict[str, Any] = Depends(get_current_user)):
    """Calculate punch card counts and free plate availability."""
    try:
        tickets = await pb_client.list_user_tickets(user["id"], user_token=user.get("_token"))
        
        counts = {"Steam Veg": 0, "Afghani": 0, "Fried": 0}
        for t in tickets:
            cat = t.get("category")
            if t.get("status") == "approved" and cat in counts:
                counts[cat] += 1
        
        free_plates = {cat: count // 5 for cat, count in counts.items()}
        current_stamps = {cat: count % 5 for cat, count in counts.items()}
        total_stamps = sum(counts.values())
        total_free_plates = sum(free_plates.values())

        return {
            "total_approved_stamps": total_stamps,
            "total_free_plates_available": total_free_plates,
            "stamps_per_category": counts,
            "current_card_stamps": current_stamps,
            "free_plates_per_category": free_plates,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate stats: {e}")
