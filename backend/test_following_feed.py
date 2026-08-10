import asyncio
import os
import sys

# Thêm đường dẫn project vào sys.path để import
sys.path.append("d:/code/pyton/food-ai-app/backend")

from app.models.database import SessionLocal
from app.models.recipe_model import RecipeDB, RecipeTagDB, TagDB
from app.models.user_model import FollowDB, UserDB

db = SessionLocal()
try:
    print("Test truy vấn Following Feed...")
    # Lấy 1 user mẫu
    current_user = db.query(UserDB).first()
    if not current_user:
        print("Không có user nào trong DB.")
        sys.exit(0)

    print(f"Current User: {current_user.id}")

    query = db.query(RecipeDB).join(
        FollowDB, 
        RecipeDB.user_id == FollowDB.following_id
    ).filter(
        FollowDB.follower_id == current_user.id
    )
    
    query = query.order_by(RecipeDB.id.desc())
    recipes = query.limit(5).all()
    print(f"Tìm thấy {len(recipes)} recipes.")
    
except Exception as e:
    print(f"Exception: {e}")
finally:
    db.close()
