from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class Ingredient(BaseModel):
    name: str
    probability: int

class AIAnalysisResult(BaseModel):
    ingredients: List[Ingredient]
    recipeName: str
    instructions: List[str]
    imageUrl: Optional[str] = None

class RecipeChatRequest(BaseModel):
    ingredients: List[str]
    current_recipe: str
    user_message: str

class RecipeSearchRequest(BaseModel):
    ingredients: List[str]

class RecipeSearchResponse(BaseModel):
    recipes: List[AIAnalysisResult]

class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=5, description="Điểm đánh giá từ 1 đến 5 sao")

class RateRecipeRequest(BaseModel):
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    usage_count: int
    
