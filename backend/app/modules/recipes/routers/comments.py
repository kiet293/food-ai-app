from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.recipes.schemas import CommentCreate
from app.modules.recipes.services.comment_service import RecipeCommentService
from app.modules.users.model import UserDB


recipe_router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])
router = APIRouter(tags=["Comments & Tags"])


@recipe_router.post("/{recipe_id}/comments")
def add_comment(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeCommentService.add_recipe_comment(
        db=db, recipe_id=recipe_id, current_user=current_user,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
        background_tasks=background_tasks,
    )
    return success_response(data=data, message="Đăng bình luận thành công")


@router.put("/comments/{comment_id}")
def update_comment(
    comment_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    data = RecipeCommentService.update_recipe_comment(
        db=db, comment_id=comment_id, current_user=current_user,
        content=comment_data.content,
    )
    return success_response(data=data, message="Cập nhật bình luận thành công!")


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    RecipeCommentService.delete_recipe_comment(
        db=db, comment_id=comment_id, current_user=current_user,
        background_tasks=background_tasks,
    )
    return success_response(message="Đã xóa bình luận thành công!")
