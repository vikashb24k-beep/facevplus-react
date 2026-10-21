import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "FaceVPlus API"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Security & JWT
    JWT_SECRET: str = "facevplus-super-secure-jwt-secret-key-production-ready-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:5173"

    # ML Pipelines
    FACE_RESEMBLANCE_THRESHOLD: float = 0.55
    VOICE_RESEMBLANCE_THRESHOLD: float = 0.65

    class Config:
        env_file = [
            str(BASE_DIR / "backend" / ".env"),
            str(BASE_DIR / ".env"),
        ]
        extra = "ignore"

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

# Fallback to .streamlit/secrets.toml if Supabase credentials are missing
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    secrets_path = BASE_DIR / ".streamlit" / "secrets.toml"
    if secrets_path.exists():
        try:
            import toml
            secrets = toml.load(secrets_path)
            settings.SUPABASE_URL = settings.SUPABASE_URL or secrets.get("SUPABASE_URL", "")
            settings.SUPABASE_KEY = settings.SUPABASE_KEY or secrets.get("SUPABASE_KEY", "")
        except Exception:
            pass

