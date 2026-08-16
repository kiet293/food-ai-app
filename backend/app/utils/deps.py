from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
from app.models.database import get_db
from app.users.models import UserDB
from app.utils.security import SECRET_KEY, ALGORITHM

# Báo cho hệ thống biết API nào dùng để cấp thẻ
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Giải mã thẻ Token xem bên trong ghi mã ID số mấy
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Vào Database tìm xem có ông nào ID như thế không
    user = db.query(UserDB).filter(UserDB.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user # Trả về thông tin của người đó

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[UserDB]:
    # Giống get_current_user nhưng không bắt buộc đăng nhập (dùng cho API cho phép khách xem)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db.query(UserDB).filter(UserDB.id == int(user_id)).first()
    except JWTError:
        pass
    return None