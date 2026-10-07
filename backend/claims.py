import time
from datetime import datetime, timezone
from typing import Optional, List, Dict

CLAIM_TTL_SECONDS = 120  # 2 minutes in memory

# In-memory dictionary: claim_id -> claim dict
_claims: Dict[str, dict] = {}


def _cleanup_expired():
    now = time.time()
    expired_keys = [k for k, v in _claims.items() if v["expires_at"] < now]
    for k in expired_keys:
        _claims.pop(k, None)


def create_claim(user, category: str) -> dict:
    _cleanup_expired()
    # Remove any existing pending claim for this user to prevent duplicate spam
    for k in [k for k, v in _claims.items() if v["user_id"] == user.id]:
        _claims.pop(k, None)

    claim_id = f"claim_{int(time.time() * 1000)}"
    now_iso = datetime.now(timezone.utc).isoformat()

    claim = {
        "id": claim_id,
        "user_id": user.id,
        "user": user.id,
        "category": category,
        "status": "pending",
        "created": now_iso,
        "created_at": now_iso,
        "expires_at": time.time() + CLAIM_TTL_SECONDS,
        "expand": {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name or "",
                "role": user.role,
            }
        },
    }
    _claims[claim_id] = claim
    return claim


def get_active_claims() -> List[dict]:
    _cleanup_expired()
    return list(_claims.values())


def get_user_pending(user_id: int) -> List[dict]:
    _cleanup_expired()
    return [v for v in _claims.values() if v["user_id"] == user_id]


def pop_claim(claim_id: str) -> Optional[dict]:
    _cleanup_expired()
    return _claims.pop(str(claim_id), None)

