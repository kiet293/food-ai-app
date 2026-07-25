from app.utils.deps import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.user_model import UserDB
from app.schemas.user import UserCreate, Token, UserUpdate
from app.utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

# api đăng ký
@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Kiểm tra xem tên đăng nhập đã ai dùng chưa
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập này đã có người sử dụng")

    # Mã hóa mật khẩu và lưu vào DB
    hashed_password = get_password_hash(user.password)
    new_user = UserDB(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Đăng ký xong thì cấp luôn Token để vào app (không cần đăng nhập lại)
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Tìm user trong DB
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    
    # Nếu không tìm thấy hoặc sai mật khẩu -> Từ chối
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cấp Token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_my_profile(current_user: UserDB = Depends(get_current_user)):
    """API trả về thông tin của người dùng đang đăng nhập"""
    return {
        "username": current_user.username,
        "full_name": current_user.full_name or current_user.username, # Nếu chưa có tên hiển thị thì lấy luôn username
        "avatar": current_user.avatar or "👨‍🍳",
        "joined_at": current_user.created_at.strftime("%d/%m/%Y") if current_user.created_at else "N/A"
    }

@router.put("/me/update")
def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Cập nhật tên hiển thị nếu có gửi lên
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name

    # Cập nhật avatar nếu có gửi lên
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

from fastapi import UploadFile, File
import cloudinary.uploader

@router.post("/me/avatar")
def update_avatar_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Xóa ảnh cũ trên Cloudinary nếu nó là link ảnh
        if current_user.avatar and current_user.avatar.startswith("http"):
            try:
                # Lấy public_id từ url (vd: .../image/upload/v123/public_id.jpg)
                public_id = current_user.avatar.split("/")[-1].split(".")[0]
                cloudinary.uploader.destroy(public_id)
            except Exception as e:
                print("Lỗi xóa ảnh cũ:", e)
                
        # Upload image to cloudinary
        upload_result = cloudinary.uploader.upload(file.file)
        image_url = upload_result.get("secure_url")
        
        # Update user avatar
        current_user.avatar = image_url
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Cập nhật ảnh đại diện thành công!", "avatar_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))