# Momo Food Truck Backend (FastAPI + PostgreSQL)

Fast, lightweight backend for the Momo Food Truck digital loyalty pass & counter verification console.

## 1. Prerequisites
- Python 3.10+
- PostgreSQL (running locally, in Docker, or cloud like Neon / Supabase / Render)

## 2. PostgreSQL Setup
If you have a fresh PostgreSQL instance, you can initialize the database using the provided `schema.sql`:

### Via psql terminal:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database (if not already created)
CREATE DATABASE momo_db;

# Connect to the momo_db database
\c momo_db

# Run the schema script
\i schema.sql
```

### Or in pgAdmin:
1. Open pgAdmin and connect to your server.
2. Right-click **Databases** -> **Create** -> **Database...** (Name it `momo_db`).
3. Open **Query Tool** for `momo_db`.
4. Open or paste `schema.sql` and click **Execute (F5)**.

*Note: The FastAPI app also automatically creates tables on startup if `momo_db` exists!*

## 3. Configure `.env`
Check `backend/.env` and update your PostgreSQL credentials if needed:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/momo_db
SECRET_KEY=momo_food_truck_jwt_secret_key_change_me_in_production
ACCESS_TOKEN_EXPIRE_DAYS=120
CORS_ORIGINS=https://momoos.shop,https://www.momoos.shop
```

## 4. Install & Run
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Interactive API documentation will be available at:
`http://localhost:8000/docs`

## 5. Pre-seeded Test Accounts
- **Admin Chef:** `admin@momo.com` / `admin123`
- **Customer User:** `customer@momo.com` / `customer123`

