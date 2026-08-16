from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status

from app.notifications.models import NotificationDB, NotificationSettingsDB
from app.notifications.schemas import (
    NotificationCreate,
    NotificationResponse,
    NotificationSettingsUpdate
)
from app.utils.response import CustomException

class NotificationService:
    @staticmethod
    def create_notification(db: Session, notification_in: NotificationCreate) -> NotificationDB:
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
                is_read=False
            )
            db.add(db_notification)
            db.commit()
            db.refresh(db_notification)
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
                # Sinh message động dựa theo loại thông báo
                message = "Bạn có thông báo mới"
                if n.type == 'FOLLOW':
                    message = "Một người dùng đã bắt đầu theo dõi bạn."
                elif n.type == 'LIKE':
                    message = "Có người thích bài viết của bạn."
                elif n.type == 'COMMENT':
                    message = "Có người bình luận về bài viết của bạn."
                elif n.type == 'RATING':
                    message = "Có người đánh giá công thức nấu ăn của bạn."
                elif n.type == 'NEW_RECIPE':
                    message = "Có công thức nấu ăn mới dành cho bạn."

                result.append({
                    "id": n.id,
                    "user_id": n.user_id,
                    "type": n.type,
                    "reference_type": n.reference_type,
                    "reference_id": n.reference_id,
                    "is_read": n.is_read,
                    "created_at": n.created_at,
                    "message": message
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
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
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
            notification.is_read = True
            db.commit()
            return True
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi đánh dấu thông báo đã đọc: {e}")
            raise CustomException(
                message="Không thể cập nhật thông báo",
                code="MARK_READ_ERROR",
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
