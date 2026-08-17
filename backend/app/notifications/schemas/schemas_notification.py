from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActorInfo(BaseModel):
    id: int
    name: str
    username: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    message: str 
    actor: Optional[ActorInfo] = None

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    actor_id: Optional[int] = None

class NotificationSettingsResponse(BaseModel):
    user_id: int
    follow_enabled: bool
    like_enabled: bool
    comment_enabled: bool
    rating_enabled: bool
    new_recipe_enabled: bool

    class Config:
        from_attributes = True

class NotificationSettingsUpdate(BaseModel):
    follow_enabled: Optional[bool] = None
    like_enabled: Optional[bool] = None
    comment_enabled: Optional[bool] = None
    rating_enabled: Optional[bool] = None
    new_recipe_enabled: Optional[bool] = None
