from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text  # type: ignore
from sqlalchemy.sql import func  # type: ignore
from sqlalchemy.orm import relationship, backref # type: ignore
from app.models.database import Base

class RecipeDB(Base):
    __tablename__ = "recipes"

    # ID tự tăng
    id = Column(Integer, primary_key=True, index=True)

    # Giả lập User ID
    user_id = Column(Integer, ForeignKey("users.id"))

    # Các quan hệ (Relationships)
    author = relationship("UserDB", backref="recipes")
    comments = relationship("CommentDB", backref="recipe", cascade="all, delete-orphan")
    ratings = relationship("RatingDB", backref="recipe", cascade="all, delete-orphan")

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


class CommentDB(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Lấy thông tin user đăng bình luận
    user = relationship("UserDB")
    replies = relationship("CommentDB", backref=backref("parent", remote_side=[id]))


class RatingDB(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, nullable=False) # VD: từ 1 đến 5 sao
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("UserDB")

class CategoryDB(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RecipeCategoryDB(Base):
    __tablename__ = "recipe_categories"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TagDB(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(60), unique=True, nullable=False)
    usage_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RecipeTagDB(Base):
    __tablename__ = "recipe_tags"

    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())