from fastapi import APIRouter, Depends, Body, UploadFile, File, Form, Query, status, BackgroundTasks  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import Optional, List

from app.models.database import get_db
from app.users.models import UserDB
from app.recipes.schemas import AIAnalysisResult, RateRecipeRequest, CommentCreate, TagResponse
from app.recipes.services import RecipeService
from app.utils.deps import get_current_user, get_optional_current_user
from app.utils.response import success_response

router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])
comment_router = APIRouter(tags=["Comments & Tags"])

# 1. API LẤY DANH SÁCH TRENDING RECIPES (GET /api/recipes/trending)
@router.get("/trending")
def get_trending_recipes(
    limit: int = 10, 
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = RecipeService.get_trending_recipes(db, limit, current_user)
    return success_response(data=data, message="Lấy danh sách Trending thành công")


# 2. API LƯU CÔNG THỨC VÀO SỔ TAY (POST /api/recipes/save)
@router.post("/save")
def save_recipe(
    recipe_data: AIAnalysisResult, 
    db: Session = Depends(get_db), 
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.save_recipe_to_notebook(db, current_user, recipe_data)
    return success_response(data=data, message="Lưu công thức thành công!")


# 3. API LẤY CÔNG THỨC TRONG SỔ TAY CỦA BẢN THÂN (GET /api/recipes/list)
@router.get("/list")
def get_notebook_recipes(
    db: Session = Depends(get_db), 
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.get_notebook_recipes(db, current_user)
    return data


# 4. API XÓA CÔNG THỨC (DELETE /api/recipes/{recipe_id})
@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.delete_recipe(db, recipe_id, current_user)
    return data


# 5. API LẤY MÓN ĂN PHỔ BIẾN HỆ THỐNG (GET /api/recipes/popular)
@router.get("/popular")
def get_popular_recipes(db: Session = Depends(get_db)):
    data = RecipeService.get_popular_recipes(db)
    return data


# 6. API ĐĂNG TẢI CÔNG THỨC MỚI (POST /api/recipes)
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
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.create_new_recipe(
        db, current_user, recipe_name, description, ingredients, instructions,
        cook_time_minutes, servings, difficulty, category_name, tags, image
    )
    return success_response(data=data, message="Đăng tải công thức thành công!")


# 7. API LẤY DANH MỤC CÔNG THỨC (GET /api/recipes/categories)
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    data = RecipeService.get_categories_list(db)
    return success_response(data=data)


# 8. API EXPLORE GRID PHÂN TRANG (GET /api/recipes/explore-grid)
@router.get("/explore-grid")
def get_explore_grid(
    cursor: int = Query(None),
    limit: int = Query(18, ge=1, le=50),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    data = RecipeService.get_explore_grid(db, cursor, limit, tag)
    return success_response(data=data)


# 9. API EXPLORE FEED CHI TIẾT (GET /api/recipes/explore-feed)
@router.get("/explore-feed")
def get_explore_feed(
    start_id: int = Query(None),
    limit: int = Query(5, ge=1, le=20),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = RecipeService.get_explore_feed(db, start_id, limit, tag, current_user)
    return success_response(data=data)


# 10. API FOLLOWING FEED (GET /api/recipes/following-feed)
@router.get("/following-feed")
def get_following_feed(
    start_id: int = Query(None),
    limit: int = Query(5, ge=1, le=20),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.get_following_feed(db, start_id, limit, tag, current_user)
    return success_response(data=data)


# 11. API CHI TIẾT CÔNG THỨC NẤU ĂN (GET /api/recipes/{recipe_id})
@router.get("/{recipe_id}")
def get_recipe_details(
    recipe_id: int, 
    db: Session = Depends(get_db), 
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = RecipeService.get_recipe_detail(db, recipe_id, current_user)
    return success_response(data=data, message="Lấy thông tin chi tiết công thức thành công")


# 12. API TRUY VẤN DANH SÁCH CÔNG THỨC (PHÂN TRANG & SẮP XẾP) (GET /api/recipes)
@router.get("")
def get_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("newest"),
    db: Session = Depends(get_db)
):
    data = RecipeService.get_recipes_list(db, page, limit, sort_by)
    return success_response(data=data, message="Lấy danh sách công thức thành công")


# 13. API CHỈNH SỬA CÔNG THỨC (PUT /api/recipes/{recipe_id})
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
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.update_recipe(
        db, recipe_id, current_user, recipe_name, description, ingredients, instructions,
        cook_time_minutes, servings, difficulty, category_name, tags, image
    )
    return success_response(data=data, message="Cập nhật công thức thành công!")


# 14. API ĐÁNH GIÁ CÔNG THỨC NẤU ĂN (POST /api/recipes/{recipe_id}/rate)
@router.post("/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int, 
    request: RateRecipeRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: UserDB = Depends(get_current_user)
):
    RecipeService.rate_recipe(db, recipe_id, current_user, request, background_tasks)
    return success_response(message="Đánh giá công thức thành công!")


# 15. API ĐĂNG BÌNH LUẬN (POST /api/recipes/{recipe_id}/comments)
@router.post("/{recipe_id}/comments")
def add_comment(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.add_recipe_comment(
        db=db,
        recipe_id=recipe_id,
        current_user=current_user,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
        background_tasks=background_tasks
    )
    return success_response(data=data, message="Đăng bình luận thành công")


# 16. API SỬA BÌNH LUẬN (PUT /api/comments/{comment_id})
@comment_router.put("/comments/{comment_id}")
def update_comment(
    comment_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.update_recipe_comment(
        db=db,
        comment_id=comment_id,
        current_user=current_user,
        content=comment_data.content
    )
    return success_response(data=data, message="Cập nhật bình luận thành công!")


# 17. API XÓA BÌNH LUẬN (DELETE /api/comments/{comment_id})
@comment_router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    RecipeService.delete_recipe_comment(
        db=db,
        comment_id=comment_id,
        current_user=current_user,
        background_tasks=background_tasks
    )
    return success_response(message="Đã xóa bình luận thành công!")


# 18. API YÊU THÍCH CÔNG THỨC (POST /api/recipes/{recipe_id}/favorite)
@router.post("/{recipe_id}/favorite")
def favorite_recipe(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.favorite_recipe(
        db=db,
        recipe_id=recipe_id,
        current_user=current_user,
        background_tasks=background_tasks
    )
    if data["already"]:
        return success_response(message="Bạn đã yêu thích công thức này rồi!", data={"isFavorited": True})
    return success_response(message="Đã thêm vào yêu thích!", data={"isFavorited": True})


# 19. API BỎ YÊU THÍCH CÔNG THỨC (DELETE /api/recipes/{recipe_id}/favorite)
@router.delete("/{recipe_id}/favorite")
def unfavorite_recipe(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = RecipeService.unfavorite_recipe(
        db=db,
        recipe_id=recipe_id,
        current_user=current_user,
        background_tasks=background_tasks
    )
    return success_response(message="Đã bỏ yêu thích!", data=data)


# 20. API LẤY DANH SÁCH NHÃN PHỔ BIẾN (GET /api/tags/hot)
@comment_router.get("/tags/hot", response_model=List[TagResponse])
def get_hot_tags(db: Session = Depends(get_db)):
    data = RecipeService.get_hot_tags(db)
    return data

