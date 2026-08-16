from pydantic import BaseModel
from typing import Optional

class ReelCreate(BaseModel):
    video_url: str
    poster_url: Optional[str] = None
    caption: Optional[str] = None
    recipe_id: Optional[int] = None

class ReelCommentCreate(BaseModel):
    content: str
