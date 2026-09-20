import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    POCKETBASE_URL: str = os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090")
    POCKETBASE_ADMIN_EMAIL: str = os.getenv("POCKETBASE_ADMIN_EMAIL", "admin@vpjoshi.in")
    POCKETBASE_ADMIN_PASSWORD: str = os.getenv("POCKETBASE_ADMIN_PASSWORD", "AdminPass123456!")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    STATIC_DIR: str = os.getenv("STATIC_DIR", "dist")

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
