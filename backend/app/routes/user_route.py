from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.database import get_db
from app.models.user_model import UserDB, FollowDB
from app.models.recipe_model import RecipeDB, CollectionDB, CollectionRecipeDB, FavoriteDB
from app.schemas.user import ChefResponse
from app.utils.deps import get_optional_current_user
from app.utils.response import success_response, CustomException

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

@router.get("/{user_id}/profile")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise CustomException(message="User not found", code="USER_NOT_FOUND", status_code=404)

    # Kiểm tra người dùng hiện tại đã theo dõi người này chưa (nếu đã đăng nhập)
    is_following = False
    is_self = False
    if current_user:
        is_self = current_user.id == user.id
        if not is_self:
            is_following = db.query(FollowDB).filter(
                FollowDB.follower_id == current_user.id,
                FollowDB.following_id == user.id
            ).first() is not None
        
    # Get recent recipes authored by this user
    recent_recipes = db.query(RecipeDB).filter(RecipeDB.user_id == user_id).order_by(RecipeDB.created_at.desc()).limit(10).all()
    
    # Get user's collections
    collections = db.query(CollectionDB).filter(CollectionDB.user_id == user_id).order_by(CollectionDB.created_at.desc()).all()
    
    recent_data = [
        {
            "id": str(r.id),
            "title": r.recipe_name,
            "image": r.image_url or "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
        } for r in recent_recipes
    ]
    
    collections_data = []
    for c in collections:
        count = db.query(CollectionRecipeDB).filter(CollectionRecipeDB.collection_id == c.id).count()
        # get image from first recipe if any
        first_cr = db.query(CollectionRecipeDB).filter(CollectionRecipeDB.collection_id == c.id).first()
        image_url = "https://images.unsplash.com/photo-1490818387583-1b5ba4597389?w=500&q=80"
        if first_cr and first_cr.recipe and first_cr.recipe.image_url:
            image_url = first_cr.recipe.image_url
            
        collections_data.append({
            "id": str(c.id),
            "title": c.name,
            "count": count,
            "image": image_url
        })
        
    # Query favorites for "want to make" count
    want_to_make_count = db.query(FavoriteDB).filter(FavoriteDB.user_id == user_id).count()
        
    profile_data = {
        "id": str(user.id),
        "name": user.full_name or user.username,
        "handle": f"@{user.username}",
        "avatar": user.avatar or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
        "made_count": len(recent_recipes), # Simplified
        "want_to_make_count": want_to_make_count,
        "follower_count": user.follower_count,
        "is_following": is_following,
        "is_self": is_self,
        "recent_recipes": recent_data,
        "collections": collections_data
    }
    
    return success_response(data=profile_data, message="Fetched user profile successfully")
