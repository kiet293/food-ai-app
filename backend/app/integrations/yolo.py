import io
from functools import lru_cache
from pathlib import Path

from app.modules.ai.constants import YOLO_VIETNAMESE_MAP
from app.modules.recipes.schemas import Ingredient


MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "modules" / "ai" / "models" / "bestCT.pt"
)


@lru_cache
def _get_model():
    from ultralytics import YOLO

    try:
        model = YOLO(str(MODEL_PATH))
        print("Đã nạp thành công model nhận diện nguyên liệu")
        return model
    except Exception as exc:
        print(f"Không thể nạp model tại {MODEL_PATH}: {exc}")
        return None


def analyze_food_image(image_bytes: bytes) -> list[Ingredient]:
    from PIL import Image

    image = Image.open(io.BytesIO(image_bytes))
    detected_items: dict[str, int] = {}
    model = _get_model()

    if model:
        for result in model(image):
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = int(box.conf[0] * 100)
                class_name = model.names[class_id]
                if confidence <= 60:
                    continue
                name = YOLO_VIETNAMESE_MAP.get(class_name, class_name)
                detected_items[name] = max(confidence, detected_items.get(name, 0))

    return [
        Ingredient(name=name, probability=probability)
        for name, probability in detected_items.items()
    ]
