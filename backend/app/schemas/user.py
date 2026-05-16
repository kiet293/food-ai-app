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

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None