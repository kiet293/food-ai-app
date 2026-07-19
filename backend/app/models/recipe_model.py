from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey  # type: ignore
from sqlalchemy.sql import func  # type: ignore
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
    
    # Bổ sung các cột mới theo US-06
    description = Column(String, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    servings = Column(Integer, nullable=True)
    difficulty = Column(String, nullable=True)

    # Tự động lưu thời gian tạo và cập nhật
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RecipeStatsDB(Base):
    __tablename__ = "recipe_stats"

    id = Column(Integer, primary_key=True, index=True)
    
    # Tên món ăn (Unique để tăng đếm theo tên món)
    recipe_name = Column(String, unique=True, index=True)
    
    # Số lần AI gợi ý món ăn này
    scan_count = Column(Integer, default=0)
    
    # Số lần người dùng bấm lưu món ăn này
    save_count = Column(Integer, default=0)
    
    # Các trường dữ liệu bổ sung để hiển thị trực tiếp từ bảng xếp hạng
    ingredients = Column(JSON)
    instructions = Column(JSON)
    image_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())