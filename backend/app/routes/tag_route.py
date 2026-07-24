from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.recipe_model import TagDB
from app.schemas.tag import TagResponse

router = APIRouter()

@router.get("/hot", response_model=List[TagResponse])
def get_hot_tags(db: Session = Depends(get_db)):
    hot_tags = db.query(TagDB).order_by(TagDB.usage_count.desc()).limit(10).all()
    return hot_tags
