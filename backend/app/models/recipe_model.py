from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from app.models.database import Base

class RecipeDB(Base):
    __tablename__ = "recipes"

    # ID tự tăng
    id = Column(Integer, primary_key=True, index=True)

    # Giả lập User ID (Như đã bàn, tạm thời ép cứng là user số 1)
    user_id = Column(Integer, default=1, index=True)

    # Tên món ăn
    recipe_name = Column(String, index=True)

    # Nguyên liệu (Lưu dạng JSON)
    ingredients = Column(JSON)

    # Hướng dẫn (Lưu dạng JSON)
    instructions = Column(JSON)

    # Tự động lưu thời gian tạo
    created_at = Column(DateTime(timezone=True), server_default=func.now())