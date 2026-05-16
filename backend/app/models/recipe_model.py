from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.database import Base

class RecipeDB(Base):
    __tablename__ = "recipes"

    # ID tự tăng
    id = Column(Integer, primary_key=True, index=True)

    # Giả lập User ID
    user_id = Column(Integer, ForeignKey("users.id"))

    # Tên món ăn
    recipe_name = Column(String, index=True)

    # Nguyên liệu (Lưu dạng JSON)
    ingredients = Column(JSON)

    # Hướng dẫn (Lưu dạng JSON)
    instructions = Column(JSON)

    # Cột lưu hình ảnh
    image_url = Column(String, nullable=True)
    
    # Tự động lưu thời gian tạo
    created_at = Column(DateTime(timezone=True), server_default=func.now())