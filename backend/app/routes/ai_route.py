from fastapi import APIRouter, UploadFile, File
from app.schemas.recipe import AIAnalysisResult
from app.ai.yolo_service import analyze_food_image

# Khởi tạo Router thay vì dùng app
router = APIRouter()

# API này khi ghép vào main sẽ thành /api/analyze
@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_image(image_file: UploadFile = File(...)):
    print(f"📥 Đang nhận ảnh: {image_file.filename}...")
    
    # Đọc file ảnh
    image_bytes = await image_file.read()

    # Gọi hàm phân tích từ thư mục ai
    ingredients, recipe_name, instructions = analyze_food_image(image_bytes)

    print("📤 Đã phân tích xong, trả kết quả về App!")
    return AIAnalysisResult(
        ingredients=ingredients,
        recipeName=recipe_name,
        instructions=instructions
    )