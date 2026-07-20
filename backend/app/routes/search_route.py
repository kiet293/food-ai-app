from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, cast, String
from app.models.database import get_db
from app.models.recipe_model import RecipeDB
from app.models.user_model import UserDB
from app.utils.response import success_response, CustomException
from app.routes.recipe_route import format_recipe_summary

router = APIRouter()

@router.get("/recipes")
def search_recipes(
    q: str = Query("", description="Từ khóa tìm kiếm (ngăn cách bởi dấu phẩy nếu tìm nhiều nguyên liệu)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(RecipeDB)
        
        if q.strip():
            # Tách chuỗi
            if ',' in q:
                # Nếu có dấu phẩy, tách theo dấu phẩy (giữ nguyên các cụm từ)
                keywords = [kw.strip() for kw in q.split(',') if kw.strip()]
            else:
                # Nếu không có dấu phẩy, tự động tách theo từng chữ (khoảng trắng)
                keywords = [kw.strip() for kw in q.split() if kw.strip()]
            
            conditions = []
            for kw in keywords:
                # Mỗi từ khóa phải xuất hiện trong Tên món ăn HOẶC Chuỗi JSON nguyên liệu
                # Dùng ép kiểu (cast) về String để tìm chuỗi trong cột JSON (hoạt động tốt trên cả SQLite và PostgreSQL)
                kw_cond = or_(
                    RecipeDB.recipe_name.ilike(f"%{kw}%"),
                    cast(RecipeDB.ingredients, String).ilike(f"%{kw}%")
                )
                conditions.append(kw_cond)
            
            # Yêu cầu món ăn phải thỏa mãn TẤT CẢ các từ khóa (AND)
            if conditions:
                query = query.filter(and_(*conditions))
                
        # Sắp xếp mới nhất lên đầu
        query = query.order_by(RecipeDB.created_at.desc())
        
        # Tính tổng để phân trang
        total_items = query.count()
        total_pages = (total_items + limit - 1) // limit
        
        recipes = query.offset((page - 1) * limit).limit(limit).all()
        
        # Format kết quả
        result_list = [format_recipe_summary(r) for r in recipes]
        
        return success_response(
            data={
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            },
            message="Tìm kiếm công thức thành công"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi tìm kiếm công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tìm kiếm công thức",
            code="SEARCH_RECIPES_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/users")
def search_users(
    q: str = Query("", description="Tên hoặc username của người dùng"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(UserDB)
        
        if q.strip():
            # Tìm trong full_name hoặc username
            search_cond = or_(
                UserDB.full_name.ilike(f"%{q.strip()}%"),
                UserDB.username.ilike(f"%{q.strip()}%")
            )
            query = query.filter(search_cond)
            
        total_items = query.count()
        total_pages = (total_items + limit - 1) // limit
        
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
            
        return success_response(
            data={
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            },
            message="Tìm kiếm người dùng thành công"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi tìm kiếm người dùng: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tìm kiếm người dùng",
            code="SEARCH_USERS_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
