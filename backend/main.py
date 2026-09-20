import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.config import settings
from backend.routers import auth, tickets, stats

app = FastAPI(
    title="Project Momos API",
    description="Digital Loyalty Card System for Momo Food Truck with PocketBase",
    version="2.0.0",
)

# CORS Configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(stats.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "project-momos-backend",
        "pocketbase_url": settings.POCKETBASE_URL,
    }

# Mount React static frontend if dist/ directory exists
static_dir_path = Path(settings.STATIC_DIR)
if static_dir_path.exists() and (static_dir_path / "index.html").exists():
    # Mount assets folder for JS/CSS
    assets_dir = static_dir_path / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve index.html for root and any non-API routes (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow static files directly in dist (e.g. favicon.svg, icons.svg)
        potential_file = static_dir_path / full_path
        if full_path and potential_file.is_file():
            return FileResponse(potential_file)
        return FileResponse(static_dir_path / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "message": "Project Momos FastAPI Backend is Running",
            "docs": "/docs",
            "api_health": "/api/health",
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
