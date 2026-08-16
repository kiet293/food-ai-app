import os
import json
import google.generativeai as genai
from ultralytics import YOLO
from PIL import Image
import io
from app.recipes.schemas import Ingredient
from app.utils.constants import YOLO_VIETNAMESE_MAP
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv(override=True)

# Cấu hình Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-flash-latest')

# Nạp model 1 lần duy nhất khi server khởi động
try:
    # Trỏ đúng đường dẫn tới file bestCT.pt đang nằm ở app/ai/
    model = YOLO("app/ai/bestCT.pt") 
    print("✅ Đã nạp thành công bộ não AI (bestCT.pt)!")
except Exception as e:
    print(f"❌ Lỗi: Không tìm thấy file bestCT.pt. Vui lòng kiểm tra lại! Lỗi: {e}")
    model = None

def ask_gemini_for_recipe(ingredients_list: list) -> tuple[str, str, list[str]]:
    """Gửi nguyên liệu cho Gemini và lấy công thức nấu ăn, kèm theo tên tiếng Anh để vẽ ảnh"""
    if not ingredients_list:
        return "Không tìm thấy nguyên liệu", "", ["Vui lòng chụp ảnh rõ hơn."]

    # Kỹ thuật Prompt Engineering: Ép Gemini trả về JSON chuẩn
    prompt = f"""
    Đóng vai trò là một Siêu đầu bếp chuyên gia ẩm thực Việt Nam.
    Người dùng vừa cung cấp cho bạn danh sách các nguyên liệu họ đang có: {', '.join(ingredients_list)}.
    
    Nhiệm vụ của bạn:
    1. Gợi ý 1 món ăn Việt Nam ngon nhất, thực tế và dễ nấu nhất từ các nguyên liệu trên.
    2. Dịch/Mô tả tên món ăn này sang tiếng Anh một cách chi tiết và chính xác (ví dụ: "Thịt kho tàu" -> "Vietnamese caramelized pork belly with eggs", "Phở bò" -> "Vietnamese beef noodle soup") để làm prompt vẽ ảnh cho AI.
    3. Bạn được phép giả định trong bếp đã có sẵn các gia vị cơ bản (mắm, muối, tiêu, đường, dầu ăn, hành tỏi, v.v.).
    4. Nếu các nguyên liệu đưa vào hoàn toàn KHÔNG hợp nhau (ví dụ: Thịt bò và Dưa hấu), hãy thông minh chọn ra nhóm nguyên liệu tốt nhất trong số đó để nấu, bỏ qua món không hợp.
    5. Viết hướng dẫn nấu ăn thật sinh động, chi tiết, dễ hiểu cho người mới bắt đầu.
    
    Yêu cầu ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Chỉ trả về chuỗi JSON chuẩn, không giải thích gì thêm):
    {{
        "recipeName": "Tên món ăn hấp dẫn bằng tiếng Việt (Ví dụ: Bò lúc lắc, Canh cà chua trứng...)",
        "englishName": "Tên hoặc mô tả ngắn món ăn bằng tiếng Anh (Ví dụ: Stir-fried diced beef, Tomato egg drop soup...)",
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
        
        return (
            data.get("recipeName", "Món ăn ngon từ AI"),
            data.get("englishName", "Delicious Vietnamese food"),
            data.get("instructions", [])
        )
        
    except Exception as e:
        print(f"❌ Lỗi gọi Gemini: {e}")
        return "Lỗi gợi ý món ăn", "", ["Không thể kết nối với bộ não Gemini lúc này."]

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
                
                if confidence > 60:
                    vietnamese_name = YOLO_VIETNAMESE_MAP.get(class_name, class_name)
                    if vietnamese_name not in detected_items or confidence > detected_items[vietnamese_name]:
                        detected_items[vietnamese_name] = confidence

    # Đóng gói nguyên liệu
    final_ingredients = [Ingredient(name=k, probability=v) for k, v in detected_items.items()]

    return final_ingredients

def ask_gemini_for_new_recipe(ingredients_list: list[str], current_recipe: str, user_message: str) -> tuple[str, str, list[str]]:
    """Gửi yêu cầu đổi món ăn của người dùng cho Gemini"""
    
    prompt = f"""
    Bạn là một siêu đầu bếp. Khách hàng đang có các nguyên liệu: {', '.join(ingredients_list)}.
    Bạn vừa gợi ý món "{current_recipe}" nhưng khách hàng phản hồi: "{user_message}".
    
    Hãy gợi ý NGAY một món ăn mới cực kỳ phù hợp với yêu cầu trên.
    Trả về kết quả duy nhất dưới dạng JSON nguyên khối (không kèm chữ giải thích bên ngoài) theo cấu trúc:
    {{
        "recipeName": "Tên món ăn mới bằng tiếng Việt",
        "englishName": "Tên hoặc mô tả ngắn món ăn mới bằng tiếng Anh (ví dụ: Vietnamese caramel pork)",
        "instructions": ["Bước 1...", "Bước 2...", "Bước 3..."]
    }}
    Lưu ý: Chỉ trả về JSON, các trường recipeName và instructions bằng tiếng Việt, englishName bằng tiếng Anh.
    """

    try:
        # Sử dụng JSON mode của Gemini để ép kiểu trả về
        response = gemini_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Vì đã có JSON mode, response.text chắc chắn là một JSON string hợp lệ
        data = json.loads(response.text)
        
        return (
            data.get("recipeName", "Món ăn từ AI"),
            data.get("englishName", "Delicious Vietnamese food"),
            data.get("instructions", [])
        )
    except Exception as e:
        print(f"❌ Lỗi gọi Gemini Chat: {e}")
        return "Lỗi gợi ý món ăn", "", ["Không thể kết nối với bộ não Gemini lúc này."]


def ask_gemini_for_multiple_recipes(ingredients_list: list[str]) -> list[dict]:
    """Gửi nguyên liệu cho Gemini và lấy danh sách nhiều công thức gợi ý"""
    if not ingredients_list:
        return []

    prompt = f"""
    Đóng vai trò là một Siêu đầu bếp chuyên gia ẩm thực Việt Nam.
    Người dùng chưa đi chợ hoặc muốn nấu ăn từ danh sách các nguyên liệu sau: {', '.join(ingredients_list)}.
    
    Nhiệm vụ của bạn:
    1. Gợi ý 3 món ăn khác nhau (có thể là món canh, món xào, món kho, v.v.) có thể nấu từ một số hoặc tất cả các nguyên liệu trên.
    2. Bạn được phép giả định trong bếp đã có sẵn các gia vị cơ bản (mắm, muối, tiêu, đường, dầu ăn, hành tỏi, v.v.).
    3. Các món ăn nên thực tế, ngon miệng và phổ biến trong mâm cơm Việt Nam.
    4. Đối với mỗi món ăn, hãy chỉ rõ các nguyên liệu cần thiết (bao gồm cả nguyên liệu từ danh sách trên và một số nguyên liệu phụ phổ biến khác nếu cần) và hướng dẫn nấu chi tiết.
    
    Yêu cầu ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Chỉ trả về chuỗi JSON chuẩn chứa danh sách các món ăn, không giải thích gì thêm):
    {{
        "recipes": [
            {{
                "recipeName": "Tên món ăn 1 (Ví dụ: Canh cà chua trứng)",
                "englishName": "Tên hoặc mô tả ngắn món ăn 1 bằng tiếng Anh (Ví dụ: Tomato egg drop soup)",
                "ingredients": ["cà chua", "trứng", "hành lá"],
                "instructions": [
                    "Bước 1: Sơ chế...",
                    "Bước 2: Nấu canh...",
                    "Bước 3: Hoàn thiện..."
                ]
            }},
            {{
                "recipeName": "Tên món ăn 2 (Ví dụ: Trứng đúc thịt)",
                "englishName": "Tên hoặc mô tả ngắn món ăn 2 bằng tiếng Anh (Ví dụ: Steamed egg with minced pork)",
                "ingredients": ["trứng", "thịt heo băm", "hành khô"],
                "instructions": [
                    "Bước 1: Sơ chế...",
                    "Bước 2: Chiên trứng...",
                    "Bước 3: Hoàn thiện..."
                ]
            }},
            {{
                "recipeName": "Tên món ăn 3...",
                "englishName": "Tên hoặc mô tả ngắn món ăn 3 bằng tiếng Anh",
                "ingredients": [],
                "instructions": []
            }}
        ]
    }}
    """

    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text)
        return data.get("recipes", [])
    except Exception as e:
        print(f"❌ Lỗi gọi Gemini gợi ý nhiều món: {e}")
        return []

def generate_food_image_url(english_name: str) -> str:
    """Tìm kiếm ảnh thực tế trên Pexels dựa trên tên tiếng Anh của món ăn"""
    import urllib.parse
    import httpx
    
    clean_name = english_name.strip() if english_name else "Vietnamese food"
    pexels_key = os.getenv("PEXELS_API_KEY")
    
    if not pexels_key:
        print("⚠️ Cảnh báo: Chưa cấu hình PEXELS_API_KEY trong .env. Sử dụng ảnh mặc định.")
        return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800"
        
    try:
        encoded_query = urllib.parse.quote(clean_name)
        url = f"https://api.pexels.com/v1/search?query={encoded_query}&per_page=1"
        headers = {"Authorization": pexels_key}
        
        response = httpx.get(url, headers=headers, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            photos = data.get("photos", [])
            if photos:
                return photos[0].get("src", {}).get("large", "")
        print(f"⚠️ Pexels không tìm thấy ảnh cho: '{clean_name}'. Sử dụng ảnh mặc định.")
    except Exception as e:
        print(f"❌ Lỗi khi tìm kiếm ảnh trên Pexels: {e}")
        
    return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800"
