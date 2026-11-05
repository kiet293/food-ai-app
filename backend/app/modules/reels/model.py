from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text  # type: ignore
from sqlalchemy.sql import func  # type: ignore
from sqlalchemy.orm import relationship, backref  # type: ignore
from app.db.base import Base

class ReelDB(Base):
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_url = Column(String, nullable=False)
    poster_url = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    view_count = Column(Integer, default=0, nullable=False)

    # Relationships
    author = relationship("UserDB", backref="reels")
    recipe = relationship("RecipeDB")
    likes = relationship("ReelLikeDB", backref="reel", cascade="all, delete-orphan")
    comments = relationship("ReelCommentDB", backref="reel", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ReelLikeDB(Base):
    __tablename__ = "reel_likes"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReelCommentDB(Base):
    __tablename__ = "reel_comments"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("reel_comments.id", ondelete="CASCADE"), nullable=True)

    # Relationship to get commenter info easily
    user = relationship("UserDB")
    likes = relationship("ReelCommentLikeDB", backref="comment", cascade="all, delete-orphan")
    replies = relationship("ReelCommentDB", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReelCommentLikeDB(Base):
    __tablename__ = "reel_comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("reel_comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
