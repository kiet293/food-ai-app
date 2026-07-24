from fastapi import APIRouter, Depends, Body, status, Request  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from app.models.database import get_db
from app.models.reel_model import ReelDB, ReelLikeDB, ReelCommentDB
from app.models.recipe_model import RecipeDB
from app.models.user_model import UserDB
from app.schemas.reel import ReelCreate, ReelCommentCreate
from app.utils.deps import get_current_user
from app.utils.response import success_response, CustomException
from app.utils.security import SECRET_KEY, ALGORITHM
from jose import jwt
from typing import Optional

router = APIRouter(tags=["Reels Management"])

# Hàm phụ lấy user nếu có token (không bắt buộc đăng nhập)
def get_optional_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db.query(UserDB).filter(UserDB.id == int(user_id)).first()
    except Exception:
        pass
    return None

# 1. API LẤY DANH SÁCH CLIPS (GET /api/reels)
@router.get("")
def get_reels(
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    try:
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
                    "isFollowing": False # Có thể cập nhật logic follow sau
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
    db: Session = Depends(get_db)
):
    try:
        comments = db.query(ReelCommentDB).filter(
            ReelCommentDB.reel_id == reel_id
        ).order_by(ReelCommentDB.created_at.desc()).all()

        result = []
        for c in comments:
            result.append({
                "id": c.id,
                "user": {
                    "id": c.user.id,
                    "name": c.user.full_name or c.user.username,
                    "avatar": c.user.avatar
                },
                "content": c.content,
                "created_at": c.created_at.isoformat() if c.created_at else None
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
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None
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

