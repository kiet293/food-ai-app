from typing import Optional
from pydantic import BaseModel, Field
from typing import List

# 1. Định nghĩa cấu trúc giống hệt interface bên React Native
class Ingredient(BaseModel):
    name: str
    probability: int

class AIAnalysisResult(BaseModel):
    ingredients: List[Ingredient]
    recipeName: str
    instructions: List[str]
    imageUrl: Optional[str] = None

class RecipeChatRequest(BaseModel):
    ingredients: List[str] # Danh sách nguyên liệu App đang có
    current_recipe: str # Tên món ăn hiện tại AI vừa gợi ý
    user_message: str # Lời nhắn của người dùng (VD: "Đổi món nước đi")

class RecipeSearchRequest(BaseModel):
    ingredients: List[str]

class RecipeSearchResponse(BaseModel):
    recipes: List[AIAnalysisResult]

class CommentCreate(BaseModel):
    content: str

class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=5, description="Điểm đánh giá từ 1 đến 5 sao")