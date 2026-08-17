from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, BackgroundTasks
import cloudinary.uploader
from typing import Optional
from datetime import datetime

from app.users.models import UserDB, FollowDB
from app.users.schemas import UserUpdate
from app.recipes.models import RecipeDB, FavoriteDB
from app.collections.models import CollectionDB, CollectionRecipeDB
from app.reels.models import ReelDB, ReelLikeDB
from app.notifications.services import NotificationService
from app.notifications.schemas import NotificationCreate
from app.utils.response import CustomException

DEFAULT_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80"

class UserService:
    @staticmethod
    def get_my_profile(db: Session, current_user: UserDB):
        try:
            # 1. Thống kê số lượng Follower & Following
            following_count = db.query(FollowDB).filter(FollowDB.follower_id == current_user.id).count()
            followers_in_db = db.query(FollowDB).filter(FollowDB.following_id == current_user.id).count()
            follower_count = max(followers_in_db, current_user.follower_count or 0)

            # 2. Thống kê tổng số lượt thích (heart) nhận được trên tất cả Reels của người dùng này
            total_likes_count = db.query(ReelLikeDB).join(ReelDB).filter(ReelDB.user_id == current_user.id).count()

            # 3. Lấy danh sách Reels chính chủ do người dùng tự đăng
            my_reels_db = db.query(ReelDB).filter(ReelDB.user_id == current_user.id).order_by(ReelDB.created_at.desc()).all()
            my_reels = []
            for r in my_reels_db:
                likes_cnt = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == r.id).count()
                my_reels.append({
                    "id": f"reel-{r.id}",
                    "db_id": r.id,
                    "videoUrl": r.video_url,
                    "posterUrl": r.poster_url or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                    "caption": r.caption or "",
                    "likesCount": likes_cnt,
                    "viewsCount": r.view_count
                })

            # 4. Lấy danh sách Reels người dùng đã thích
            liked_reels_db = db.query(ReelDB).join(ReelLikeDB).filter(ReelLikeDB.user_id == current_user.id).order_by(ReelLikeDB.created_at.desc()).all()
            liked_reels = []
            for r in liked_reels_db:
                likes_cnt = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == r.id).count()
                liked_reels.append({
                    "id": f"reel-{r.id}",
                    "db_id": r.id,
                    "videoUrl": r.video_url,
                    "posterUrl": r.poster_url or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                    "caption": r.caption or "",
                    "likesCount": likes_cnt,
                    "viewsCount": r.view_count
                })

            # 5. Đếm số công thức đã lưu
            saved_recipes_count = db.query(FavoriteDB).filter(FavoriteDB.user_id == current_user.id).count()

            # 6. Lấy danh sách công thức của chính người dùng này
            recent_recipes = db.query(RecipeDB).filter(RecipeDB.user_id == current_user.id).order_by(RecipeDB.created_at.desc()).limit(10).all()
            recent_data = [
                {
                    "id": str(r.id),
                    "title": r.recipe_name,
                    "image": r.image_url or "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
                } for r in recent_recipes
            ]

            return {
                "id": current_user.id,
                "username": current_user.username,
                "full_name": current_user.full_name or current_user.username,
                "avatar": current_user.avatar or "👨‍🍳",
                "bio": current_user.bio if current_user.bio is not None else "",
                "status_badge": "Tám chuyện nào 💬",
                "following_count": following_count,
                "follower_count": follower_count,
                "total_likes_count": total_likes_count,
                "saved_recipes_count": saved_recipes_count,
                "my_reels": my_reels,
                "liked_reels": liked_reels,
                "recent_recipes": recent_data,
                "joined_at": current_user.created_at.strftime("%d/%m/%Y") if current_user.created_at else "N/A"
            }
        except Exception as e:
            print(f"❌ Lỗi khi lấy profile cá nhân: {e}")
            return {
                "username": current_user.username,
                "full_name": current_user.full_name or current_user.username,
                "avatar": current_user.avatar or "👨‍🍳",
                "bio": "",
                "following_count": 0,
                "follower_count": 0,
                "total_likes_count": 0,
                "my_reels": [],
                "liked_reels": [],
                "saved_recipes_count": 0,
                "joined_at": "N/A"
            }

    @staticmethod
    def update_profile(db: Session, current_user: UserDB, update_data: UserUpdate):
        # Cập nhật tên hiển thị
        if update_data.full_name is not None:
            current_user.full_name = update_data.full_name

        # Cập nhật tiểu sử
        if update_data.bio is not None:
            current_user.bio = update_data.bio

        # Cập nhật avatar
        if update_data.avatar is not None:
            # Xóa ảnh cũ trên Cloudinary nếu đang có ảnh và avatar mới khác ảnh cũ
            if current_user.avatar and current_user.avatar.startswith("http") and current_user.avatar != update_data.avatar:
                try:
                    public_id = current_user.avatar.split("/")[-1].split(".")[0]
                    import cloudinary.uploader
                    cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    print("Lỗi xóa ảnh cũ:", e)
                    
            current_user.avatar = update_data.avatar  
            
        db.commit()
        db.refresh(current_user)
        return {"message": "Cập nhật hồ sơ thành công!"}

    @staticmethod
    def update_avatar_file(db: Session, current_user: UserDB, file: UploadFile):
        try:
            # Xóa ảnh cũ trên Cloudinary nếu nó là link ảnh
            if current_user.avatar and current_user.avatar.startswith("http"):
                try:
                    public_id = current_user.avatar.split("/")[-1].split(".")[0]
                    cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    print("Lỗi xóa ảnh cũ:", e)
                    
            # Upload image to Cloudinary
            upload_result = cloudinary.uploader.upload(file.file)
            image_url = upload_result.get("secure_url")
            
            # Update user avatar
            current_user.avatar = image_url
            db.commit()
            db.refresh(current_user)
            
            return {"message": "Cập nhật ảnh đại diện thành công!", "avatar_url": image_url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def get_popular_chefs(db: Session):
        chefs = db.query(UserDB).order_by(UserDB.follower_count.desc()).limit(20).all()
        chef_data = [
            {
                "id": str(chef.id),
                "name": chef.full_name or chef.username,
                "avatar": chef.avatar or DEFAULT_AVATAR,
                "isFollowing": False,
                "follower_count": chef.follower_count
            }
            for chef in chefs
        ]
        return chef_data

    @staticmethod
    def get_user_profile(db: Session, user_id: int, current_user: Optional[UserDB]):
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise CustomException(message="User not found", code="USER_NOT_FOUND", status_code=404)

        is_following = False
        is_self = False
        if current_user:
            is_self = current_user.id == user.id
            if not is_self:
                is_following = db.query(FollowDB).filter(
                    FollowDB.follower_id == current_user.id,
                    FollowDB.following_id == user.id
                ).first() is not None

        following_count = db.query(FollowDB).filter(FollowDB.follower_id == user.id).count()
        followers_in_db = db.query(FollowDB).filter(FollowDB.following_id == user.id).count()
        follower_count = max(followers_in_db, user.follower_count or 0)

        total_likes_count = db.query(ReelLikeDB).join(ReelDB).filter(ReelDB.user_id == user.id).count()

        my_reels_db = db.query(ReelDB).filter(ReelDB.user_id == user.id).order_by(ReelDB.created_at.desc()).all()
        my_reels = []
        for r in my_reels_db:
            likes_cnt = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == r.id).count()
            my_reels.append({
                "id": f"reel-{r.id}",
                "db_id": r.id,
                "videoUrl": r.video_url,
                "posterUrl": r.poster_url or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                "caption": r.caption or "",
                "likesCount": likes_cnt,
                "viewsCount": r.view_count
            })

        liked_reels_db = db.query(ReelDB).join(ReelLikeDB).filter(ReelLikeDB.user_id == user.id).order_by(ReelLikeDB.created_at.desc()).all()
        liked_reels = []
        for r in liked_reels_db:
            likes_cnt = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == r.id).count()
            liked_reels.append({
                "id": f"reel-{r.id}",
                "db_id": r.id,
                "videoUrl": r.video_url,
                "posterUrl": r.poster_url or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                "caption": r.caption or "",
                "likesCount": likes_cnt,
                "viewsCount": r.view_count
            })

        recent_recipes = db.query(RecipeDB).filter(
            RecipeDB.user_id == user_id,
            RecipeDB.is_ai == False
        ).order_by(RecipeDB.created_at.desc()).limit(10).all()

        collections = db.query(CollectionDB).filter(CollectionDB.user_id == user_id).order_by(CollectionDB.created_at.desc()).all()
        
        recent_data = [
            {
                "id": str(r.id),
                "title": r.recipe_name,
                "image": r.image_url or "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
            } for r in recent_recipes
        ]
        
        collections_data = []
        for c in collections:
            count = db.query(CollectionRecipeDB).filter(CollectionRecipeDB.collection_id == c.id).count()
            first_cr = db.query(CollectionRecipeDB).filter(CollectionRecipeDB.collection_id == c.id).first()
            image_url = "https://images.unsplash.com/photo-1490818387583-1b5ba4597389?w=500&q=80"
            if first_cr and first_cr.recipe and first_cr.recipe.image_url:
                image_url = first_cr.recipe.image_url
                
            collections_data.append({
                "id": str(c.id),
                "title": c.name,
                "count": count,
                "image": image_url
            })
            
        profile_data = {
            "id": str(user.id),
            "name": user.full_name or user.username,
            "handle": f"@{user.username}",
            "avatar": user.avatar or DEFAULT_AVATAR,
            "bio": user.bio or "",
            "following_count": following_count,
            "follower_count": follower_count,
            "total_likes_count": total_likes_count,
            "is_following": is_following,
            "is_self": is_self,
            "recent_recipes": recent_data,
            "collections": collections_data,
            "my_reels": my_reels,
            "liked_reels": liked_reels
        }
        return profile_data

    @staticmethod
    def _serialize_follow_user(db: Session, other_user: UserDB, current_user: Optional[UserDB]) -> dict:
        is_following = False
        is_self = False
        if current_user:
            is_self = current_user.id == other_user.id
            if not is_self:
                is_following = db.query(FollowDB).filter(
                    FollowDB.follower_id == current_user.id,
                    FollowDB.following_id == other_user.id
                ).first() is not None
        return {
            "id": str(other_user.id),
            "name": other_user.full_name or other_user.username,
            "handle": f"@{other_user.username}",
            "avatar": other_user.avatar or DEFAULT_AVATAR,
            "is_following": is_following,
            "is_self": is_self,
        }

    @staticmethod
    def get_user_followers(db: Session, user_id: int, page: int, limit: int, current_user: Optional[UserDB]):
        target = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not target:
            raise CustomException(message="User not found", code="USER_NOT_FOUND", status_code=404)

        query = db.query(FollowDB).filter(FollowDB.following_id == user_id).order_by(FollowDB.created_at.desc())
        total_items = query.count()
        total_pages = (total_items + limit - 1) // limit if total_items else 0
        rows = query.offset((page - 1) * limit).limit(limit).all()

        follower_ids = [r.follower_id for r in rows]
        users_by_id = {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(follower_ids)).all()}
        items = [UserService._serialize_follow_user(db, users_by_id[fid], current_user) for fid in follower_ids if fid in users_by_id]

        return {
            "items": items,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items,
                "limit": limit
            }
        }

    @staticmethod
    def get_user_following(db: Session, user_id: int, page: int, limit: int, current_user: Optional[UserDB]):
        target = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not target:
            raise CustomException(message="User not found", code="USER_NOT_FOUND", status_code=404)

        query = db.query(FollowDB).filter(FollowDB.follower_id == user_id).order_by(FollowDB.created_at.desc())
        total_items = query.count()
        total_pages = (total_items + limit - 1) // limit if total_items else 0
        rows = query.offset((page - 1) * limit).limit(limit).all()

        following_ids = [r.following_id for r in rows]
        users_by_id = {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(following_ids)).all()}
        items = [UserService._serialize_follow_user(db, users_by_id[fid], current_user) for fid in following_ids if fid in users_by_id]

        return {
            "items": items,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items,
                "limit": limit
            }
        }

    @staticmethod
    def follow_user(db: Session, target_user_id: int, current_user: UserDB, background_tasks: Optional[BackgroundTasks] = None):
        try:
            if current_user.id == target_user_id:
                raise CustomException(
                    message="Bạn không thể tự theo dõi chính mình",
                    code="SELF_FOLLOW_ERROR",
                    status_code=400
                )
                
            target_user = db.query(UserDB).filter(UserDB.id == target_user_id).first()
            if not target_user:
                raise CustomException(
                    message="Không tìm thấy người dùng",
                    code="USER_NOT_FOUND",
                    status_code=404
                )
                
            existing_follow = db.query(FollowDB).filter(
                FollowDB.follower_id == current_user.id,
                FollowDB.following_id == target_user_id
            ).first()
            
            if existing_follow:
                return {"isFollowing": True, "already": True}
                
            new_follow = FollowDB(
                follower_id=current_user.id,
                following_id=target_user_id
            )
            db.add(new_follow)
            target_user.follower_count = (target_user.follower_count or 0) + 1
            db.commit()

            # Gửi thông báo FOLLOW
            try:
                notify_in = NotificationCreate(
                    user_id=target_user_id,
                    type="FOLLOW",
                    reference_type="user",
                    reference_id=current_user.id,
                    actor_id=current_user.id
                )
                NotificationService.create_notification(db=db, notification_in=notify_in, background_tasks=background_tasks)
            except Exception as ex:
                print(f"⚠️ Không thể tạo thông báo Follow: {ex}")
            
            return {"isFollowing": True, "already": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi theo dõi người dùng: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi theo dõi người dùng",
                code="FOLLOW_USER_ERROR",
                status_code=500
            )

    @staticmethod
    def unfollow_user(db: Session, target_user_id: int, current_user: UserDB):
        try:
            existing_follow = db.query(FollowDB).filter(
                FollowDB.follower_id == current_user.id,
                FollowDB.following_id == target_user_id
            ).first()
            
            if not existing_follow:
                raise CustomException(
                    message="Bạn chưa theo dõi người dùng này",
                    code="NOT_FOLLOWING_ERROR",
                    status_code=400
                )

            db.delete(existing_follow)
            target_user = db.query(UserDB).filter(UserDB.id == target_user_id).first()
            if target_user and target_user.follower_count > 0:
                target_user.follower_count -= 1
            db.commit()
            
            return {"isFollowing": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi hủy theo dõi người dùng: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi hủy theo dõi",
                code="UNFOLLOW_USER_ERROR",
                status_code=500
            )

