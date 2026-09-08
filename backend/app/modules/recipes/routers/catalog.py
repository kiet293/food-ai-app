from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_optional_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.recipes.schemas import AIAnalysisResult
from app.modules.recipes.services.catalog_service import RecipeCatalogService
from app.modules.users.model import UserDB


router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])


@router.get("/trending")
def get_trending_recipes(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user),
):
    data = RecipeCatalogService.get_trending_recipes(db, limit, current_user)
    return success_response(data=data, message="Lấy danh sách Trending thành công")


@router.post("/save")
def save_recipe(
    recipe_data: AIAnalysisResult,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeCatalogService.save_recipe_to_notebook(db, current_user, recipe_data)
    return success_response(data=data, message="Lưu công thức thành công!")


@router.get("/list")
def get_notebook_recipes(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    return RecipeCatalogService.get_notebook_recipes(db, current_user)


@router.get("/popular")
def get_popular_recipes(db: Session = Depends(get_db)):
    return RecipeCatalogService.get_popular_recipes(db)


@router.post("")
@router.post("/")
def create_recipe(
    recipe_name: str = Form(...),
    description: str = Form(None),
    ingredients: str = Form(...),
    instructions: str = Form(...),
    cook_time_minutes: int = Form(None),
    servings: int = Form(None),
    difficulty: str = Form(None),
    category_name: str = Form(None),
    tags: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeCatalogService.create_new_recipe(
        db, current_user, recipe_name, description, ingredients, instructions,
        cook_time_minutes, servings, difficulty, category_name, tags, image,
    )
    return success_response(data=data, message="Đăng tải công thức thành công!")


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return success_response(data=RecipeCatalogService.get_categories_list(db))


@router.get("/explore-grid")
def get_explore_grid(
    cursor: int = Query(None),
    limit: int = Query(18, ge=1, le=50),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return success_response(
        data=RecipeCatalogService.get_explore_grid(db, cursor, limit, tag)
    )


@router.get("/explore-feed")
def get_explore_feed(
    start_id: int = Query(None),
    limit: int = Query(5, ge=1, le=20),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user),
):
    return success_response(
        data=RecipeCatalogService.get_explore_feed(
            db, start_id, limit, tag, current_user
        )
    )


@router.get("/following-feed")
def get_following_feed(
    start_id: int = Query(None),
    limit: int = Query(5, ge=1, le=20),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    return success_response(
        data=RecipeCatalogService.get_following_feed(
            db, start_id, limit, tag, current_user
        )
    )


@router.get("")
def get_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("newest"),
    db: Session = Depends(get_db),
):
    data = RecipeCatalogService.get_recipes_list(db, page, limit, sort_by)
    return success_response(data=data, message="Lấy danh sách công thức thành công")


@router.get("/{recipe_id}")
def get_recipe_details(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user),
):
    data = RecipeCatalogService.get_recipe_detail(db, recipe_id, current_user)
    return success_response(
        data=data, message="Lấy thông tin chi tiết công thức thành công"
    )


@router.put("/{recipe_id}")
def update_recipe(
    recipe_id: int,
    recipe_name: str = Form(None),
    description: str = Form(None),
    ingredients: str = Form(None),
    instructions: str = Form(None),
    cook_time_minutes: int = Form(None),
    servings: int = Form(None),
    difficulty: str = Form(None),
    category_name: str = Form(None),
    tags: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeCatalogService.update_recipe(
        db, recipe_id, current_user, recipe_name, description, ingredients,
        instructions, cook_time_minutes, servings, difficulty, category_name,
        tags, image,
    )
    return success_response(data=data, message="Cập nhật công thức thành công!")


@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    return RecipeCatalogService.delete_recipe(db, recipe_id, current_user)
