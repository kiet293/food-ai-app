from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.modules.recipes.schemas import TagResponse
from app.modules.recipes.services.tag_service import RecipeTagService


router = APIRouter(tags=["Comments & Tags"])


@router.get("/tags/hot", response_model=List[TagResponse])
def get_hot_tags(db: Session = Depends(get_db)):
    return RecipeTagService.get_hot_tags(db)
