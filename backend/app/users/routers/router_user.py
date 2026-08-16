from fastapi import APIRouter, Depends, Query  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import Optional

from app.models.database import get_db
from app.users.models import UserDB
from app.users.services import UserService
from app.utils.deps import get_optional_current_user, get_current_user
from app.utils.response import success_response

router = APIRouter(tags=["User Management"])

@router.get("/popular-chefs")
def get_popular_chefs(db: Session = Depends(get_db)):
    data = UserService.get_popular_chefs(db)
    return success_response(data=data, message="Fetched popular chefs successfully")

@router.get("/{user_id}/profile")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = UserService.get_user_profile(db, user_id, current_user)
    return success_response(data=data, message="Fetched user profile successfully")

@router.get("/{user_id}/followers")
def get_user_followers(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = UserService.get_user_followers(db, user_id, page, limit, current_user)
    return success_response(data=data, message="Fetched followers successfully")

@router.get("/{user_id}/following")
def get_user_following(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    data = UserService.get_user_following(db, user_id, page, limit, current_user)
    return success_response(data=data, message="Fetched following successfully")


# 5. API THEO DÕI NGƯỜI DÙNG (POST /api/users/{id}/follow)
@router.post("/{id}/follow")
def follow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = UserService.follow_user(db=db, target_user_id=id, current_user=current_user)
    if data.get("already"):
        return success_response(message="Bạn đã theo dõi người dùng này rồi!", data={"isFollowing": True})
    return success_response(message="Theo dõi người dùng thành công!", data={"isFollowing": True})


# 6. API HỦY THEO DÕI NGƯỜI DÙNG (DELETE /api/users/{id}/follow)
@router.delete("/{id}/follow")
def unfollow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = UserService.unfollow_user(db=db, target_user_id=id, current_user=current_user)
    return success_response(message="Đã hủy theo dõi người dùng!", data=data)

