from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None

class ChefResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    follower_count: int = 0

    class Config:
        from_attributes = True
