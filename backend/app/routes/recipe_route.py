from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import json
import os
import shutil
import uuid
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB, RecipeStatsDB
from app.schemas.recipe import AIAnalysisResult # Tái sử dụng schema cũ để làm hợp đồng nhận dữ liệu
from app.models.user_model import UserDB
from app.utils.deps import get_current_user
from app.crud.recipe_stats import record_recipe_save
from app.utils.response import success_response, CustomException

# Khai báo tags chung cho toàn bộ API trong file này
router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])

# API LƯU CÔNG THỨC VÀO SỔ TAY
@router.post("/save")
def save_recipe(recipe_data: AIAnalysisResult, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    # Kiểm tra xem món ăn đã tồn tại chưa
    existing_recipe = db.query(RecipeDB).filter(
        RecipeDB.user_id == current_user.id,
        RecipeDB.recipe_name == recipe_data.recipeName
    ).first()
    
    # Nếu tìm thấy món ăn với tên y hệt
    if existing_recipe:
        # Chặn ngay từ cửa, ném thẳng lỗi 400 về cho điện thoại
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Công thức này đã tồn tại trong Sổ tay của bạn!"
        )
    
    # Nếu chưa có, tiến hành lưu
    try:
        # Chuyển đổi dữ liệu JSON từ App gửi lên thành Object của Database
        ingredients_list = [{"name": i.name, "probability": i.probability} for i in recipe_data.ingredients]

        new_recipe = RecipeDB(
            user_id=current_user.id,
            recipe_name=recipe_data.recipeName,
            ingredients=ingredients_list,
            instructions=recipe_data.instructions,
            image_url=recipe_data.imageUrl
        )

        # Lưu vào Database
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe) # Lấy ID vừa được tạo ra

        # Ghi nhận lượt lưu (Thích) vào bảng thống kê phổ biến
        record_recipe_save(
            db=db, 
            recipe_name=recipe_data.recipeName, 
            ingredients=ingredients_list, 
            instructions=recipe_data.instructions, 
            image_url=recipe_data.imageUrl
        )

        print(f"💾 Đã lưu thành công món: {new_recipe.recipe_name}")
        return {"message": "Lưu công thức thành công!", "recipe_id": new_recipe.id}

    except Exception as e:
        db.rollback() # Nếu lỗi thì hoàn tác, không làm hỏng Database
        print(f"❌ Lỗi khi lưu DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể lưu vào CSDL"
        )

# api lấy danh sách công thức nấu ăn từ database
@router.get("/list")
def get_all_recipes(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        # Lấy tất cả các món, sắp xếp mới nhất xuống dưới cùng (tăng dần)
        recipes = db.query(RecipeDB).filter(RecipeDB.user_id == current_user.id).order_by(RecipeDB.id.desc()).all()
        
        print(f"📖 Đã xuất kho {len(recipes)} công thức cho Sổ tay!")
        # Trả về đúng định dạng mảng (Array) mà App đã khai báo (data.map)
        return recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách Sổ tay: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể tải danh sách công thức"
        )

# api xóa công thức nấu ăn khỏi database
@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        # tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id, RecipeDB.user_id == current_user.id).first()
        # nếu không tìm thấy công thức
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Không tìm thấy công thức"
            )
        # xóa công thức
        db.delete(recipe)
        # commit để lưu thay đổi
        db.commit()
        
        print(f"🗑️ Đã xóa công thức: {recipe.recipe_name}")
        return {"message": "Đã xóa công thức thành công"}
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi xóa công thức: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể xóa công thức"
        )

# api lấy danh sách 10 món ăn phổ biến nhất hệ thống
@router.get("/popular")
def get_popular_recipes(db: Session = Depends(get_db)):
    try:
        # Lấy 10 món ăn có lượt lưu cao nhất, ưu tiên scan_count nếu trùng save_count
        popular_recipes = db.query(RecipeStatsDB).order_by(
            RecipeStatsDB.save_count.desc(),
            RecipeStatsDB.scan_count.desc()
        ).limit(10).all()
        
        print(f"🔥 Đã xuất kho {len(popular_recipes)} món ăn phổ biến cho Xu hướng!")
        return popular_recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách xu hướng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể tải danh sách món ăn xu hướng"
        )

# API ĐĂNG TẢI CÔNG THỨC MỚI (US-06)
@router.post("/")
def create_recipe(
    recipe_name: str = Form(...),
    description: str = Form(None),
    ingredients: str = Form(...), # Sẽ nhận mảng dạng chuỗi JSON
    instructions: str = Form(...), # Sẽ nhận mảng dạng chuỗi JSON
    cook_time_minutes: int = Form(None),
    servings: int = Form(None),
    difficulty: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Parse JSON từ form data
        try:
            parsed_ingredients = json.loads(ingredients)
            parsed_instructions = json.loads(instructions)
        except json.JSONDecodeError as e:
            print(f"❌ Lỗi khi parse JSON: {e}")
            raise CustomException(
                message="Dữ liệu ingredients hoặc instructions không đúng định dạng JSON",
                code="INVALID_JSON_FORMAT",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Xử lý upload ảnh với Cloudinary
        image_url = None
        if image:
            try:
                # Cloudinary uploader nhận file-like object
                upload_result = cloudinary.uploader.upload(image.file)
                image_url = upload_result.get("secure_url")
                print(f"📸 Đã lưu ảnh lên Cloudinary thành công: {image_url}")
            except Exception as e:
                print(f"❌ Lỗi khi upload ảnh lên Cloudinary: {e}")
                raise CustomException(
                    message=f"Không thể upload ảnh: {str(e)}",
                    code="IMAGE_UPLOAD_ERROR",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Tạo mới record
        try:
            new_recipe = RecipeDB(
                user_id=current_user.id,
                recipe_name=recipe_name,
                description=description,
                ingredients=parsed_ingredients,
                instructions=parsed_instructions,
                cook_time_minutes=cook_time_minutes,
                servings=servings,
                difficulty=difficulty,
                image_url=image_url
            )

            db.add(new_recipe)
            db.commit()
            db.refresh(new_recipe)
            
            print(f"✅ Đã tạo công thức mới: {new_recipe.recipe_name}")
            return success_response(data={"recipe_id": new_recipe.id}, message="Đăng tải công thức thành công!")
        except Exception as e:
            db.rollback()
            import traceback
            traceback.print_exc()
            print(f"❌ Lỗi DATABASE khi insert công thức: {e}")
            raise CustomException(
                message=f"Lỗi Database: {str(e)}",
                code="DB_INSERT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except CustomException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống: {e}")
        raise CustomException(
            message="Không thể tạo công thức mới",
            code="CREATE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API LẤY CHI TIẾT CÔNG THỨC NẤU ĂN
@router.get("/{recipe_id}")
def get_recipe_details(recipe_id: int, db: Session = Depends(get_db)):
    try:
        # Tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Định dạng thông tin tác giả
        author_info = None
        if recipe.author:
            author_info = {
                "id": recipe.author.id,
                "name": recipe.author.full_name or recipe.author.username,
                "avatar": recipe.author.avatar
            }
            
        # Tính toán điểm đánh giá
        ratings_list = [{"id": r.id, "score": r.score, "user_id": r.user_id} for r in recipe.ratings] if recipe.ratings else []
        ratings_avg = sum(r["score"] for r in ratings_list) / len(ratings_list) if len(ratings_list) > 0 else 0
        
        # Format danh sách bình luận
        comments_list = []
        if recipe.comments:
            for c in recipe.comments:
                user_info = None
                if c.user:
                    user_info = {
                        "id": c.user.id,
                        "name": c.user.full_name or c.user.username,
                        "avatar": c.user.avatar
                    }
                comments_list.append({
                    "id": c.id,
                    "content": c.content,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "user": user_info
                })
        
        # Trả về format chuẩn API
        data = {
            "id": recipe.id,
            "title": recipe.recipe_name,
            "description": recipe.description,
            "image": recipe.image_url,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
            "cook_time_minutes": recipe.cook_time_minutes,
            "servings": recipe.servings,
            "difficulty": recipe.difficulty,
            "author": author_info,
            "ratings_avg": round(ratings_avg, 1),
            "ratings_count": len(ratings_list),
            "comments": comments_list
        }
        
        return success_response(data=data, message="Lấy thông tin chi tiết công thức thành công")
        
    except CustomException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi khi lấy chi tiết công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tải chi tiết công thức",
            code="GET_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
