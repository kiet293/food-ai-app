import io
from functools import lru_cache
from pathlib import Path
from threading import Lock

from app.modules.ai.constants import YOLO_VIETNAMESE_MAP
from app.core.config import get_settings
from app.core.exceptions import CustomException


MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "modules" / "ai" / "models" / "egg_tomato_beff.pt"
)
_inference_lock = Lock()


@lru_cache
def _get_model():
    model_path = Path(get_settings().yolo_model_path).expanduser() if get_settings().yolo_model_path else MODEL_PATH
    if not model_path.is_file():
        raise CustomException("Model nhận diện chưa được cấu hình", "AI_MODEL_UNAVAILABLE", 503)
    try:
        from ultralytics import YOLO
        model = YOLO(str(model_path))
        print("Đã nạp thành công model nhận diện nguyên liệu")
        return model
    except Exception as exc:
        print(f"Không thể nạp model tại {MODEL_PATH}: {exc}")
        raise CustomException("Không thể tải model nhận diện", "AI_MODEL_UNAVAILABLE", 503) from exc


def analyze_food_image(image_bytes: bytes) -> list[dict]:
    from PIL import Image

    detected_items: dict[str, int] = {}
    with Image.open(io.BytesIO(image_bytes)) as source:
        image = source.convert("RGB")
    try:
        # The cached YOLO predictor has mutable state; serialize shared inference.
        with _inference_lock:
            model = _get_model()
            results = model(image)
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = int(box.conf[0] * 100)
                class_name = model.names[class_id]
                if confidence <= 60:
                    continue
                name = YOLO_VIETNAMESE_MAP.get(class_name, class_name)
                detected_items[name] = max(confidence, detected_items.get(name, 0))
    finally:
        image.close()

    return [
        {"name": name, "probability": probability}
        for name, probability in detected_items.items()
    ]
