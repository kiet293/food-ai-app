import os
import json
import google.generativeai as genai
from ultralytics import YOLO
from PIL import Image
import io
from app.schemas.recipe import Ingredient
from app.utils.constants import YOLO_VIETNAMESE_MAP
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
    Đóng vai trò là một Siêu đầu bếp chuyên gia ẩm thực Việt Nam.
    Người dùng vừa cung cấp cho bạn danh sách các nguyên liệu họ đang có: {', '.join(ingredients_list)}.
    
    Nhiệm vụ của bạn:
    1. Gợi ý 1 món ăn Việt Nam ngon nhất, thực tế và dễ nấu nhất từ các nguyên liệu trên.
    2. Bạn được phép giả định trong bếp đã có sẵn các gia vị cơ bản (mắm, muối, tiêu, đường, dầu ăn, hành tỏi, v.v.).
    3. Nếu các nguyên liệu đưa vào hoàn toàn KHÔNG hợp nhau (ví dụ: Thịt bò và Dưa hấu), hãy thông minh chọn ra nhóm nguyên liệu tốt nhất trong số đó để nấu, bỏ qua món không hợp.
    4. Viết hướng dẫn nấu ăn thật sinh động, chi tiết, dễ hiểu cho người mới bắt đầu.
    
    Yêu cầu ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Chỉ trả về chuỗi JSON chuẩn, không giải thích gì thêm):
    {{
        "recipeName": "Tên món ăn hấp dẫn (Ví dụ: Bò lúc lắc, Canh cà chua trứng...)",
        "instructions": [
            "Bước 1: Sơ chế - (Chi tiết cách làm...)",
            "Bước 2: Chế biến - (Chi tiết cách làm...)",
            "Bước 3: Hoàn thiện - (Chi tiết cách làm...)"
        ]
    }}
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

def analyze_food_image(image_bytes: bytes) -> list[Ingredient]:
    """Hàm này nhận ảnh, cho YOLO xem và trả về danh sách nguyên liệu"""
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
                    vietnamese_name = YOLO_VIETNAMESE_MAP.get(class_name, class_name)
                    if vietnamese_name not in detected_items or confidence > detected_items[vietnamese_name]:
                        detected_items[vietnamese_name] = confidence

    # Đóng gói nguyên liệu
    final_ingredients = [Ingredient(name=k, probability=v) for k, v in detected_items.items()]

    return final_ingredients