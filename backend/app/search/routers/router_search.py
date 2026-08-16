from fastapi import APIRouter, Depends, Query  # type: ignore
from sqlalchemy.orm import Session  # type: ignore

from app.models.database import get_db
from app.search.services import SearchService
from app.utils.response import success_response

router = APIRouter(tags=["Search API"])

# 1. API TÌM KIẾM CÔNG THỨC MÓN ĂN (GET /api/search/recipes)
@router.get("/recipes")
def search_recipes(
    q: str = Query("", description="Từ khóa tìm kiếm (ngăn cách bởi dấu phẩy nếu tìm nhiều nguyên liệu)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    data = SearchService.search_recipes(db=db, q=q, page=page, limit=limit)
    return success_response(data=data, message="Tìm kiếm công thức thành công")


# 2. API TÌM KIẾM NGƯỜI DÙNG/ĐẦU BẾP (GET /api/search/users)
@router.get("/users")
def search_users(
    q: str = Query("", description="Tên hoặc username của người dùng"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    data = SearchService.search_users(db=db, q=q, page=page, limit=limit)
    return success_response(data=data, message="Tìm kiếm người dùng thành công")
