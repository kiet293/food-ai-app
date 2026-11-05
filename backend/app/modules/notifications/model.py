from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey  # type: ignore
from sqlalchemy.sql import func  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore
from app.db.base import Base

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False)  # 'FOLLOW','LIKE','COMMENT','RATING','NEW_RECIPE'
    reference_type = Column(String(30), nullable=True)
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Relationship
    user = relationship("UserDB", backref="notifications", foreign_keys=[user_id])
    actor = relationship("UserDB", foreign_keys=[actor_id])


class NotificationSettingsDB(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    follow_enabled = Column(Boolean, nullable=False, default=True)
    like_enabled = Column(Boolean, nullable=False, default=True)
    comment_enabled = Column(Boolean, nullable=False, default=True)
    rating_enabled = Column(Boolean, nullable=False, default=True)
    new_recipe_enabled = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("UserDB", backref="notification_setting", uselist=False)
