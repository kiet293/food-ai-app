from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text, Boolean, Float  # type: ignore
from sqlalchemy.sql import func  # type: ignore
from sqlalchemy.orm import relationship, backref  # type: ignore
from sqlalchemy import UniqueConstraint
from app.models.database import Base

class RecipeDB(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    author = relationship("UserDB", backref="recipes")
    comments = relationship("CommentDB", backref="recipe", cascade="all, delete-orphan")
    ratings = relationship("RatingDB", backref="recipe", cascade="all, delete-orphan")
    favorites = relationship("FavoriteDB", backref="recipe", cascade="all, delete-orphan")
    collection_associations = relationship("CollectionRecipeDB", back_populates="recipe", cascade="all, delete-orphan")

    recipe_name = Column(String, index=True)
    ingredients = Column(JSON)
    instructions = Column(JSON)
    image_url = Column(String, nullable=True)
    
    description = Column(String, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    servings = Column(Integer, nullable=True)
    difficulty = Column(String, nullable=True)

    trending_score = Column(Float, default=0.0, index=True)
    is_ai = Column(Boolean, default=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RecipeStatsDB(Base):
    __tablename__ = "recipe_stats"

    id = Column(Integer, primary_key=True, index=True)
    recipe_name = Column(String, unique=True, index=True)
    scan_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    ingredients = Column(JSON)
    instructions = Column(JSON)
    image_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CommentDB(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content = Column(Text, nullable=False)
    
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("UserDB")
    replies = relationship("CommentDB", backref=backref("parent", remote_side=[id]))


class RatingDB(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint('recipe_id', 'user_id', name='uq_rating_user_recipe'),)

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    score = Column(Integer, nullable=False)
    
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

class FavoriteDB(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint('recipe_id', 'user_id', name='uq_favorite_user_recipe'),)

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserDB")
