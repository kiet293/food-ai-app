from fastapi import APIRouter, UploadFile, File, Depends
from typing import List
import httpx
from sqlalchemy.orm import Session

# Import cấu hình và DB
from app.models.database import get_db
from app.crud.recipe_stats import record_recipe_scan

# Import Schemas và Services
from app.schemas.recipe import AIAnalysisResult, RecipeChatRequest, RecipeSearchRequest, RecipeSearchResponse, Ingredient
from app.ai.yolo_service import (
    analyze_food_image, 
    ask_gemini_for_recipe, 
    ask_gemini_for_new_recipe,
    ask_gemini_for_multiple_recipes,
    generate_food_image_url
)

# Khởi tạo Router thay vì dùng app
router = APIRouter(prefix="/ai", tags=["AI Analysis"])

<<<<<<< HEAD
PEXELS_API_KEY = "UPgnazTcU7NR8u5c0lnB2VLGgjRnzivrw5ok58JoKcmYtAtl4MXmzLbW"
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"

async def fetch_food_image_url(query_name: str) -> str:
    """Hàm tự động mang tên món ăn lên Pexels để tìm 1 tấm ảnh đẹp nhất"""
    url = f"https://api.pexels.com/v1/search?query={query_name}&per_page=1"
    headers = {"Authorization": PEXELS_API_KEY}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("photos") and len(data["photos"]) > 0:
                    return data["photos"][0]["src"]["medium"]
    except Exception as e:
        print(f"⚠️ Không thể lấy ảnh từ Pexels do lỗi: {e}")
    
    return DEFAULT_IMAGE

=======
>>>>>>> main
# API này khi ghép vào main sẽ thành /api/analyze
@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_image(image_files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    all_detected_ingredients = []
    unique_names = set() # Dùng set để tránh trùng lặp giữa các ảnh
    
    # Đọc và phân tích TỪNG ảnh một
    for image_file in image_files:
        print(f"📥 Đang xử lý ảnh: {image_file.filename}")
        image_bytes = await image_file.read()

        # Đưa ngay ảnh này cho YOLO phân tích
        ingredients = analyze_food_image(image_bytes)
        
        # Vẫn ở trong vòng lặp của ảnh đó: Nhặt nguyên liệu bỏ vào giỏ tổng
        for ing in ingredients:
            if ing.name not in unique_names:
                unique_names.add(ing.name)
                all_detected_ingredients.append(ing) # Lệnh này nhét nguyên liệu vào giỏ

    # Sau khi quét sạch tất cả ảnh, gom tất cả tên nguyên liệu gửi cho Gemini
    ing_names_for_gemini = [i.name for i in all_detected_ingredients]
    recipe_name, english_name, instructions = ask_gemini_for_recipe(ing_names_for_gemini)

    # Sinh ảnh bằng AI dựa trên tên tiếng Anh
    image_url = generate_food_image_url(english_name)

    # Ghi nhận lượt quét vào CSDL thống kê
    record_recipe_scan(db, recipe_name, all_detected_ingredients, instructions, image_url)

    print(f"📤 Đã phân tích xong món '{recipe_name}', trả kết quả kèm ảnh về App!")
    return AIAnalysisResult(
        ingredients=all_detected_ingredients,
        recipeName=recipe_name,
        instructions=instructions,
        imageUrl=image_url
    )

@router.post("/chat", response_model=AIAnalysisResult)
async def chat_for_new_recipe(request: RecipeChatRequest, db: Session = Depends(get_db)):
    print(f"💬 Nhận yêu cầu đổi món: '{request.user_message}' từ món '{request.current_recipe}'")
    
    # 1. Chuyển thẳng tin nhắn cho Gemini xử lý (Không cần YOLO quét lại ảnh)
    recipe_name, english_name, instructions = ask_gemini_for_new_recipe(
        ingredients_list=request.ingredients,
        current_recipe=request.current_recipe,
        user_message=request.user_message
    )

    # Sinh ảnh bằng AI dựa trên tên tiếng Anh
    image_url = generate_food_image_url(english_name)

    # 2. Đóng gói lại đúng format AIAnalysisResult để trả về App
    # Vì App cần hiển thị danh sách nguyên liệu và % nhận diện (probability),
    # ta sẽ trả lại danh sách tên nguyên liệu cũ với % giả định là 100 để UI không bị vỡ.
    fake_ingredients = [{"name": ing, "probability": 100} for ing in request.ingredients]

    # Ghi nhận lượt quét từ chatbot trợ lý vào CSDL thống kê
    record_recipe_scan(db, recipe_name, fake_ingredients, instructions, image_url)

    print("📤 Đã đổi món xong, trả kết quả về App!")
    return AIAnalysisResult(
        ingredients=fake_ingredients,
        recipeName=recipe_name,
        instructions=instructions,
        imageUrl=image_url
    )


@router.post("/search", response_model=RecipeSearchResponse)
async def search_recipes_by_ingredients(request: RecipeSearchRequest, db: Session = Depends(get_db)):
    print(f"🔎 Nhận yêu cầu tìm kiếm từ nguyên liệu: {request.ingredients}")
    
    # 1. Hỏi Gemini danh sách các món ăn gợi ý
    raw_recipes = ask_gemini_for_multiple_recipes(request.ingredients)
    
    # 2. Xử lý và làm đẹp kết quả (sinh ảnh từ AI, chuẩn hóa nguyên liệu)
    formatted_recipes = []
    for r in raw_recipes:
        recipe_name = r.get("recipeName", "Món ăn từ AI")
        english_name = r.get("englishName", "Delicious Vietnamese food")
        ingredients = r.get("ingredients", [])
        instructions = r.get("instructions", [])
        
        # Sinh ảnh từ AI dựa trên tên tiếng Anh
        image_url = generate_food_image_url(english_name)
        
        # Định dạng nguyên liệu phù hợp với Schema AIAnalysisResult
        formatted_ingredients = [Ingredient(name=name, probability=100) for name in ingredients]
        
        # Ghi nhận lượt gợi ý vào CSDL thống kê
        # (Để các món được gợi ý có thể lọt vào bảng xếp hạng Top món ăn xu hướng)
        record_recipe_scan(db, recipe_name, formatted_ingredients, instructions, image_url)
        
        formatted_recipes.append(
            AIAnalysisResult(
                ingredients=formatted_ingredients,
                recipeName=recipe_name,
                instructions=instructions,
                imageUrl=image_url
            )
        )
        
    print(f"📤 Trả về {len(formatted_recipes)} món ăn gợi ý thành công!")
    return RecipeSearchResponse(recipes=formatted_recipes)