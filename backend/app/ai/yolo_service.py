from ultralytics import YOLO
from PIL import Image
import io
from app.schemas.recipe import Ingredient

# Nạp model 1 lần duy nhất khi server khởi động
try:
    # Trỏ đúng đường dẫn tới file best.pt đang nằm cùng thư mục
    model = YOLO("app/ai/egg_tomato_beff.pt") 
    print("✅ Đã nạp thành công bộ não AI (egg_tomato_beff.pt)!")
except Exception as e:
    print(f"❌ Lỗi: Không tìm thấy file egg_tomato_beff.pt. Vui lòng kiểm tra lại! Lỗi: {e}")
    model = None

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
    ing_names = [i.name.lower() for i in final_ingredients]

    # Thuật toán gợi ý món
    recipe_name = "Món Ăn Bí Ẩn"
    instructions = ["1. Cắt nhỏ các nguyên liệu AI vừa tìm thấy.", "2. Bật bếp và xào nấu theo sở thích!"]

    if "tomato" in ing_names and "egg" in ing_names:
        recipe_name = "Canh Cà Chua Trứng (AI Phân Tích Thật)"
        instructions = [
            "1. Cà chua thái múi cau. Trứng đánh tan.",
            "2. Phi thơm hành tím, xào mềm cà chua.",
            "3. Đổ nước vào đun sôi, từ từ rót trứng vào và khuấy nhẹ.",
            "4. Thêm hành lá, tắt bếp và thưởng thức."
        ]

    return final_ingredients, recipe_name, instructions