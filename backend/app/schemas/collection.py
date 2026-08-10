from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Tên bộ sưu tập không được để trống và tối đa 100 ký tự")
    cover_image: Optional[str] = None

class CollectionResponse(BaseModel):
    id: int
    user_id: int
    name: str
    cover_image: Optional[str] = None
    recipe_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecipeSummary(BaseModel):
    id: int
    recipe_name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class CollectionDetailResponse(CollectionResponse):
    recipes: List[RecipeSummary] = []

class CollectionRecipeAdd(BaseModel):
    recipe_id: int

class RecipeInCollectionsResponse(BaseModel):
    recipe_id: int
    collection_ids: List[int] = []

