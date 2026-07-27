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

from app.models.user_model import UserDB, FollowDB
from app.models.reel_model import ReelDB, ReelLikeDB, ReelCommentDB
from app.models.recipe_model import FavoriteDB

@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """API trả về đầy đủ thông tin cá nhân & chỉ số thống kê chuẩn TikTok"""
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
                "viewsCount": (r.id * 137) % 900 + 120
            })

        # 4. Lấy danh sách Reels người dùng đã bấm thích
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
                "viewsCount": (r.id * 89) % 800 + 95
            })

        # 5. Đếm số công thức đã lưu
        saved_recipes_count = db.query(FavoriteDB).filter(FavoriteDB.user_id == current_user.id).count()

        return {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name or current_user.username,
            "avatar": current_user.avatar or "👨‍🍳",
            "bio": "Yêu bếp & Sáng tạo công thức nấu ăn cùng Food AI 🍳✨",
            "status_badge": "Tám chuyện nào 💬",
            "following_count": following_count,
            "follower_count": follower_count,
            "total_likes_count": total_likes_count,
            "saved_recipes_count": saved_recipes_count,
            "my_reels": my_reels,
            "liked_reels": liked_reels,
            "joined_at": current_user.created_at.strftime("%d/%m/%Y") if current_user.created_at else "N/A"
        }
    except Exception as e:
        print(f"❌ Lỗi khi lấy profile cá nhân: {e}")
        return {
            "username": current_user.username,
            "full_name": current_user.full_name or current_user.username,
            "avatar": current_user.avatar or "👨‍🍳",
            "following_count": 0,
            "follower_count": 0,
            "total_likes_count": 0,
            "my_reels": [],
            "liked_reels": [],
            "saved_recipes_count": 0,
            "joined_at": "N/A"
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