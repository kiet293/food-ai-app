from typing import Optional
from pydantic import BaseModel, Field


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=120)
    bio: Optional[str] = Field(default=None, max_length=255)
    is_admin: Optional[bool] = None


class AdminRecipeUpdate(BaseModel):
    recipe_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    difficulty: Optional[str] = Field(default=None, max_length=50)
    cook_time_minutes: Optional[int] = Field(default=None, ge=0, le=10000)
    servings: Optional[int] = Field(default=None, ge=1, le=1000)
    is_ai: Optional[bool] = None


class AdminCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=120)


class AdminCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = Field(default=None, max_length=120)


class AdminTagUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    slug: Optional[str] = Field(default=None, max_length=60)
