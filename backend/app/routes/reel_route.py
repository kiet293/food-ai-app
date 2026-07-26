from fastapi import APIRouter, Depends, Body, status  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from app.models.database import get_db
from app.models.reel_model import ReelDB, ReelLikeDB, ReelCommentDB, ReelCommentLikeDB
from app.models.recipe_model import RecipeDB
from app.models.user_model import UserDB, FollowDB
from app.schemas.reel import ReelCreate, ReelCommentCreate
from app.utils.deps import get_current_user, get_optional_current_user
from app.utils.response import success_response, CustomException
from typing import Optional

router = APIRouter(tags=["Reels Management"])

import os
import urllib.request
import json
import ssl

def sync_pexels_cooking_videos(db: Session):
    pexels_key = os.getenv("PEXELS_API_KEY")
    if not pexels_key:
        print("[PEXELS] PEXELS_API_KEY khong duoc cau hinh trong .env.")
        return

    # Kiem tra xem co bao nhieu reels trong DB. Neu da co nhieu (>= 15), khong can pull them de tranh overload
    reels_count = db.query(ReelDB).count()
    if reels_count >= 15:
        return

    print("[PEXELS] Dang pull them video tu Pexels vi database dang co it video...")
    try:
        # Bo qua xac thuc SSL (tranh loi tren mot so may Windows)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        url = "https://api.pexels.com/videos/search?query=cooking&per_page=12&orientation=portrait"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": pexels_key,
                "User-Agent": "Mozilla/5.0"
            }
        )

        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            videos = res_data.get("videos", [])

            last_names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu", "Vo", "Dang", "Bui", "Do", "Ho", "Ngo"]
            first_names = [
                "Minh Anh", "Gia Khanh", "Hong Hanh", "Tuan Kiet", "Bao Chau", 
                "Huu Phuoc", "Thanh Van", "Quoc Anh", "Nhat Linh", "Phuong Trinh",
                "Thanh Nam", "Xuan Truong", "Trong Hieu", "Thu Trang", "Bich Ngoc",
                "Dinh Phong", "Khanh Ha", "The Dat", "Hoai An", "Cam Tu"
            ]
            avatars = [
                "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
            ]

            for v in videos:
                # 1. Tim link video phu hop
                video_files = v.get("video_files", [])
                video_url = None
                for f in video_files:
                    if f.get("width") and f.get("height") and f.get("width") < f.get("height"):
                        video_url = f.get("link")
                        break
                if not video_url and video_files:
                    video_url = video_files[0].get("link")

                if not video_url:
                    continue

                # Kiem tra xem video da co trong database chua
                exists = db.query(ReelDB).filter(ReelDB.video_url == video_url).first()
                if exists:
                    continue

                # 2. Tu dong dang ky va Viet hoa tai khoan tac gia
                photographer_id = v.get("user", {}).get("id")
                if not photographer_id:
                    continue

                username = f"pexels_user_{photographer_id}"
                author = db.query(UserDB).filter(UserDB.username == username).first()
                if not author:
                    last_idx = photographer_id % len(last_names)
                    first_idx = (photographer_id * 3) % len(first_names)
                    title = "Đầu bếp " if photographer_id % 2 == 0 else "Chef "
                    
                    vietnamese_names_unicode = [
                        "Minh Anh", "Gia Khánh", "Hồng Hạnh", "Tuấn Kiệt", "Bảo Châu", 
                        "Hữu Phước", "Thanh Vân", "Quốc Anh", "Nhật Linh", "Phương Trinh",
                        "Thành Nam", "Xuân Trường", "Trọng Hiếu", "Thu Trang", "Bích Ngọc",
                        "Đình Phong", "Khánh Hà", "Thế Đạt", "Hoài An", "Cẩm Tú"
                    ]
                    vietnamese_last_names_unicode = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô"]
                    
                    full_name = f"{title}{vietnamese_last_names_unicode[last_idx]} {vietnamese_names_unicode[first_idx]}"
                    avatar = avatars[photographer_id % len(avatars)]
                    
                    author = UserDB(
                        username=username,
                        hashed_password="pexels_placeholder_password",
                        full_name=full_name,
                        avatar=avatar
                    )
                    db.add(author)
                    db.commit()
                    db.refresh(author)

                # 3. Tao va luu Reels moi vao PostgreSQL
                captions_unicode = [
                    "Hôm nay cùng mình vào bếp chuẩn bị món ăn siêu hấp dẫn này nhé! 🥗 #HealthyEating #KitchenLife #Cooking",
                    "Bí quyết làm nước sốt ngon tuyệt đỉnh từ hương vị tự nhiên! 🥫✨ #ChefCooking #Homemade #Yummy",
                    "Kỹ năng chuẩn bị nguyên liệu nhanh gọn nhẹ cho người bận rộn. 🔪🧅 #MealPrep #Tips #Freshfood",
                    "Thêm một công thức bánh ngọt ngào cho ngày cuối tuần hạnh phúc! 🍫🎂 #BakingDay #SweetTooth #Dessert",
                    "Món ngon mỗi ngày cực kỳ dễ làm tại nhà cho cả gia đình! 🍳❤️ #FamilyMeal #Delicious #CookAtHome",
                    "Hương vị thơm lừng đánh thức mọi giác quan của bạn! 🥓🔥 #FoodLover #CookingTime #Breakfast",
                    "Rửa sạch và giữ độ tươi ngon tự nhiên cho rau củ quả. 🥦💦 #CleanFood #HealthTips #GreenLife",
                    "Trải nghiệm công thức salad trộn dầu giấm siêu thanh mát đẹp da! 🥗☀️ #HealthyDiet #FitnessFood #EasyRecipe"
                ]
                
                poster_url = v.get("image") or "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800"
                new_reel = ReelDB(
                    user_id=author.id,
                    video_url=video_url,
                    poster_url=poster_url,
                    caption=captions_unicode[v.get("id") % len(captions_unicode)],
                    recipe_id=None
                )
                db.add(new_reel)
                db.commit()
                
                # Them tuong tac thich & binh luan ao ban dau
                mock_like = ReelLikeDB(reel_id=new_reel.id, user_id=author.id)
                db.add(mock_like)
                
                mock_comment = ReelCommentDB(
                    reel_id=new_reel.id,
                    user_id=author.id,
                    content="Món này nhìn ngon quá! Rất dễ làm theo."
                )
                db.add(mock_comment)
                db.commit()

            print("[PEXELS] Da dong bo thanh cong cac video tu Pexels vao PostgreSQL!")
    except Exception as e:
        db.rollback()
        print(f"[PEXELS] Loi khi sync video tu Pexels: {e}")

# 1. API LẤY DANH SÁCH CLIPS (GET /api/reels)
@router.get("")
def get_reels(
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    try:
        # Tự động đồng bộ thêm video nấu ăn từ Pexels API
        sync_pexels_cooking_videos(db)
        
        reels = db.query(ReelDB).order_by(ReelDB.created_at.desc()).all()
        
        result_list = []
        for reel in reels:
            # 1. Kiểm tra xem người dùng hiện tại đã like video này chưa
            is_liked = False
            if current_user:
                like_exists = db.query(ReelLikeDB).filter(
                    ReelLikeDB.reel_id == reel.id,
                    ReelLikeDB.user_id == current_user.id
                ).first()
                is_liked = like_exists is not None

            # 2. Đếm số lượt thích & bình luận
            likes_count = db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == reel.id).count()
            comments_count = db.query(ReelCommentDB).filter(ReelCommentDB.reel_id == reel.id).count()

            # 4. Kiểm tra xem người dùng hiện tại đã follow tác giả video này chưa
            is_following = False
            if current_user:
                follow_exists = db.query(FollowDB).filter(
                    FollowDB.follower_id == current_user.id,
                    FollowDB.following_id == reel.user_id
                ).first()
                is_following = follow_exists is not None

            # 3. Lấy thông tin công thức đính kèm nếu có
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
                "savesCount": 0, # Mặc định
                "isSaved": False,
                "sharesCount": 0,
                "musicTrack": f"Âm thanh gốc - {reel.author.full_name or reel.author.username}",
                "recipe": recipe_info
            })

        return success_response(
            data=result_list,
            message="Tải danh sách video Reels thành công!"
        )
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách Reels: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tải video ngắn",
            code="LOAD_REELS_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 2. API ĐĂNG TẢI VIDEO REEL MỚI (POST /api/reels)
@router.post("")
def create_reel(
    reel_data: ReelCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra công thức đi kèm có tồn tại không (nếu có truyền recipe_id)
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

        return success_response(
            data={"id": new_reel.id, "video_url": new_reel.video_url},
            message="Đăng tải video Reels thành công!"
        )
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


# 3. API THẢ TIM / BỎ THẢ TIM VIDEO (POST /api/reels/{reel_id}/like)
@router.post("/{reel_id}/like")
def toggle_like_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra video tồn tại không
        reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
        if not reel:
            raise CustomException(
                message="Không tìm thấy video ngắn",
                code="REEL_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra xem đã thích chưa
        like_record = db.query(ReelLikeDB).filter(
            ReelLikeDB.reel_id == reel_id,
            ReelLikeDB.user_id == current_user.id
        ).first()

        if like_record:
            # Đã thích -> Bỏ thích
            db.delete(like_record)
            db.commit()
            return success_response(
                data={"isLiked": False},
                message="Đã bỏ thích video!"
            )
        else:
            # Chưa thích -> Thêm lượt thích
            new_like = ReelLikeDB(
                reel_id=reel_id,
                user_id=current_user.id
            )
            db.add(new_like)
            db.commit()
            return success_response(
                data={"isLiked": True},
                message="Đã thích video!"
            )

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


# 4. API LẤY DANH SÁCH BÌNH LUẬN CỦA REELS (GET /api/reels/{reel_id}/comments)
@router.get("/{reel_id}/comments")
def get_reel_comments(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    try:
        comments = db.query(ReelCommentDB).filter(
            ReelCommentDB.reel_id == reel_id
        ).order_by(ReelCommentDB.created_at.desc()).all()

        result = []
        for c in comments:
            # Kiểm tra xem user hiện tại đã thích bình luận này chưa
            is_liked = False
            if current_user:
                like_exists = db.query(ReelCommentLikeDB).filter(
                    ReelCommentLikeDB.comment_id == c.id,
                    ReelCommentLikeDB.user_id == current_user.id
                ).first()
                is_liked = like_exists is not None

            # Đếm số lượt thích bình luận
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
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "likesCount": likes_count,
                "isLiked": is_liked
            })

        return success_response(
            data=result,
            message="Tải bình luận thành công!"
        )
    except Exception as e:
        print(f"❌ Lỗi khi lấy bình luận Reels: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tải bình luận",
            code="LOAD_REEL_COMMENTS_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 5. API THÊM BÌNH LUẬN MỚI CHO REELS (POST /api/reels/{reel_id}/comments)
@router.post("/{reel_id}/comments")
def create_reel_comment(
    reel_id: int,
    comment_data: ReelCommentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra video tồn tại
        reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
        if not reel:
            raise CustomException(
                message="Không tìm thấy video ngắn",
                code="REEL_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not comment_data.content.strip():
            raise CustomException(
                message="Nội dung bình luận không được để trống",
                code="INVALID_COMMENT",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        new_comment = ReelCommentDB(
            reel_id=reel_id,
            user_id=current_user.id,
            content=comment_data.content.strip()
        )

        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)

        return success_response(
            data={
                "id": new_comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": new_comment.content,
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
                "likesCount": 0,
                "isLiked": False
            },
            message="Bình luận đã được đăng thành công!"
        )
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


# 6. API THẢ TIM / BỎ THẢ TIM BÌNH LUẬN (POST /api/reels/comments/{comment_id}/like)
@router.post("/comments/{comment_id}/like")
def toggle_like_reel_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra bình luận tồn tại
        comment = db.query(ReelCommentDB).filter(ReelCommentDB.id == comment_id).first()
        if not comment:
            raise CustomException(
                message="Không tìm thấy bình luận",
                code="COMMENT_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra xem đã thích bình luận chưa
        like_record = db.query(ReelCommentLikeDB).filter(
            ReelCommentLikeDB.comment_id == comment_id,
            ReelCommentLikeDB.user_id == current_user.id
        ).first()

        if like_record:
            # Đã thích -> Bỏ thích
            db.delete(like_record)
            db.commit()
            return success_response(
                data={"isLiked": False},
                message="Đã bỏ thích bình luận!"
            )
        else:
            # Chưa thích -> Thêm lượt thích
            new_like = ReelCommentLikeDB(
                comment_id=comment_id,
                user_id=current_user.id
            )
            db.add(new_like)
            db.commit()
            return success_response(
                data={"isLiked": True},
                message="Đã thích bình luận!"
            )
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

import cloudinary.uploader
from fastapi import UploadFile, File, Form

def upload_video_to_cloudinary(video: UploadFile) -> str:
    try:
        upload_result = cloudinary.uploader.upload(
            video.file,
            resource_type="video",
            folder="food_ai_reels"
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"❌ Cloudinary upload error: {e}")
        raise CustomException(
            message="Không thể tải video lên Cloudinary",
            code="CLOUDINARY_UPLOAD_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# 6. API ĐĂNG TẢI VIDEO THỰC TẾ LÊN CLOUDINARY (POST /api/reels/upload)
@router.post("/upload")
def upload_reel(
    video: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    recipe_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # 1. Kiểm tra định dạng file
        if not video.filename.endswith((".mp4", ".mov", ".avi", ".mkv", ".3gp")):
            raise CustomException(
                message="Định dạng video không hợp lệ (hỗ trợ .mp4, .mov, .avi)",
                code="INVALID_VIDEO_FORMAT",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 2. Kiểm tra công thức đi kèm (nếu có)
        if recipe_id:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức đính kèm",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

        # 3. Tải video lên Cloudinary bằng luồng upload_large
        print(f"[REELS] Đang upload video {video.filename} lên Cloudinary...")
        video_url = upload_video_to_cloudinary(video)

        # 4. Tự động tạo ảnh bìa poster từ giây đầu tiên của video trên Cloudinary
        poster_url = None
        if video_url:
            poster_url = video_url.rsplit(".", 1)[0] + ".jpg"

        # 5. Lưu bản ghi vào PostgreSQL
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

        return success_response(
            data={
                "id": f"reel-{new_reel.id}",
                "db_id": new_reel.id,
                "videoUrl": new_reel.video_url,
                "posterUrl": new_reel.poster_url,
                "caption": new_reel.caption
            },
            message="Đăng tải video Reels thành công!"
        )
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

