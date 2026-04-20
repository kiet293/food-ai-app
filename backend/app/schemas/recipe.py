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