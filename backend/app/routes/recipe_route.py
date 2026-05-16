from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB
from app.schemas.recipe import AIAnalysisResult # Tái sử dụng schema cũ để làm hợp đồng nhận dữ liệu
from app.models.user_model import UserDB
from app.utils.deps import get_current_user

router = APIRouter()

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
        raise HTTPException(status_code=400, detail="Công thức này đã tồn tại trong Sổ tay của bạn!")
    
    # Nếu chưa có, tiến hành lưu
    try:
        # Chuyển đổi dữ liệu JSON từ App gửi lên thành Object của Database
        ingredients_list = [{"name": i.name, "probability": i.probability} for i in recipe_data.ingredients]

        new_recipe = RecipeDB(
            user_id=current_user.id,
            recipe_name=recipe_data.recipeName,
            ingredients=ingredients_list,
            instructions=recipe_data.instructions
        )

        # Lưu vào Database
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe) # Lấy ID vừa được tạo ra

        print(f"💾 Đã lưu thành công món: {new_recipe.recipe_name}")
        return {"message": "Lưu công thức thành công!", "recipe_id": new_recipe.id}

    except Exception as e:
        db.rollback() # Nếu lỗi thì hoàn tác, không làm hỏng Database
        print(f"❌ Lỗi khi lưu DB: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu vào CSDL")

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
        raise HTTPException(status_code=500, detail="Không thể tải danh sách công thức")

# api xóa công thức nấu ăn khỏi database
@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        # tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id, RecipeDB.user_id == current_user.id).first()
        # nếu không tìm thấy công thức
        if not recipe:
            raise HTTPException(status_code=404, detail="Không tìm thấy công thức")
        # xóa công thức
        db.delete(recipe)
        # commit để lưu thay đổi
        db.commit()
        
        print(f"🗑️ Đã xóa công thức: {recipe.recipe_name}")
        return {"message": "Đã xóa công thức thành công"}
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi xóa công thức: {e}")
        raise HTTPException(status_code=500, detail="Không thể xóa công thức")

