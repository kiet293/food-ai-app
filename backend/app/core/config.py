import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv


load_dotenv()


def _csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    database_url: str
    secret_key: str | None
    jwt_algorithm: str
    access_token_expire_minutes: int
    cors_origins: tuple[str, ...]
    cloudinary_cloud_name: str | None
    cloudinary_api_key: str | None
    cloudinary_api_secret: str | None
    gemini_api_key: str | None
    pexels_api_key: str | None

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Food AI Backend"),
        app_env=os.getenv("APP_ENV", "development"),
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:12345@localhost:5432/food_app_db",
        ),
        secret_key=os.getenv("SECRET_KEY"),
        jwt_algorithm=os.getenv("ALGORITHM", "HS256"),
        access_token_expire_minutes=int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
        ),
        cors_origins=_csv(os.getenv("CORS_ORIGINS", "*")),
        cloudinary_cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        cloudinary_api_key=os.getenv("CLOUDINARY_API_KEY"),
        cloudinary_api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        pexels_api_key=os.getenv("PEXELS_API_KEY"),
    )
