from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB, CommentDB, RatingDB, FavoriteDB
from app.models.user_model import UserDB, FollowDB
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
            
        if comment_data.parent_comment_id:
            parent = db.query(CommentDB).filter(CommentDB.id == comment_data.parent_comment_id).first()
            if not parent:
                raise CustomException(
                    message="Bình luận gốc không tồn tại",
                    code="PARENT_COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
        # Tạo bình luận mới
        new_comment = CommentDB(
            recipe_id=recipe_id,
            user_id=current_user.id,
            content=comment_data.content.strip(),
            parent_comment_id=comment_data.parent_comment_id
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
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
                "parent_comment_id": new_comment.parent_comment_id
            },
            message="Đăng bình luận thành công"
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


# API YÊU THÍCH CÔNG THỨC (POST /api/recipes/{id}/favorite)
@router.post("/recipes/{id}/favorite")
def favorite_recipe(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        recipe = db.query(RecipeDB).filter(RecipeDB.id == id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        existing_favorite = db.query(FavoriteDB).filter(
            FavoriteDB.recipe_id == id,
            FavoriteDB.user_id == current_user.id
        ).first()

        if existing_favorite:
            return success_response(
                message="Bạn đã yêu thích công thức này rồi!",
                data={"isFavorited": True}
            )

        new_favorite = FavoriteDB(recipe_id=id, user_id=current_user.id)
        db.add(new_favorite)
        db.commit()

        return success_response(
            message="Đã thêm vào yêu thích!",
            data={"isFavorited": True}
        )
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi hệ thống khi yêu thích công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi yêu thích công thức",
            code="FAVORITE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API BỎ YÊU THÍCH CÔNG THỨC (DELETE /api/recipes/{id}/favorite)
@router.delete("/recipes/{id}/favorite")
def unfavorite_recipe(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        existing_favorite = db.query(FavoriteDB).filter(
            FavoriteDB.recipe_id == id,
            FavoriteDB.user_id == current_user.id
        ).first()

        if not existing_favorite:
            raise CustomException(
                message="Bạn chưa yêu thích công thức này",
                code="NOT_FAVORITED_ERROR",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        db.delete(existing_favorite)
        db.commit()

        return success_response(
            message="Đã bỏ yêu thích!",
            data={"isFavorited": False}
        )
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi hệ thống khi bỏ yêu thích công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi bỏ yêu thích",
            code="UNFAVORITE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API THEO DÕI NGƯỜI DÙNG (POST /api/users/{id}/follow)
@router.post("/users/{id}/follow")
def follow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Không được tự theo dõi chính mình
        if current_user.id == id:
            raise CustomException(
                message="Bạn không thể tự theo dõi chính mình",
                code="SELF_FOLLOW_ERROR",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        # Kiểm tra người dùng được theo dõi có tồn tại không
        target_user = db.query(UserDB).filter(UserDB.id == id).first()
        if not target_user:
            raise CustomException(
                message="Không tìm thấy người dùng",
                code="USER_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        # Kiểm tra xem đã theo dõi chưa
        existing_follow = db.query(FollowDB).filter(
            FollowDB.follower_id == current_user.id,
            FollowDB.following_id == id
        ).first()
        
        if existing_follow:
            return success_response(
                message="Bạn đã theo dõi người dùng này rồi!",
                data={"isFollowing": True}
            )
            
        # Thêm bản ghi mới
        new_follow = FollowDB(
            follower_id=current_user.id,
            following_id=id
        )
        db.add(new_follow)
        target_user.follower_count = (target_user.follower_count or 0) + 1
        db.commit()
        
        return success_response(
            message="Theo dõi người dùng thành công!",
            data={"isFollowing": True}
        )
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi hệ thống khi theo dõi người dùng: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi theo dõi người dùng",
            code="FOLLOW_USER_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API HỦY THEO DÕI NGƯỜI DÙNG (DELETE /api/users/{id}/follow)
@router.delete("/users/{id}/follow")
def unfollow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Kiểm tra bản ghi theo dõi
        existing_follow = db.query(FollowDB).filter(
            FollowDB.follower_id == current_user.id,
            FollowDB.following_id == id
        ).first()
        
        if not existing_follow:
            raise CustomException(
                message="Bạn chưa theo dõi người dùng này",
                code="NOT_FOLLOWING_ERROR",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        db.delete(existing_follow)
        target_user = db.query(UserDB).filter(UserDB.id == id).first()
        if target_user and target_user.follower_count > 0:
            target_user.follower_count -= 1
        db.commit()
        
        return success_response(
            message="Đã hủy theo dõi người dùng!",
            data={"isFollowing": False}
        )
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi hệ thống khi hủy theo dõi người dùng: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi hủy theo dõi",
            code="UNFOLLOW_USER_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
