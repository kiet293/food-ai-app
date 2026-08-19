from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status, BackgroundTasks

from app.modules.notifications.model import NotificationDB, NotificationSettingsDB
from app.modules.notifications.schema import (
    NotificationCreate,
    NotificationResponse,
    NotificationSettingsUpdate
)
from app.core.exceptions import CustomException
from app.modules.users.model import UserDB

class NotificationService:
    @staticmethod
    def generate_message(n: NotificationDB, db: Session) -> str:
        actor_name = "Một người dùng"
        if n.actor_id:
            actor = db.query(UserDB).filter(UserDB.id == n.actor_id).first()
            if actor:
                actor_name = actor.full_name or actor.username

        if n.type == 'FOLLOW':
            return f"{actor_name} đã bắt đầu theo dõi bạn."
        elif n.type == 'LIKE':
            if n.reference_type == 'reel':
                return f"{actor_name} đã thích video ngắn của bạn."
            elif n.reference_type == 'reel_comment':
                return f"{actor_name} đã thích bình luận của bạn trên video ngắn."
            elif n.reference_type == 'recipe_comment':
                return f"{actor_name} đã thích bình luận của bạn."
            else:
                return f"{actor_name} đã thích công thức của bạn."
        elif n.type == 'COMMENT':
            if n.reference_type == 'reel':
                return f"{actor_name} đã bình luận về video ngắn của bạn."
            elif n.reference_type == 'reel_comment':
                return f"{actor_name} đã trả lời bình luận của bạn trên video ngắn."
            elif n.reference_type == 'comment':
                return f"{actor_name} đã trả lời bình luận của bạn."
            else:
                return f"{actor_name} đã bình luận về công thức của bạn."
        elif n.type == 'RATING':
            return f"{actor_name} đã đánh giá công thức của bạn."
        elif n.type == 'NEW_RECIPE':
            return f"{actor_name} đã đăng một công thức nấu ăn mới."
        return "Bạn có thông báo mới."

    @staticmethod
    def create_notification(
        db: Session,
        notification_in: NotificationCreate,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Optional[NotificationDB]:
        try:
            # 1. Kiểm tra cài đặt nhận thông báo của User
            settings = NotificationService.get_settings(db, notification_in.user_id)
            enabled = True
            if notification_in.type == 'FOLLOW' and not settings.follow_enabled:
                enabled = False
            elif notification_in.type == 'LIKE' and not settings.like_enabled:
                enabled = False
            elif notification_in.type == 'COMMENT' and not settings.comment_enabled:
                enabled = False
            elif notification_in.type == 'RATING' and not settings.rating_enabled:
                enabled = False
            elif notification_in.type == 'NEW_RECIPE' and not settings.new_recipe_enabled:
                enabled = False

            if not enabled:
                return None

            # 2. Tạo thông báo mới
            db_notification = NotificationDB(
                user_id=notification_in.user_id,
                type=notification_in.type,
                reference_type=notification_in.reference_type,
                reference_id=notification_in.reference_id,
                actor_id=notification_in.actor_id,
                is_read=False
            )
            db.add(db_notification)
            db.commit()
            db.refresh(db_notification)

            # 3. Gửi WebSockets thời gian thực nếu có background_tasks
            if db_notification and background_tasks:
                message = NotificationService.generate_message(db_notification, db)
                actor_data = None
                if db_notification.actor_id:
                    actor = db.query(UserDB).filter(UserDB.id == db_notification.actor_id).first()
                    if actor:
                        actor_data = {
                            "id": actor.id,
                            "name": actor.full_name or actor.username,
                            "username": actor.username,
                            "avatar": actor.avatar
                        }

                payload = {
                    "type": "NEW_NOTIFICATION",
                    "data": {
                        "id": db_notification.id,
                        "user_id": db_notification.user_id,
                        "type": db_notification.type,
                        "reference_type": db_notification.reference_type,
                        "reference_id": db_notification.reference_id,
                        "is_read": db_notification.is_read,
                        "created_at": db_notification.created_at.isoformat() if db_notification.created_at else None,
                        "message": message,
                        "actor": actor_data
                    }
                }

                async def send_ws():
                    from app.modules.notifications.websocket import manager
                    # room_id = USER_NOTIFY_{user_id}
                    await manager.broadcast_to_recipe(f"USER_NOTIFY_{db_notification.user_id}", payload)

                background_tasks.add_task(send_ws)

            return db_notification
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi tạo thông báo: {e}")
            return None

    @staticmethod
    def get_user_notifications(db: Session, user_id: int, limit: int = 20) -> List[dict]:
        try:
            notifications = db.query(NotificationDB).filter(
                NotificationDB.user_id == user_id
            ).order_by(NotificationDB.created_at.desc()).limit(limit).all()

            result = []
            for n in notifications:
                message = NotificationService.generate_message(n, db)
                
                actor_data = None
                if n.actor_id:
                    actor = db.query(UserDB).filter(UserDB.id == n.actor_id).first()
                    if actor:
                        actor_data = {
                            "id": actor.id,
                            "name": actor.full_name or actor.username,
                            "username": actor.username,
                            "avatar": actor.avatar
                        }

                result.append({
                    "id": n.id,
                    "user_id": n.user_id,
                    "type": n.type,
                    "reference_type": n.reference_type,
                    "reference_id": n.reference_id,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                    "message": message,
                    "actor": actor_data
                })
            return result
        except Exception as e:
            print(f"❌ Lỗi khi lấy danh sách thông báo: {e}")
            raise CustomException(
                message="Không thể tải danh sách thông báo",
                code="GET_NOTIFICATIONS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int, is_read: bool = True) -> bool:
        try:
            notification = db.query(NotificationDB).filter(
                NotificationDB.id == notification_id,
                NotificationDB.user_id == user_id
            ).first()
            if not notification:
                raise CustomException(
                    message="Không tìm thấy thông báo",
                    code="NOTIFICATION_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            notification.is_read = is_read
            db.commit()
            return True
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi cập nhật trạng thái đọc của thông báo: {e}")
            raise CustomException(
                message="Không thể cập nhật thông báo",
                code="MARK_READ_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # xóa thông báo
    @staticmethod
    def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
        try:
            notification = db.query(NotificationDB).filter(
                NotificationDB.id == notification_id,
                NotificationDB.user_id == user_id
            ).first()
            if not notification:
                raise CustomException(
                    message="Không tìm thấy thông báo",
                    code="NOTIFICATION_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            db.delete(notification)
            db.commit()
            return True
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi xóa thông báo: {e}")
            raise CustomException(
                message="Không thể xóa thông báo",
                code="DELETE_NOTIFICATION_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def get_settings(db: Session, user_id: int) -> NotificationSettingsDB:
        try:
            settings = db.query(NotificationSettingsDB).filter(
                NotificationSettingsDB.user_id == user_id
            ).first()
            if not settings:
                # Tự tạo cài đặt mặc định nếu chưa có
                settings = NotificationSettingsDB(user_id=user_id)
                db.add(settings)
                db.commit()
                db.refresh(settings)
            return settings
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi lấy cấu hình thông báo: {e}")
            raise CustomException(
                message="Không thể tải cấu hình thông báo",
                code="GET_SETTINGS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def update_settings(db: Session, user_id: int, settings_in: NotificationSettingsUpdate) -> NotificationSettingsDB:
        try:
            settings = NotificationService.get_settings(db, user_id)
            
            if settings_in.follow_enabled is not None:
                settings.follow_enabled = settings_in.follow_enabled
            if settings_in.like_enabled is not None:
                settings.like_enabled = settings_in.like_enabled
            if settings_in.comment_enabled is not None:
                settings.comment_enabled = settings_in.comment_enabled
            if settings_in.rating_enabled is not None:
                settings.rating_enabled = settings_in.rating_enabled
            if settings_in.new_recipe_enabled is not None:
                settings.new_recipe_enabled = settings_in.new_recipe_enabled

            db.commit()
            db.refresh(settings)
            return settings
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi cập nhật cấu hình thông báo: {e}")
            raise CustomException(
                message="Không thể lưu cấu hình thông báo",
                code="UPDATE_SETTINGS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
