from fastapi import APIRouter, Depends, Body, UploadFile, File, Form  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import Optional

from app.api.dependencies import get_current_user, get_optional_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.reels.schema import ReelCommentCreate, ReelCreate
from app.modules.reels.service import ReelService
from app.modules.users.model import UserDB

router = APIRouter(tags=["Reels Management"])

# 1. API LẤY DANH SÁCH CLIPS (GET /api/reels)
@router.get("")
def get_reels(
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = ReelService.get_reels_list(db, current_user)
    return success_response(
        data=data,
        message="Tải danh sách video Reels thành công!"
    )


# 2. API ĐĂNG TẢI VIDEO REEL MỚI (POST /api/reels)
@router.post("")
def create_reel(
    reel_data: ReelCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = ReelService.create_new_reel(db, current_user, reel_data)
    return success_response(
        data=data,
        message="Đăng tải video Reels thành công!"
    )


# 3. API THẢ TIM / BỎ THẢ TIM VIDEO (POST /api/reels/{reel_id}/like)
@router.post("/{reel_id}/like")
def toggle_like_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = ReelService.toggle_reel_like(db, current_user, reel_id)
    message = "Đã thích video!" if data.get("isLiked") else "Đã bỏ thích video!"
    return success_response(
        data=data,
        message=message
    )


# 4. API LẤY DANH SÁCH BÌNH LUẬN CỦA REELS (GET /api/reels/{reel_id}/comments)
@router.get("/{reel_id}/comments")
def get_reel_comments(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = ReelService.get_reel_comments(db, current_user, reel_id)
    return success_response(
        data=data,
        message="Tải bình luận thành công!"
    )


# 5. API THÊM BÌNH LUẬN MỚI CHO REELS (POST /api/reels/{reel_id}/comments)
@router.post("/{reel_id}/comments")
def create_reel_comment(
    reel_id: int,
    comment_data: ReelCommentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = ReelService.create_reel_comment(db, current_user, reel_id, comment_data.content)
    return success_response(
        data=data,
        message="Bình luận đã được đăng thành công!"
    )


# 6. API THẢ TIM / BỎ THẢ TIM BÌNH LUẬN (POST /api/reels/comments/{comment_id}/like)
@router.post("/comments/{comment_id}/like")
def toggle_like_reel_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = ReelService.toggle_reel_comment_like(db, current_user, comment_id)
    message = "Đã thích bình luận!" if data.get("isLiked") else "Đã bỏ thích bình luận!"
    return success_response(
        data=data,
        message=message
    )


# 7. API ĐĂNG TẢI VIDEO THỰC TẾ LÊN CLOUDINARY (POST /api/reels/upload)
@router.post("/upload")
def upload_reel(
    video: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    recipe_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = ReelService.upload_reel_video(db, current_user, video, caption, recipe_id)
    return success_response(
        data=data,
        message="Đăng tải video Reels thành công!"
    )


# 8. API TĂNG LƯỢT XEM VIDEO REEL (POST /api/reels/{reel_id}/view)
@router.post("/{reel_id}/view")
def increment_view(
    reel_id: int,
    db: Session = Depends(get_db)
):
    data = ReelService.increment_reel_view(db, reel_id)
    return success_response(
        data=data,
        message="Tăng lượt xem thành công!"
    )
