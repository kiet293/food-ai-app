from sqlalchemy.orm import Session
from fastapi import status, BackgroundTasks
from typing import Optional
from app.modules.notifications.websocket import manager

from app.modules.recipes.model import RecipeDB, CommentDB
from app.core.exceptions import CustomException
from app.modules.notifications.schema import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.users.model import UserDB


class RecipeCommentService:
    @staticmethod
    def add_recipe_comment(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        content: str,
        parent_comment_id: Optional[int],
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

            if not content.strip():
                raise CustomException(
                    message="Nội dung bình luận không được để trống",
                    code="INVALID_COMMENT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if parent_comment_id:
                parent = db.query(CommentDB).filter(CommentDB.id == parent_comment_id).first()
                if not parent:
                    raise CustomException(
                        message="Bình luận gốc không tồn tại",
                        code="PARENT_COMMENT_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND
                    )

            new_comment = CommentDB(
                recipe_id=recipe_id,
                user_id=current_user.id,
                content=content.strip(),
                parent_comment_id=parent_comment_id
            )

            db.add(new_comment)
            db.commit()
            db.refresh(new_comment)

            # Gửi thông báo COMMENT / REPLY
            if parent_comment_id:
                try:
                    parent = db.query(CommentDB).filter(CommentDB.id == parent_comment_id).first()
                    if parent and parent.user_id != current_user.id:
                        notify_in = NotificationCreate(
                            user_id=parent.user_id,
                            type="COMMENT",
                            reference_type="comment",
                            reference_id=recipe.id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                except Exception as ex:
                    print(f"⚠️ Không thể tạo thông báo Reply Comment: {ex}")
            else:
                if recipe.user_id != current_user.id:
                    try:
                        notify_in = NotificationCreate(
                            user_id=recipe.user_id,
                            type="COMMENT",
                            reference_type="recipe",
                            reference_id=recipe.id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                    except Exception as ex:
                        print(f"⚠️ Không thể tạo thông báo Comment: {ex}")

            total_comments = db.query(CommentDB).filter(CommentDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "COMMENT_UPDATE", "recipe_id": recipe_id, "comments_count": total_comments}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)

            return {
                "id": new_comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": new_comment.content,
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
                "parent_comment_id": new_comment.parent_comment_id
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi đăng bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi lưu bình luận",
                code="CREATE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def update_recipe_comment(
        db: Session,
        comment_id: int,
        current_user: UserDB,
        content: str
    ):
        try:
            comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
            if not comment:
                raise CustomException(
                    message="Không tìm thấy bình luận",
                    code="COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            if comment.user_id != current_user.id:
                raise CustomException(
                    message="Bạn không có quyền sửa bình luận này",
                    code="FORBIDDEN",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            new_content = content.strip()
            if not new_content:
                raise CustomException(
                    message="Nội dung bình luận không được để trống",
                    code="INVALID_COMMENT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            comment.content = new_content
            db.commit()
            db.refresh(comment)

            return {
                "id": comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": comment.content,
                "created_at": comment.created_at.isoformat() if comment.created_at else None
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi sửa bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi cập nhật bình luận",
                code="UPDATE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def delete_recipe_comment(
        db: Session,
        comment_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
            if not comment:
                raise CustomException(
                    message="Không tìm thấy bình luận",
                    code="COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            if comment.user_id != current_user.id and not current_user.is_admin:
                raise CustomException(
                    message="Bạn không có quyền xóa bình luận này",
                    code="FORBIDDEN",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            recipe_id = comment.recipe_id
            db.delete(comment)
            db.commit()

            total_comments = db.query(CommentDB).filter(CommentDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "COMMENT_UPDATE", "recipe_id": recipe_id, "comments_count": total_comments}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)
            return True
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi xóa bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi xóa bình luận",
                code="DELETE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
