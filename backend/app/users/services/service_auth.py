from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.users.models import UserDB
from app.users.schemas import UserCreate
from app.utils.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register(db: Session, user: UserCreate):
        # Kiểm tra xem tên đăng nhập đã ai dùng chưa
        db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Tên đăng nhập này đã có người sử dụng")

        # Mã hóa mật khẩu và lưu vào DB
        hashed_password = get_password_hash(user.password)
        new_user = UserDB(username=user.username, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Đăng ký xong thì cấp luôn Token để vào app (không cần đăng nhập lại)
        access_token = create_access_token(data={"sub": str(new_user.id)})
        return {"access_token": access_token, "token_type": "bearer"}

    @staticmethod
    def login(db: Session, form_data: OAuth2PasswordRequestForm):
        # Tìm user trong DB
        user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
        
        # Nếu không tìm thấy hoặc sai mật khẩu -> Từ chối
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sai tên đăng nhập hoặc mật khẩu",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Cấp Token
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
