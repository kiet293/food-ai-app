from pydantic import BaseModel
from typing import List

# 1. Định nghĩa cấu trúc giống hệt interface bên React Native
class Ingredient(BaseModel):
    name: str
    probability: int

class AIAnalysisResult(BaseModel):
    ingredients: List[Ingredient]
    recipeName: str
    instructions: List[str]

class RecipeChatRequest(BaseModel):
    ingredients: List[str] # Danh sách nguyên liệu App đang có
    current_recipe: str # Tên món ăn hiện tại AI vừa gợi ý
    user_message: str # Lời nhắn của người dùng (VD: "Đổi món nước đi")