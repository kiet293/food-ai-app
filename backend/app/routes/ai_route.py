from fastapi import APIRouter, UploadFile, File
from typing import List
from app.schemas.recipe import AIAnalysisResult
from app.ai.yolo_service import analyze_food_image, ask_gemini_for_recipe
from app.schemas.recipe import RecipeChatRequest
from app.ai.yolo_service import ask_gemini_for_new_recipe

# Khởi tạo Router thay vì dùng app
router = APIRouter()

# API này khi ghép vào main sẽ thành /api/analyze
@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_image(image_files: List[UploadFile] = File(...)):
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
    recipe_name, instructions = ask_gemini_for_recipe(ing_names_for_gemini)

    print("📤 Đã phân tích xong, trả kết quả về App!")
    return AIAnalysisResult(
        ingredients=all_detected_ingredients,
        recipeName=recipe_name,
        instructions=instructions
    )

@router.post("/chat", response_model=AIAnalysisResult)
async def chat_for_new_recipe(request: RecipeChatRequest):
    print(f"💬 Nhận yêu cầu đổi món: '{request.user_message}' từ món '{request.current_recipe}'")
    
    # 1. Chuyển thẳng tin nhắn cho Gemini xử lý (Không cần YOLO quét lại ảnh)
    recipe_name, instructions = ask_gemini_for_new_recipe(
        ingredients_list=request.ingredients,
        current_recipe=request.current_recipe,
        user_message=request.user_message
    )

    # 2. Đóng gói lại đúng format AIAnalysisResult để trả về App
    # Vì App cần hiển thị danh sách nguyên liệu và % nhận diện (probability),
    # ta sẽ trả lại danh sách tên nguyên liệu cũ với % giả định là 100 để UI không bị vỡ.
    fake_ingredients = [{"name": ing, "probability": 100} for ing in request.ingredients]

    print("📤 Đã đổi món xong, trả kết quả về App!")
    return AIAnalysisResult(
        ingredients=fake_ingredients,
        recipeName=recipe_name,
        instructions=instructions
    )