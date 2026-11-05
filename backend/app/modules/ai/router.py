from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.modules.ai.service import AIService
from app.modules.recipes.schemas import AIAnalysisResult, RecipeChatRequest, RecipeSearchRequest, RecipeSearchResponse

router = APIRouter(prefix="/ai", tags=["AI Analysis"])


# Synchronous endpoints run blocking inference, SDK calls and ORM in the worker pool.
@router.post("/analyze", response_model=AIAnalysisResult)
def analyze_image(image_files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    return AIService.analyze_image(image_files, db)


@router.post("/chat", response_model=AIAnalysisResult)
def chat_for_new_recipe(request: RecipeChatRequest, db: Session = Depends(get_db)):
    return AIService.chat_for_new_recipe(request, db)


@router.post("/search", response_model=RecipeSearchResponse)
def search_recipes_by_ingredients(request: RecipeSearchRequest, db: Session = Depends(get_db)):
    return AIService.search_recipes_by_ingredients(request, db)
