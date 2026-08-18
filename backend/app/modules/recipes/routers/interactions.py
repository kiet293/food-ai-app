from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.recipes.schemas import RateRecipeRequest
from app.modules.recipes.services.interaction_service import RecipeInteractionService
from app.modules.users.model import UserDB


router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])


@router.post("/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int,
    request: RateRecipeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    RecipeInteractionService.rate_recipe(
        db, recipe_id, current_user, request, background_tasks
    )
    return success_response(message="Đánh giá công thức thành công!")


@router.post("/{recipe_id}/favorite")
def favorite_recipe(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeInteractionService.favorite_recipe(
        db=db, recipe_id=recipe_id, current_user=current_user,
        background_tasks=background_tasks,
    )
    message = (
        "Bạn đã yêu thích công thức này rồi!"
        if data["already"] else "Đã thêm vào yêu thích!"
    )
    return success_response(message=message, data={"isFavorited": True})


@router.delete("/{recipe_id}/favorite")
def unfavorite_recipe(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeInteractionService.unfavorite_recipe(
        db=db, recipe_id=recipe_id, current_user=current_user,
        background_tasks=background_tasks,
    )
    return success_response(message="Đã bỏ yêu thích!", data=data)
