import os
import json
import asyncio
import httpx
from pathlib import Path

POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090").rstrip("/")
ADMIN_EMAIL = os.getenv("POCKETBASE_ADMIN_EMAIL", "admin@vpjoshi.in")
ADMIN_PASSWORD = os.getenv("POCKETBASE_ADMIN_PASSWORD", "AdminPass123456!")

async def setup():
    print(f"[*] Connecting to PocketBase at {POCKETBASE_URL}...")
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Check health
        try:
            health = await client.get(f"{POCKETBASE_URL}/api/health")
            if health.status_code != 200:
                print(f"[!] PocketBase health check returned: {health.status_code}")
        except Exception as e:
            print(f"[!] Could not connect to PocketBase: {e}")
            print("    Please ensure PocketBase is running (e.g. via docker compose up -d pocketbase).")
            return

        # 1. Authenticate as Superuser / Admin
        admin_token = None
        payload = {"identity": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        
        # Try PB v0.23+ superuser endpoint
        res = await client.post(f"{POCKETBASE_URL}/api/collections/_superusers/auth-with-password", json=payload)
        if res.status_code == 200:
            admin_token = res.json().get("token")
        else:
            # Try legacy admin endpoint
            res2 = await client.post(f"{POCKETBASE_URL}/api/admins/auth-with-password", json=payload)
            if res2.status_code == 200:
                admin_token = res2.json().get("token")

        if not admin_token:
            print("[!] Could not authenticate as PocketBase admin. Creating admin or check credentials...")
            return

        print("[+] Authenticated with PocketBase admin API.")
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Add 'role' field to 'users' collection if not present
        users_col_res = await client.get(f"{POCKETBASE_URL}/api/collections/users", headers=headers)
        if users_col_res.status_code == 200:
            users_col = users_col_res.json()
            fields = users_col.get("schema", [])
            has_role = any(f.get("name") == "role" for f in fields)
            if not has_role:
                print("[*] Adding 'role' field to 'users' collection...")
                fields.append({
                    "name": "role",
                    "type": "select",
                    "required": false,
                    "options": {"maxSelect": 1, "values": ["user", "admin"]}
                })
                users_col["schema"] = fields
                patch_res = await client.patch(
                    f"{POCKETBASE_URL}/api/collections/users",
                    headers=headers,
                    json=users_col
                )
                if patch_res.status_code in (200, 204):
                    print("[+] Added 'role' field to 'users' collection.")
                else:
                    print(f"[!] Warning: Could not patch users schema: {patch_res.text}")
            else:
                print("[+] 'role' field already exists on 'users' collection.")

        # 3. Create or update 'tickets' collection from schema
        schema_path = Path(__file__).parent / "pb_schema.json"
        if schema_path.exists():
            with open(schema_path, "r", encoding="utf-8") as f:
                collections = json.load(f)
                for col_data in collections:
                    name = col_data.get("name")
                    check_res = await client.get(f"{POCKETBASE_URL}/api/collections/{name}", headers=headers)
                    if check_res.status_code == 404:
                        print(f"[*] Creating '{name}' collection...")
                        create_res = await client.post(
                            f"{POCKETBASE_URL}/api/collections",
                            headers=headers,
                            json=col_data
                        )
                        if create_res.status_code in (200, 201):
                            print(f"[+] Collection '{name}' created successfully.")
                        else:
                            print(f"[!] Failed to create '{name}': {create_res.text}")
                    else:
                        print(f"[*] Updating existing '{name}' collection...")
                        patch_res = await client.patch(
                            f"{POCKETBASE_URL}/api/collections/{name}",
                            headers=headers,
                            json=col_data
                        )
                        if patch_res.status_code in (200, 204):
                            print(f"[+] Collection '{name}' updated successfully.")

        print("[✓] PocketBase setup complete.")

if __name__ == "__main__":
    asyncio.run(setup())
