import os
import sys

# Thêm thư mục hiện tại vào Python Path để nhận diện app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import SessionLocal, Base, engine
from app.models.user_model import UserDB
from app.models.recipe_model import RecipeDB
from app.models.reel_model import ReelDB, ReelLikeDB, ReelCommentDB

def seed_data():
    db = SessionLocal()
    try:
        print("[SEED] Bat dau nap du lieu Reels vao Database...")

        # 1. Kiem tra/Tao User thu nghiem
        user = db.query(UserDB).filter(UserDB.username == "chef_scott").first()
        if not user:
            print("[SEED] Tao user thu nghiem 'chef_scott'...")
            user = UserDB(
                username="chef_scott",
                hashed_password="no_password_needed_for_test", # password_hash ao
                full_name="Chef Scott & Amber",
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                is_admin=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"[SEED] User '{user.username}' da ton tai.")

        # 2. Kiem tra/Tao cac cong thuc lien ket nau an thu nghiem
        recipes = [
            {"name": "Mi Y Sot Pho Mai Kem Tuoi", "ingredients": ["200g Mi Y Penne", "100g Pho Mai Cheddar", "150ml Kem tuoi"], "instructions": ["Luoc mi", "Dun sot kem pho mai", "Tron mi va dung nong"]},
            {"name": "Bit Tet Bo Ap Chao Bo Toi", "ingredients": ["300g Than ngoai bo", "Bo lat", "Toi, huong thao"], "instructions": ["Tham kho thit", "Ap chao 2 phut", "Ruoi bo toi va thai lat"]},
            {"name": "Banh Souffle Socola Tan Chay", "ingredients": ["100g Socola den", "2 qua trung", "30g duong"], "instructions": ["Dun chay socola", "Danh bong trung", "Nuong 180 do 12 phut"]}
        ]

        recipe_ids = []
        for r_data in recipes:
            recipe = db.query(RecipeDB).filter(RecipeDB.recipe_name == r_data["name"]).first()
            if not recipe:
                print(f"[SEED] Tao cong thuc '{r_data['name']}'...")
                recipe = RecipeDB(
                    user_id=user.id,
                    recipe_name=r_data["name"],
                    ingredients=r_data["ingredients"],
                    instructions=r_data["instructions"],
                    image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
                )
                db.add(recipe)
                db.commit()
                db.refresh(recipe)
            recipe_ids.append(recipe.id)

        # 3. Tao Reels mau lien ket voi cac cong thuc vua tao
        reels_data = [
            {
                "caption": "Bí quyết làm sốt Phô Mai tan chảy siêu béo ngậy cho món Pasta ngon ngất ngây! 🍝 #Cheesy #Pasta #FoodHack",
                "video_url": "https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-sauce-on-meat-42284-large.mp4",
                "recipe_id": recipe_ids[0]
            },
            {
                "caption": "Cách cắt thái rau củ chuẩn đầu bếp chuyên nghiệp chi tiết trong 5 phút! 🔪 #SteakLover #CookingTips",
                "video_url": "https://assets.mixkit.co/videos/preview/mixkit-chef-cutting-vegetables-in-a-kitchen-40503-large.mp4",
                "recipe_id": recipe_ids[1]
            },
            {
                "caption": "Bánh Pizza phô mai nóng hổi tan chảy thơm lừng cuốn hút 🍕 #PizzaTime #FoodPorn",
                "video_url": "https://assets.mixkit.co/videos/preview/mixkit-tasty-freshly-baked-pizza-being-sliced-42289-large.mp4",
                "recipe_id": recipe_ids[2]
            }
        ]

        # Xoa cac Reels cu de lam sach du lieu
        db.query(ReelCommentDB).delete()
        db.query(ReelLikeDB).delete()
        db.query(ReelDB).delete()
        db.commit()

        for idx, reel in enumerate(reels_data):
            print(f"[SEED] Them Reel #{idx+1} vao database...")
            new_reel = ReelDB(
                user_id=user.id,
                video_url=reel["video_url"],
                poster_url="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                caption=reel["caption"],
                recipe_id=reel["recipe_id"]
            )
            db.add(new_reel)
            db.commit()
            db.refresh(new_reel)

            # Them thu vai binh luan ao cho clip them sinh dong
            comment_1 = ReelCommentDB(
                reel_id=new_reel.id,
                user_id=user.id,
                content="Mon nay trong hap dan qua ad oi! Nhat dinh se thu vao cuoi tuan"
            )
            comment_2 = ReelCommentDB(
                reel_id=new_reel.id,
                user_id=user.id,
                content="Luu lai cong thuc gap! Cam on cong thuc cua dau bep rat nhieu"
            )
            db.add(comment_1)
            db.add(comment_2)
            db.commit()

            # Them 1 Like ao
            like = ReelLikeDB(
                reel_id=new_reel.id,
                user_id=user.id
            )
            db.add(like)
            db.commit()

        print("[SEED] Da hoan thanh nap du lieu mau Reels thanh cong!")
    except Exception as e:
        print(f"[SEED] Loi khi seed du lieu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
