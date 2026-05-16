from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.models.database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True) # Tên đăng nhập không được trùng

    hashed_password = Column(String) # BẮT BUỘC: Không bao giờ lưu mật khẩu gốc, phải lưu bản đã mã hóa

    full_name = Column(String, nullable = True)

    avatar = Column(String, default="👨‍🍳")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())