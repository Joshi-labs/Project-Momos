import httpx
from typing import Optional, Dict, Any, List
from backend.config import settings

class PocketBaseClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.POCKETBASE_URL).rstrip("/")
        self.admin_token: Optional[str] = None

    async def get_admin_token(self) -> str:
        """Authenticate as PocketBase superadmin/admin and return JWT token."""
        if self.admin_token:
            return self.admin_token

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # PocketBase v0.23+ superusers or legacy admins
                payload = {
                    "identity": settings.POCKETBASE_ADMIN_EMAIL,
                    "password": settings.POCKETBASE_ADMIN_PASSWORD,
                }
                # Try superusers auth first (PB v0.23+)
                res = await client.post(
                    f"{self.base_url}/api/collections/_superusers/auth-with-password",
                    json=payload,
                )
                if res.status_code == 404:
                    # Fallback to legacy admin auth (PB < v0.23)
                    res = await client.post(
                        f"{self.base_url}/api/admins/auth-with-password",
                        json=payload,
                    )
                if res.status_code == 200:
                    data = res.json()
                    self.admin_token = data.get("token")
                    return self.admin_token
            except Exception as e:
                print(f"[PocketBaseClient] Admin login failed: {e}")
        return ""

    async def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify user JWT token by calling auth-refresh against PocketBase."""
        if not token:
            return None
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(
                    f"{self.base_url}/api/collections/users/auth-refresh",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if res.status_code == 200:
                    data = res.json()
                    record = data.get("record", {})
                    return record
            except Exception as e:
                print(f"[PocketBaseClient] Verify token error: {e}")
        return None

    async def login_user(self, identity: str, password: str) -> Dict[str, Any]:
        """Authenticate user with email/username and password."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.base_url}/api/collections/users/auth-with-password",
                json={"identity": identity, "password": password},
            )
            if res.status_code != 200:
                error_msg = "Invalid credentials"
                try:
                    error_msg = res.json().get("message", error_msg)
                except Exception:
                    pass
                raise ValueError(error_msg)
            return res.json()

    async def register_user(self, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Create a new user record in PocketBase users collection."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "email": email,
                "password": password,
                "passwordConfirm": password,
                "name": name or email.split("@")[0],
                "role": "user",
            }
            res = await client.post(
                f"{self.base_url}/api/collections/users/records",
                json=payload,
            )
            if res.status_code not in (200, 201):
                error_msg = "Registration failed"
                try:
                    error_msg = res.json().get("message", error_msg)
                except Exception:
                    pass
                raise ValueError(error_msg)
            return res.json()

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user record by ID using admin credentials."""
        token = await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{self.base_url}/api/collections/users/records/{user_id}",
                headers=headers,
            )
            if res.status_code == 200:
                return res.json()
        return None

    # Tickets operations
    async def create_ticket(self, user_id: str, category: str, user_token: Optional[str] = None) -> Dict[str, Any]:
        """Submit a new pending loyalty ticket."""
        token = user_token or await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.base_url}/api/collections/tickets/records",
                headers=headers,
                json={
                    "user": user_id,
                    "category": category,
                    "status": "pending",
                },
            )
            if res.status_code not in (200, 201):
                error_msg = "Failed to create ticket"
                try:
                    error_msg = res.json().get("message", error_msg)
                except Exception:
                    pass
                raise ValueError(error_msg)
            return res.json()

    async def list_user_tickets(self, user_id: str, user_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all tickets for a specific user ordered by created descending."""
        token = user_token or await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{self.base_url}/api/collections/tickets/records",
                headers=headers,
                params={
                    "filter": f"user = '{user_id}'",
                    "sort": "-created",
                    "perPage": 200,
                },
            )
            if res.status_code == 200:
                return res.json().get("items", [])
        return []

    async def list_admin_pending_tickets(self) -> List[Dict[str, Any]]:
        """Get all pending tickets in FIFO order (oldest first) with expanded user."""
        token = await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{self.base_url}/api/collections/tickets/records",
                headers=headers,
                params={
                    "filter": "status = 'pending'",
                    "sort": "+created",
                    "expand": "user",
                    "perPage": 100,
                },
            )
            if res.status_code == 200:
                return res.json().get("items", [])
        return []

    async def list_admin_history_tickets(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Get recent processed tickets (approved or rejected) with expanded user."""
        token = await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{self.base_url}/api/collections/tickets/records",
                headers=headers,
                params={
                    "filter": "status != 'pending'",
                    "sort": "-created",
                    "expand": "user",
                    "perPage": limit,
                },
            )
            if res.status_code == 200:
                return res.json().get("items", [])
        return []

    async def update_ticket_status(self, ticket_id: str, new_status: str) -> Dict[str, Any]:
        """Update ticket status (approved | rejected)."""
        token = await self.get_admin_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.patch(
                f"{self.base_url}/api/collections/tickets/records/{ticket_id}",
                headers=headers,
                json={"status": new_status},
            )
            if res.status_code != 200:
                error_msg = f"Failed to update ticket {ticket_id}"
                try:
                    error_msg = res.json().get("message", error_msg)
                except Exception:
                    pass
                raise ValueError(error_msg)
            return res.json()

pb_client = PocketBaseClient()
