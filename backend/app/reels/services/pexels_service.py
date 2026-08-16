import os
import ssl
import json
import urllib.request
from sqlalchemy.orm import Session
from app.reels.models import ReelDB, ReelLikeDB, ReelCommentDB
from app.users.models import UserDB

class PexelsService:
    @staticmethod
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
                avatars = [
                    "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150",
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
                ]

                # Việt hóa tên ngẫu nhiên
                vietnamese_names_unicode = [
                    "Minh Anh", "Gia Khánh", "Hồng Hạnh", "Tuấn Kiệt", "Bảo Châu", 
                    "Hữu Phước", "Thanh Vân", "Quốc Anh", "Nhật Linh", "Phương Trinh",
                    "Thành Nam", "Xuân Trường", "Trọng Hiếu", "Thu Trang", "Bích Ngọc",
                    "Đình Phong", "Khánh Hà", "Thế Đạt", "Hoài An", "Cẩm Tú"
                ]
                vietnamese_last_names_unicode = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô"]

                for v in videos:
                    # 1. Tìm link video phù hợp (dọc)
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

                    # Kiểm tra xem video đã có trong database chưa
                    exists = db.query(ReelDB).filter(ReelDB.video_url == video_url).first()
                    if exists:
                        continue

                    # 2. Tự động đăng ký và Việt hóa tài khoản tác giả
                    photographer_id = v.get("user", {}).get("id")
                    if not photographer_id:
                        continue

                    username = f"pexels_user_{photographer_id}"
                    author = db.query(UserDB).filter(UserDB.username == username).first()
                    if not author:
                        last_idx = photographer_id % len(vietnamese_last_names_unicode)
                        first_idx = (photographer_id * 3) % len(vietnamese_names_unicode)
                        title = "Đầu bếp " if photographer_id % 2 == 0 else "Chef "
                        
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

                    # 3. Tạo và lưu Reels mới vào PostgreSQL
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
                    
                    # Thêm tương tác thích & bình luận ảo ban đầu
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
