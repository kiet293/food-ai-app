from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB, CommentDB
from app.models.user_model import UserDB
from app.schemas.recipe import CommentCreate
from app.utils.deps import get_current_user
from app.utils.response import success_response, CustomException

router = APIRouter(tags=["Comments"])

# API ĐĂNG BÌNH LUẬN (US-04)
@router.post("/{recipe_id}/comments")
def add_comment(
    recipe_id: int,
    comment_data: CommentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra công thức có tồn tại không
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        if not comment_data.content.strip():
            raise CustomException(
                message="Nội dung bình luận không được để trống",
                code="INVALID_COMMENT",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        # Tạo bình luận mới
        new_comment = CommentDB(
            recipe_id=recipe_id,
            user_id=current_user.id,
            content=comment_data.content.strip()
        )
        
        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)
        
        # Lấy thông tin tác giả bình luận để trả về luôn cho app
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
            message="Đã đăng bình luận thành công!"
        )
        
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống khi đăng bình luận: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi lưu bình luận",
            code="CREATE_COMMENT_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
