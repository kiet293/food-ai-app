from sqlalchemy.orm import Session
from app.models.recipe_model import RecipeStatsDB

def record_recipe_scan(db: Session, recipe_name: str, ingredients: list, instructions: list, image_url: str):
    try:
        clean_name = recipe_name.strip()
        
        # Chuẩn hóa danh sách nguyên liệu thành list dict dạng JSON
        ingredients_list = []
        for ing in ingredients:
            if isinstance(ing, dict):
                ingredients_list.append({"name": ing.get("name", ""), "probability": ing.get("probability", 100)})
            else:
                ingredients_list.append({"name": ing.name, "probability": ing.probability})

        stats = db.query(RecipeStatsDB).filter(RecipeStatsDB.recipe_name == clean_name).first()
        if stats:
            stats.scan_count += 1
            if image_url:
                stats.image_url = image_url
            stats.ingredients = ingredients_list
            stats.instructions = instructions
        else:
            stats = RecipeStatsDB(
                recipe_name=clean_name,
                scan_count=1,
                save_count=0,
                ingredients=ingredients_list,
                instructions=instructions,
                image_url=image_url
            )
            db.add(stats)
        db.commit()
        print(f"📊 Đã ghi nhận 1 lượt quét cho món: {clean_name} (scan_count={stats.scan_count})")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Lỗi khi cập nhật lượt quét món ăn '{recipe_name}': {e}")


def record_recipe_save(db: Session, recipe_name: str, ingredients: list, instructions: list, image_url: str):
    """Ghi nhận hoặc tăng lượt lưu (save_count) của món ăn vào CSDL"""
    try:
        clean_name = recipe_name.strip()
        
        # 1. BẮT BUỘC: Chuẩn hóa danh sách nguyên liệu thành list dict JSON giống như hàm scan
        ingredients_list = []
        for ing in ingredients:
            if isinstance(ing, dict):
                ingredients_list.append({
                    "name": ing.get("name", ""), 
                    "probability": ing.get("probability", 100)
                })
            else:
                ingredients_list.append({
                    "name": ing.name, 
                    "probability": ing.probability
                })

        # 2. Truy vấn tìm món ăn cũ
        stats = db.query(RecipeStatsDB).filter(RecipeStatsDB.recipe_name == clean_name).first()
        
        if stats:
            # Nếu món ăn đã có, chỉ cần tăng lượt lưu và đồng bộ lại data mới nhất
            stats.save_count += 1
            if image_url:
                stats.image_url = image_url
            stats.ingredients = ingredients_list
            stats.instructions = instructions
        else:
            # Fallback: Nếu món ăn chưa từng được quét, tạo mới hoàn toàn
            stats = RecipeStatsDB(
                recipe_name=clean_name,
                scan_count=1,  
                save_count=1,
                ingredients=ingredients_list,
                instructions=instructions,
                image_url=image_url
            )
            db.add(stats)
            
        db.commit()
        print(f"📊 Đã ghi nhận 1 lượt lưu cho món: {clean_name} (save_count={stats.save_count})")
        return True
    except Exception as e:
        db.rollback()
        print(f"⚠️ Lỗi khi cập nhật lượt lưu món ăn '{recipe_name}': {e}")
        return False

