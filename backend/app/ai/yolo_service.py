import os
import json
import google.generativeai as genai
from ultralytics import YOLO
from PIL import Image
import io
from app.schemas.recipe import Ingredient
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

# Cấu hình Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-flash-latest')

# Nạp model 1 lần duy nhất khi server khởi động
try:
    # Trỏ đúng đường dẫn tới file best.pt đang nằm cùng thư mục
    model = YOLO("app/ai/egg_tomato_beff.pt") 
    print("✅ Đã nạp thành công bộ não AI (egg_tomato_beff.pt)!")
except Exception as e:
    print(f"❌ Lỗi: Không tìm thấy file egg_tomato_beff.pt. Vui lòng kiểm tra lại! Lỗi: {e}")
    model = None

def ask_gemini_for_recipe(ingredients_list: list) -> tuple[str, list[str]]:
    """Gửi nguyên liệu cho Gemini và lấy công thức nấu ăn"""
    if not ingredients_list:
        return "Không tìm thấy nguyên liệu", ["Vui lòng chụp ảnh rõ hơn."]

    # Kỹ thuật Prompt Engineering: Ép Gemini trả về JSON chuẩn
    prompt = f"""
    Tôi có các nguyên liệu sau: {', '.join(ingredients_list)}.
    Hãy gợi ý 1 món ăn Việt Nam phổ biến có thể nấu từ các nguyên liệu này.
    Trả về cấu trúc JSON sau:
    {{
        "recipeName": "Tên món ăn",
        "instructions": ["Bước 1...", "Bước 2...", "Bước 3..."]
    }}
    Lưu ý: Ngôn ngữ bằng tiếng Việt.
    """
    try:
        # Sử dụng JSON mode của Gemini để ép kiểu trả về
        response = gemini_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Vì đã có JSON mode, response.text chắc chắn là một JSON string hợp lệ
        data = json.loads(response.text)
        
        return data.get("recipeName", "Món ăn ngon từ AI"), data.get("instructions", [])
        
    except Exception as e:
        print(f"❌ Lỗi gọi Gemini: {e}")
        return "Lỗi gợi ý món ăn", ["Không thể kết nối với bộ não Gemini lúc này."]

def analyze_food_image(image_bytes: bytes) -> tuple[list[Ingredient], str, list[str]]:
    """Hàm này nhận ảnh, cho AI xem và trả về kết quả"""
    img = Image.open(io.BytesIO(image_bytes))
    detected_items = {}

    if model:
        results = model(img)
        for r in results:
            boxes = r.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = int(box.conf[0] * 100)
                class_name = model.names[class_id]
                
                if confidence > 50:
                    if class_name not in detected_items or confidence > detected_items[class_name]:
                        detected_items[class_name] = confidence

    # Đóng gói nguyên liệu
    final_ingredients = [Ingredient(name=k, probability=v) for k, v in detected_items.items()]
    ing_names = [i.name for i in final_ingredients]

    # Gợi ý món ăn từ Gemini
    recipe_name, instructions = ask_gemini_for_recipe(ing_names)

    return final_ingredients, recipe_name, instructions