from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.recipe_model import RecipeDB
from app.schemas.recipe import AIAnalysisResult # Tái sử dụng schema cũ để làm hợp đồng nhận dữ liệu

router = APIRouter()

@router.post("/save")
def save_recipe(recipe_data: AIAnalysisResult, db: Session = Depends(get_db)):
    try:
        # Chuyển đổi dữ liệu JSON từ App gửi lên thành Object của Database
        # Mẹo: Chuyển mảng objects nguyên liệu thành list dict để lưu JSON
        ingredients_list = [{"name": i.name, "probability": i.probability} for i in recipe_data.ingredients]

        new_recipe = RecipeDB(
            user_id=1, # Hardcode user 1
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