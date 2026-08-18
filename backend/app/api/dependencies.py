from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db import get_db
from app.modules.users.model import UserDB
from app.modules.users.repository import UserRepository


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _decode_user_id(token: str) -> int | None:
    settings = get_settings()
    if not settings.secret_key:
        return None
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
        subject = payload.get("sub")
        return int(subject) if subject is not None else None
    except (JWTError, TypeError, ValueError):
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> UserDB:
    user_id = _decode_user_id(token)
    user = UserRepository.get_by_id(db, user_id) if user_id else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không thể xác thực thông tin",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_current_user(
    request: Request, db: Session = Depends(get_db)
) -> Optional[UserDB]:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    user_id = _decode_user_id(token)
    return UserRepository.get_by_id(db, user_id) if user_id else None
