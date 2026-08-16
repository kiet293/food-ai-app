from fastapi import APIRouter, Depends, UploadFile, File, Body  # type: ignore
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session  # type: ignore

from app.models.database import get_db
from app.users.models import UserDB
from app.users.schemas import UserCreate, Token, UserUpdate
from app.users.services import AuthService, UserService
from app.utils.deps import get_current_user

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return AuthService.register(db, user)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return AuthService.login(db, form_data)

@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    return UserService.get_my_profile(db, current_user)

@router.put("/me/update")
def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    return UserService.update_profile(db, current_user, update_data)

@router.post("/me/avatar")
def update_avatar_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    return UserService.update_avatar_file(db, current_user, file)
