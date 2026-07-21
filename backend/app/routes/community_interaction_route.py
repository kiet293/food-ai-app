from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB, CommentDB, RatingDB
from app.models.user_model import UserDB
from app.schemas.recipe import CommentCreate, RatingCreate
from app.utils.deps import get_current_user
from app.utils.response import success_response, CustomException

router = APIRouter(tags=["Community Interaction"])

# API ĐĂNG BÌNH LUẬN (US-04)
@router.post("/recipes/{recipe_id}/comments")
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

# API SỬA BÌNH LUẬN
@router.put("/comments/{comment_id}")
def update_comment(
    comment_id: int,
    comment_data: CommentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # 1. Tìm comment trong database
        comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
        if not comment:
            raise CustomException(
                message="Không tìm thấy bình luận",
                code="COMMENT_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # 2. Kiểm tra quyền sở hữu (chỉ tác giả mới được sửa)
        if comment.user_id != current_user.id:
            raise CustomException(
                message="Bạn không có quyền sửa bình luận này",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # 3. Validate dữ liệu
        new_content = comment_data.content.strip()
        if not new_content:
            raise CustomException(
                message="Nội dung bình luận không được để trống",
                code="INVALID_COMMENT",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 4. Cập nhật dữ liệu
        comment.content = new_content
        db.commit()
        db.refresh(comment)

        # 5. Trả về kết quả
        return success_response(
            data={
                "id": comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": comment.content,
                "created_at": comment.created_at.isoformat() if comment.created_at else None
            },
            message="Cập nhật bình luận thành công!"
        )

    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống khi sửa bình luận: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi cập nhật bình luận",
            code="UPDATE_COMMENT_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API XÓA BÌNH LUẬN
@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # 1. Tìm comment trong database
        comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
        if not comment:
            raise CustomException(
                message="Không tìm thấy bình luận",
                code="COMMENT_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # 2. Kiểm tra quyền sở hữu (chỉ tác giả hoặc Admin mới được xóa)
        if comment.user_id != current_user.id and not current_user.is_admin:
            raise CustomException(
                message="Bạn không có quyền xóa bình luận này",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # 3. Tiến hành xóa
        db.delete(comment)
        db.commit()

        # 4. Trả về kết quả
        return success_response(
            message="Đã xóa bình luận thành công!"
        )

    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống khi xóa bình luận: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi xóa bình luận",
            code="DELETE_COMMENT_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API ĐÁNH GIÁ CÔNG THỨC (US-05)
@router.post("/recipes/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int,
    rating_data: RatingCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # 1. Kiểm tra công thức tồn tại không
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        # 2. Kiểm tra xem người dùng đã đánh giá công thức này chưa
        existing_rating = db.query(RatingDB).filter(
            RatingDB.recipe_id == recipe_id, 
            RatingDB.user_id == current_user.id
        ).first()
        
        # 3. Upsert logic
        if existing_rating:
            # Đã đánh giá -> Cập nhật điểm số
            existing_rating.score = rating_data.score
            message = "Đã cập nhật đánh giá thành công!"
        else:
            # Chưa đánh giá -> Thêm mới
            new_rating = RatingDB(
                recipe_id=recipe_id,
                user_id=current_user.id,
                score=rating_data.score
            )
            db.add(new_rating)
            message = "Đã gửi đánh giá thành công!"
            
        db.commit()
        
        return success_response(
            message=message,
            data={"score": rating_data.score}
        )

    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống khi đánh giá công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi gửi đánh giá",
            code="RATE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
