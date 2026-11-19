from sqlalchemy.orm import Session
from fastapi import status, BackgroundTasks
from typing import Optional
from app.modules.notifications.websocket import manager

from app.modules.recipes.model import RecipeDB, CommentDB, RatingDB, FavoriteDB
from app.core.exceptions import CustomException
from app.modules.notifications.schema import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.recipes.schemas import RateRecipeRequest
from app.modules.users.model import UserDB


class RecipeInteractionService:
    @staticmethod
    def rate_recipe(db: Session, recipe_id: int, current_user: UserDB, request: RateRecipeRequest, background_tasks: Optional[BackgroundTasks] = None):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=404
                )

            existing_rating = db.query(RatingDB).filter(
                RatingDB.recipe_id == recipe_id,
                RatingDB.user_id == current_user.id
            ).first()

            if existing_rating:
                existing_rating.score = request.score
            else:
                new_rating = RatingDB(
                    recipe_id=recipe_id,
                    user_id=current_user.id,
                    score=request.score
                )
                db.add(new_rating)

            if request.comment and request.comment.strip():
                new_comment = CommentDB(
                    recipe_id=recipe_id,
                    user_id=current_user.id,
                    content=request.comment.strip()
                )
                db.add(new_comment)

            db.commit()

            # Gửi thông báo RATING
            if recipe.user_id != current_user.id:
                try:
                    notify_in = NotificationCreate(
                        user_id=recipe.user_id,
                        type="RATING",
                        reference_type="recipe",
                        reference_id=recipe.id,
                        actor_id=current_user.id
                    )
                    NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                except Exception as ex:
                    print(f"⚠️ Không thể tạo thông báo Đánh giá: {ex}")

            return True
        except Exception as e:
            db.rollback()
            raise CustomException(
                message=f"Lỗi khi lưu đánh giá: {e}",
                code="RATE_RECIPE_ERROR",
                status_code=500
            )


    @staticmethod
    def favorite_recipe(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            existing_favorite = db.query(FavoriteDB).filter(
                FavoriteDB.recipe_id == recipe_id,
                FavoriteDB.user_id == current_user.id
            ).first()

            if existing_favorite:
                return {"isFavorited": True, "already": True}

            new_favorite = FavoriteDB(recipe_id=recipe_id, user_id=current_user.id)
            db.add(new_favorite)
            db.commit()

            # Gửi thông báo LIKE (Yêu thích)
            if recipe.user_id != current_user.id:
                try:
                    notify_in = NotificationCreate(
                        user_id=recipe.user_id,
                        type="LIKE",
                        reference_type="recipe",
                        reference_id=recipe.id,
                        actor_id=current_user.id
                    )
                    NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                except Exception as ex:
                    print(f"⚠️ Không thể tạo thông báo Favorite: {ex}")

            total = db.query(FavoriteDB).filter(FavoriteDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "TYM_UPDATE", "recipe_id": recipe_id, "favorites_count": total}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)

            return {"isFavorited": True, "already": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi yêu thích công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi yêu thích công thức",
                code="FAVORITE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def unfavorite_recipe(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            existing_favorite = db.query(FavoriteDB).filter(
                FavoriteDB.recipe_id == recipe_id,
                FavoriteDB.user_id == current_user.id
            ).first()

            if not existing_favorite:
                raise CustomException(
                    message="Bạn chưa yêu thích công thức này",
                    code="NOT_FAVORITED_ERROR",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            db.delete(existing_favorite)
            db.commit()

            total = db.query(FavoriteDB).filter(FavoriteDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "TYM_UPDATE", "recipe_id": recipe_id, "favorites_count": total}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)

            return {"isFavorited": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi bỏ yêu thích công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi bỏ yêu thích",
                code="UNFAVORITE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
