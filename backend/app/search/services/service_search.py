from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, cast, String
from fastapi import status
from typing import Optional

from app.recipes.models import RecipeDB
from app.recipes.services import RecipeService
from app.users.models import UserDB
from app.utils.response import CustomException

class SearchService:
    @staticmethod
    def search_recipes(db: Session, q: str, page: int, limit: int):
        try:
            query = db.query(RecipeDB)
            
            if q.strip():
                if ',' in q:
                    keywords = [kw.strip() for kw in q.split(',') if kw.strip()]
                else:
                    keywords = [kw.strip() for kw in q.split() if kw.strip()]
                
                conditions = []
                for kw in keywords:
                    kw_cond = or_(
                        RecipeDB.recipe_name.ilike(f"%{kw}%"),
                        cast(RecipeDB.ingredients, String).ilike(f"%{kw}%")
                    )
                    conditions.append(kw_cond)
                
                if conditions:
                    query = query.filter(and_(*conditions))
                    
            query = query.order_by(RecipeDB.created_at.desc())
            
            total_items = query.count()
            total_pages = (total_items + limit - 1) // limit if total_items else 0
            
            recipes = query.offset((page - 1) * limit).limit(limit).all()
            result_list = [RecipeService.format_recipe_summary(r) for r in recipes]
            
            return {
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            }
        except Exception as e:
            print(f"❌ Lỗi tìm kiếm công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tìm kiếm công thức",
                code="SEARCH_RECIPES_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def search_users(db: Session, q: str, page: int, limit: int):
        try:
            query = db.query(UserDB)
            
            if q.strip():
                search_cond = or_(
                    UserDB.full_name.ilike(f"%{q.strip()}%"),
                    UserDB.username.ilike(f"%{q.strip()}%")
                )
                query = query.filter(search_cond)
                
            total_items = query.count()
            total_pages = (total_items + limit - 1) // limit if total_items else 0
            
            users = query.offset((page - 1) * limit).limit(limit).all()
            
            result_list = []
            for user in users:
                result_list.append({
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "avatar": user.avatar,
                    "recipes_count": len(user.recipes) if user.recipes else 0
                })
                
            return {
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            }
        except Exception as e:
            print(f"❌ Lỗi tìm kiếm người dùng: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tìm kiếm người dùng",
                code="SEARCH_USERS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
