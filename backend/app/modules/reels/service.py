from sqlalchemy.orm import Session
from fastapi import UploadFile, status, BackgroundTasks
import cloudinary.uploader
from typing import Optional

from app.core.exceptions import CustomException
from app.modules.recipes.model import RecipeDB
from app.modules.reels.model import ReelCommentDB, ReelCommentLikeDB, ReelDB, ReelLikeDB
from app.modules.reels.schema import ReelCreate
from app.modules.users.model import FollowDB, UserDB
from app.modules.notifications.service import NotificationService
from app.modules.notifications.schema import NotificationCreate
from .pexels_service import PexelsService

class ReelService:
    @staticmethod
    def get_reels_list(db: Session, current_user: Optional[UserDB]):
        try:
            # Tự động đồng bộ thêm video nấu ăn từ Pexels API
            PexelsService.sync_pexels_cooking_videos(db)
            
            # 1. Nếu có người dùng đăng nhập, lấy video do chính họ đăng tải
            my_reels = []
            if current_user:
                my_reels = db.query(ReelDB).filter(ReelDB.user_id == current_user.id).order_by(ReelDB.created_at.desc()).all()

            my_reel_ids = [r.id for r in my_reels]

            # 2. Lấy các video của người dùng thật khác (không phải Pexels và chưa gồm my_reels)
            other_user_reels = db.query(ReelDB).join(UserDB).filter(
                ~UserDB.username.startswith("pexels_user_"),
                ~ReelDB.id.in_(my_reel_ids) if my_reel_ids else True
            ).order_by(ReelDB.created_at.desc()).all()

            # 3. Các video nạp tự động từ Pexels xếp nối tiếp phía sau
            pexels_reels = db.query(ReelDB).join(UserDB).filter(UserDB.username.startswith("pexels_user_")).order_by(ReelDB.created_at.desc()).all()

            reels = my_reels + other_user_reels + pexels_reels
            
            result_list = []
            for reel in reels:
                is_liked = False
                if current_user:
                    like_exists = db.query(ReelLikeDB).filter(
                        ReelLikeDB.reel_id == reel.id,
                        ReelLikeDB.user_id == current_user.id
                    ).first()
                    is_liked = like_exists is not None

                likes_count = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == reel.id).count()
                comments_count = db.query(ReelCommentDB).filter(ReelCommentDB.reel_id == reel.id).count()

                is_following = False
                if current_user:
                    follow_exists = db.query(FollowDB).filter(
                        FollowDB.follower_id == current_user.id,
                        FollowDB.following_id == reel.user_id
                    ).first()
                    is_following = follow_exists is not None

                recipe_info = None
                if reel.recipe:
                    recipe_info = {
                        "id": reel.recipe.id,
                        "title": reel.recipe.recipe_name,
                        "ingredients": reel.recipe.ingredients or [],
                        "instructions": reel.recipe.instructions or []
                    }

                result_list.append({
                    "id": f"reel-{reel.id}",
                    "db_id": reel.id,
                    "isPexels": reel.author.username.startswith("pexels_user_"),
                    "author": {
                        "id": f"user-{reel.author.id}",
                        "name": reel.author.full_name or reel.author.username,
                        "avatar": reel.author.avatar,
                        "isFollowing": is_following
                    },
                    "caption": reel.caption or "",
                    "videoUrl": reel.video_url,
                    "posterUrl": reel.poster_url or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                    "likesCount": likes_count,
                    "isLiked": is_liked,
                    "commentsCount": comments_count,
                    "viewsCount": reel.view_count,
                    "savesCount": 0,
                    "isSaved": False,
                    "sharesCount": 0,
                    "musicTrack": f"Âm thanh gốc - {reel.author.full_name or reel.author.username}",
                    "recipe": recipe_info
                })

            return result_list
        except Exception as e:
            print(f"❌ Lỗi khi lấy danh sách Reels: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tải video ngắn",
                code="LOAD_REELS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def create_new_reel(db: Session, current_user: UserDB, reel_data: ReelCreate):
        try:
            if reel_data.recipe_id:
                recipe = db.query(RecipeDB).filter(RecipeDB.id == reel_data.recipe_id).first()
                if not recipe:
                    raise CustomException(
                        message="Không tìm thấy công thức đính kèm",
                        code="RECIPE_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND
                    )

            new_reel = ReelDB(
                user_id=current_user.id,
                video_url=reel_data.video_url,
                poster_url=reel_data.poster_url,
                caption=reel_data.caption,
                recipe_id=reel_data.recipe_id
            )

            db.add(new_reel)
            db.commit()
            db.refresh(new_reel)
            return {"id": new_reel.id, "video_url": new_reel.video_url}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi đăng tải video Reels: {e}")
            raise CustomException(
                message="Không thể đăng tải video ngắn",
                code="CREATE_REEL_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def toggle_reel_like(db: Session, current_user: UserDB, reel_id: int, background_tasks: Optional[BackgroundTasks] = None):
        try:
            reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
            if not reel:
                raise CustomException(
                    message="Không tìm thấy video ngắn",
                    code="REEL_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            like_record = db.query(ReelLikeDB).filter(
                ReelLikeDB.reel_id == reel_id,
                ReelLikeDB.user_id == current_user.id
            ).first()

            if like_record:
                db.delete(like_record)
                db.commit()
                return {"isLiked": False}
            else:
                new_like = ReelLikeDB(reel_id=reel_id, user_id=current_user.id)
                db.add(new_like)
                db.commit()

                # Gửi thông báo LIKE Reel
                if reel.user_id != current_user.id:
                    try:
                        notify_in = NotificationCreate(
                            user_id=reel.user_id,
                            type="LIKE",
                            reference_type="reel",
                            reference_id=reel.id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                    except Exception as ex:
                        print(f"⚠️ Không thể tạo thông báo Like Reel: {ex}")

                return {"isLiked": True}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi thích/bỏ thích video Reels: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi thực hiện hành động thích",
                code="LIKE_REEL_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_reel_comments(db: Session, current_user: Optional[UserDB], reel_id: int):
        try:
            comments = db.query(ReelCommentDB).filter(
                ReelCommentDB.reel_id == reel_id
            ).order_by(ReelCommentDB.created_at.desc()).all()

            result = []
            for c in comments:
                is_liked = False
                if current_user:
                    like_exists = db.query(ReelCommentLikeDB).filter(
                        ReelCommentLikeDB.comment_id == c.id,
                        ReelCommentLikeDB.user_id == current_user.id
                    ).first()
                    is_liked = like_exists is not None

                likes_count = db.query(ReelCommentLikeDB).filter(
                    ReelCommentLikeDB.comment_id == c.id
                ).count()

                result.append({
                    "id": c.id,
                    "user": {
                        "id": c.user.id,
                        "name": c.user.full_name or c.user.username,
                        "avatar": c.user.avatar
                    },
                    "content": c.content,
                    "parent_comment_id": c.parent_comment_id,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "likesCount": likes_count,
                    "isLiked": is_liked
                })
            return result
        except Exception as e:
            print(f"❌ Lỗi khi lấy bình luận Reels: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tải bình luận",
                code="LOAD_REEL_COMMENTS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def create_reel_comment(db: Session, current_user: UserDB, reel_id: int, content: str, parent_comment_id: Optional[int] = None, background_tasks: Optional[BackgroundTasks] = None):
        try:
            reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
            if not reel:
                raise CustomException(
                    message="Không tìm thấy video ngắn",
                    code="REEL_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            if not content.strip():
                raise CustomException(
                    message="Nội dung bình luận không được để trống",
                    code="INVALID_COMMENT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if parent_comment_id:
                parent = db.query(ReelCommentDB).filter(ReelCommentDB.id == parent_comment_id).first()
                if not parent:
                    raise CustomException(
                        message="Bình luận gốc không tồn tại",
                        code="PARENT_COMMENT_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND
                    )

            new_comment = ReelCommentDB(
                reel_id=reel_id,
                user_id=current_user.id,
                content=content.strip(),
                parent_comment_id=parent_comment_id
            )

            db.add(new_comment)
            db.commit()
            db.refresh(new_comment)

            # Gửi thông báo COMMENT Reel / REPLY Reel Comment
            if parent_comment_id:
                try:
                    parent = db.query(ReelCommentDB).filter(ReelCommentDB.id == parent_comment_id).first()
                    if parent and parent.user_id != current_user.id:
                        notify_in = NotificationCreate(
                            user_id=parent.user_id,
                            type="COMMENT",
                            reference_type="reel_comment",
                            reference_id=reel.id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                except Exception as ex:
                    print(f"⚠️ Không thể tạo thông báo Reply Comment Reel: {ex}")
            else:
                if reel.user_id != current_user.id:
                    try:
                        notify_in = NotificationCreate(
                            user_id=reel.user_id,
                            type="COMMENT",
                            reference_type="reel",
                            reference_id=reel.id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                    except Exception as ex:
                        print(f"⚠️ Không thể tạo thông báo Comment Reel: {ex}")

            return {
                "id": new_comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": new_comment.content,
                "parent_comment_id": new_comment.parent_comment_id,
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
                "likesCount": 0,
                "isLiked": False
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi lưu bình luận Reels: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi lưu bình luận",
                code="CREATE_REEL_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def toggle_reel_comment_like(db: Session, current_user: UserDB, comment_id: int, background_tasks: Optional[BackgroundTasks] = None):
        try:
            comment = db.query(ReelCommentDB).filter(ReelCommentDB.id == comment_id).first()
            if not comment:
                raise CustomException(
                    message="Không tìm thấy bình luận",
                    code="COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            like_record = db.query(ReelCommentLikeDB).filter(
                ReelCommentLikeDB.comment_id == comment_id,
                ReelCommentLikeDB.user_id == current_user.id
            ).first()

            if like_record:
                db.delete(like_record)
                db.commit()
                return {"isLiked": False}
            else:
                new_like = ReelCommentLikeDB(comment_id=comment_id, user_id=current_user.id)
                db.add(new_like)
                db.commit()

                # Gửi thông báo LIKE Reel Comment
                if comment.user_id != current_user.id:
                    try:
                        notify_in = NotificationCreate(
                            user_id=comment.user_id,
                            type="LIKE",
                            reference_type="reel_comment",
                            reference_id=comment.reel_id,
                            actor_id=current_user.id
                        )
                        NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
                    except Exception as ex:
                        print(f"⚠️ Không thể tạo thông báo Like Reel Comment: {ex}")

                return {"isLiked": True}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi thích/bỏ thích bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi thực hiện hành động thích bình luận",
                code="LIKE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def upload_reel_video(db: Session, current_user: UserDB, video: UploadFile, caption: Optional[str], recipe_id: Optional[int]):
        try:
            if not video.filename.endswith((".mp4", ".mov", ".avi", ".mkv", ".3gp")):
                raise CustomException(
                    message="Định dạng video không hợp lệ (hỗ trợ .mp4, .mov, .avi)",
                    code="INVALID_VIDEO_FORMAT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if recipe_id:
                recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
                if not recipe:
                    raise CustomException(
                        message="Không tìm thấy công thức đính kèm",
                        code="RECIPE_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND
                    )

            # Upload video lên Cloudinary
            try:
                upload_result = cloudinary.uploader.upload(
                    video.file,
                    resource_type="video",
                    folder="food_ai_reels"
                )
                video_url = upload_result.get("secure_url")
            except Exception as e:
                print(f"❌ Cloudinary upload error: {e}")
                raise CustomException(
                    message="Không thể tải video lên Cloudinary",
                    code="CLOUDINARY_UPLOAD_ERROR",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            poster_url = None
            if video_url:
                poster_url = video_url.rsplit(".", 1)[0] + ".jpg"

            new_reel = ReelDB(
                user_id=current_user.id,
                video_url=video_url,
                poster_url=poster_url,
                caption=caption,
                recipe_id=recipe_id
            )
            db.add(new_reel)
            db.commit()
            db.refresh(new_reel)

            return {
                "id": f"reel-{new_reel.id}",
                "db_id": new_reel.id,
                "videoUrl": new_reel.video_url,
                "posterUrl": new_reel.poster_url,
                "caption": new_reel.caption
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi đăng tải video Reels lên Cloudinary: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi đăng tải video ngắn",
                code="UPLOAD_REEL_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # tính view
    @staticmethod
    def increment_reel_view(db: Session, reel_id: int):
        try:
            reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
            if not reel:
                raise CustomException(
                    message="Không tìm thấy video ngắn",
                    code="REEL_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            reel.view_count += 1
            db.commit()
            db.refresh(reel)
            return {"viewsCount": reel.view_count}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi tăng lượt xem video Reels: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tăng lượt xem",
                code="VIEW_REEL_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
