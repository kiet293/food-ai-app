from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.models.database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True) # Tên đăng nhập không được trùng

    hashed_password = Column(String) # BẮT BUỘC: Không bao giờ lưu mật khẩu gốc, phải lưu bản đã mã hóa

    full_name = Column(String, nullable = True)

    avatar = Column(String, default="👨‍🍳")
    
    is_admin = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FollowDB(Base):
    __tablename__ = "follows"

    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())