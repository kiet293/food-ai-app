from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.database import Base

class CollectionRecipeDB(Base):
    __tablename__ = "collection_recipes"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), index=True, nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), index=True, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recipe = relationship("RecipeDB")
    collection = relationship("CollectionDB", back_populates="recipe_associations")


class CollectionDB(Base):
    __tablename__ = "collections"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    cover_image = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("UserDB", backref="collections")
    recipe_associations = relationship("CollectionRecipeDB", back_populates="collection", cascade="all, delete-orphan")
