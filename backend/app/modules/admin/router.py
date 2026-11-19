from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.core.responses import success_response
from app.db import get_db
from app.modules.users.model import UserDB

from .schema import (
    AdminCategoryCreate,
    AdminCategoryUpdate,
    AdminRecipeUpdate,
    AdminTagUpdate,
    AdminUserUpdate,
)
from .service import AdminService

router = APIRouter(
    tags=["Admin Management"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("/me")
def get_admin_me(current_admin: UserDB = Depends(get_current_admin)):
    return success_response(
        data={
            "id": current_admin.id,
            "username": current_admin.username,
            "full_name": current_admin.full_name or current_admin.username,
            "avatar": current_admin.avatar,
            "is_admin": bool(current_admin.is_admin),
        },
        message="Xác thực quản trị viên thành công",
    )


@router.get("/dashboard")
def get_dashboard(
    days: int = Query(14, ge=7, le=90),
    db: Session = Depends(get_db),
):
    data = AdminService.get_dashboard_overview(db, days=days)
    return success_response(data=data, message="Tải dữ liệu tổng quan thành công")


# ------------------------------------------------------------------
# USERS
# ------------------------------------------------------------------
@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_admin: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    data = AdminService.list_users(db, page=page, limit=limit, search=search, is_admin=is_admin)
    return success_response(data=data, message="Tải danh sách người dùng thành công")


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    data = AdminService.update_user(db, user_id, payload, current_admin)
    return success_response(data=data, message="Cập nhật người dùng thành công")


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    data = AdminService.delete_user(db, user_id, current_admin)
    return success_response(data=data, message="Đã xóa người dùng")


# ------------------------------------------------------------------
# RECIPES
# ------------------------------------------------------------------
@router.get("/recipes")
def list_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_ai: Optional[bool] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    data = AdminService.list_recipes(
        db,
        page=page,
        limit=limit,
        search=search,
        is_ai=is_ai,
        difficulty=difficulty,
    )
    return success_response(data=data, message="Tải danh sách công thức thành công")


@router.get("/recipes/{recipe_id}")
def get_recipe_detail(recipe_id: int, db: Session = Depends(get_db)):
    data = AdminService.get_recipe_detail(db, recipe_id)
    return success_response(data=data, message="Tải chi tiết công thức thành công")


@router.patch("/recipes/{recipe_id}")
def update_recipe(
    recipe_id: int,
    payload: AdminRecipeUpdate,
    db: Session = Depends(get_db),
):
    data = AdminService.update_recipe(db, recipe_id, payload)
    return success_response(data=data, message="Cập nhật công thức thành công")


@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    data = AdminService.delete_recipe(db, recipe_id)
    return success_response(data=data, message="Đã xóa công thức")


# ------------------------------------------------------------------
# REELS
# ------------------------------------------------------------------
@router.get("/reels")
def list_reels(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    data = AdminService.list_reels(db, page=page, limit=limit, search=search)
    return success_response(data=data, message="Tải danh sách reels thành công")


@router.delete("/reels/{reel_id}")
def delete_reel(reel_id: int, db: Session = Depends(get_db)):
    data = AdminService.delete_reel(db, reel_id)
    return success_response(data=data, message="Đã xóa video reel")


# ------------------------------------------------------------------
# CATEGORIES & TAGS
# ------------------------------------------------------------------
@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    data = AdminService.list_categories(db)
    return success_response(data=data, message="Tải danh mục thành công")


@router.post("/categories")
def create_category(payload: AdminCategoryCreate, db: Session = Depends(get_db)):
    data = AdminService.create_category(db, payload)
    return success_response(data=data, message="Tạo danh mục thành công")


@router.patch("/categories/{category_id}")
def update_category(
    category_id: int,
    payload: AdminCategoryUpdate,
    db: Session = Depends(get_db),
):
    data = AdminService.update_category(db, category_id, payload)
    return success_response(data=data, message="Cập nhật danh mục thành công")


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    data = AdminService.delete_category(db, category_id)
    return success_response(data=data, message="Đã xóa danh mục")


@router.get("/tags")
def list_tags(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    data = AdminService.list_tags(db, page=page, limit=limit, search=search)
    return success_response(data=data, message="Tải danh sách tag thành công")


@router.patch("/tags/{tag_id}")
def update_tag(
    tag_id: int,
    payload: AdminTagUpdate,
    db: Session = Depends(get_db),
):
    data = AdminService.update_tag(db, tag_id, payload)
    return success_response(data=data, message="Cập nhật tag thành công")


@router.delete("/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    data = AdminService.delete_tag(db, tag_id)
    return success_response(data=data, message="Đã xóa tag")


# ------------------------------------------------------------------
# COMMENTS MODERATION
# ------------------------------------------------------------------
@router.get("/comments")
def list_comments(
    kind: str = Query("recipe"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    data = AdminService.list_comments(
        db, kind=kind, page=page, limit=limit, search=search
    )
    return success_response(data=data, message="Tải danh sách bình luận thành công")


@router.delete("/comments/{kind}/{comment_id}")
def delete_comment(kind: str, comment_id: int, db: Session = Depends(get_db)):
    data = AdminService.delete_comment(db, kind, comment_id)
    return success_response(data=data, message="Đã xóa bình luận")


# ------------------------------------------------------------------
# SYSTEM JOBS
# ------------------------------------------------------------------
@router.post("/jobs/recalculate-trending")
def recalculate_trending():
    data = AdminService.trigger_trending_recalculation()
    return success_response(data=data, message="Đã cập nhật điểm trending thành công")


@router.post("/jobs/sync-pexels")
def sync_pexels(db: Session = Depends(get_db)):
    data = AdminService.trigger_pexels_sync(db)
    return success_response(data=data, message=data.get("note", "Hoàn tất đồng bộ Pexels"))
