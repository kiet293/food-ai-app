from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.user_model import UserDB
from app.schemas.user import ChefResponse
from app.utils.response import success_response

router = APIRouter()

@router.get("/popular-chefs", response_model=dict)
def get_popular_chefs(db: Session = Depends(get_db)):
    chefs = db.query(UserDB).order_by(UserDB.follower_count.desc()).limit(20).all()
    # Serialize to standard response
    chef_data = [
        {
            "id": str(chef.id),
            "name": chef.full_name or chef.username,
            "avatar": chef.avatar or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
            "isFollowing": False,
            "follower_count": chef.follower_count
        }
        for chef in chefs
    ]
    return success_response(data=chef_data, message="Fetched popular chefs successfully")
