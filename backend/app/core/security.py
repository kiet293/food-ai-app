from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import get_settings


def get_password_hash(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        from app.core.exceptions import CustomException
        raise CustomException("Mật khẩu tối đa 72 byte UTF-8", "PASSWORD_TOO_LONG", 422)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def create_access_token(data: dict) -> str:
    settings = get_settings()
    if not settings.secret_key:
        raise RuntimeError("SECRET_KEY chưa được cấu hình")

    payload = data.copy()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload.update({"exp": expires_at})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
