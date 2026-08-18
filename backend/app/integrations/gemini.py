import json
from functools import lru_cache

from app.core.config import get_settings


@lru_cache
def _get_model():
    import google.generativeai as genai

    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY chưa được cấu hình")
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-flash-latest")


def _generate_json(prompt: str) -> dict:
    response = _get_model().generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def ask_gemini_for_recipe(ingredients_list: list) -> tuple[str, str, list[str]]:
    if not ingredients_list:
        return "Không tìm thấy nguyên liệu", "", ["Vui lòng chụp ảnh rõ hơn."]

    prompt = f"""
    Đóng vai trò là một Siêu đầu bếp chuyên gia ẩm thực Việt Nam.
    Người dùng vừa cung cấp cho bạn danh sách các nguyên liệu họ đang có: {', '.join(ingredients_list)}.

    Nhiệm vụ của bạn:
    1. Gợi ý 1 món ăn Việt Nam ngon nhất, thực tế và dễ nấu nhất từ các nguyên liệu trên.
    2. Dịch hoặc mô tả tên món sang tiếng Anh chính xác để dùng khi tìm ảnh.
    3. Có thể giả định trong bếp đã có sẵn các gia vị cơ bản.
    4. Nếu nguyên liệu không hợp nhau, chọn nhóm nguyên liệu phù hợp nhất.
    5. Viết hướng dẫn chi tiết, sinh động và dễ hiểu cho người mới bắt đầu.

    Chỉ trả về JSON theo đúng cấu trúc:
    {{
      "recipeName": "Tên món bằng tiếng Việt",
      "englishName": "Tên hoặc mô tả món bằng tiếng Anh",
      "instructions": ["Bước 1...", "Bước 2...", "Bước 3..."]
    }}
    """
    try:
        data = _generate_json(prompt)
        return (
            data.get("recipeName", "Món ăn ngon từ AI"),
            data.get("englishName", "Delicious Vietnamese food"),
            data.get("instructions", []),
        )
    except Exception as exc:
        print(f"Lỗi gọi Gemini: {exc}")
        return "Lỗi gợi ý món ăn", "", ["Không thể kết nối với bộ não Gemini lúc này."]


def ask_gemini_for_new_recipe(
    ingredients_list: list[str], current_recipe: str, user_message: str
) -> tuple[str, str, list[str]]:
    prompt = f"""
    Bạn là một siêu đầu bếp. Khách hàng đang có các nguyên liệu: {', '.join(ingredients_list)}.
    Bạn vừa gợi ý món "{current_recipe}" nhưng khách hàng phản hồi: "{user_message}".

    Hãy gợi ý ngay một món ăn mới phù hợp với yêu cầu trên.
    Chỉ trả về JSON theo đúng cấu trúc:
    {{
      "recipeName": "Tên món mới bằng tiếng Việt",
      "englishName": "Tên hoặc mô tả món bằng tiếng Anh",
      "instructions": ["Bước 1...", "Bước 2...", "Bước 3..."]
    }}
    """
    try:
        data = _generate_json(prompt)
        return (
            data.get("recipeName", "Món ăn từ AI"),
            data.get("englishName", "Delicious Vietnamese food"),
            data.get("instructions", []),
        )
    except Exception as exc:
        print(f"Lỗi gọi Gemini Chat: {exc}")
        return "Lỗi gợi ý món ăn", "", ["Không thể kết nối với bộ não Gemini lúc này."]


def ask_gemini_for_multiple_recipes(ingredients_list: list[str]) -> list[dict]:
    if not ingredients_list:
        return []

    prompt = f"""
    Đóng vai trò là một Siêu đầu bếp chuyên gia ẩm thực Việt Nam.
    Người dùng muốn nấu ăn từ danh sách nguyên liệu: {', '.join(ingredients_list)}.

    Hãy gợi ý 3 món ăn khác nhau, thực tế và phổ biến trong mâm cơm Việt Nam.
    Có thể giả định đã có gia vị cơ bản và bổ sung nguyên liệu phụ phổ biến.
    Với mỗi món, chỉ rõ nguyên liệu cần thiết và hướng dẫn nấu chi tiết.
    Chỉ trả về JSON theo đúng cấu trúc:
    {{
      "recipes": [
        {{
          "recipeName": "Tên món bằng tiếng Việt",
          "englishName": "Tên món bằng tiếng Anh",
          "ingredients": ["nguyên liệu"],
          "instructions": ["Bước 1...", "Bước 2...", "Bước 3..."]
        }}
      ]
    }}
    """
    try:
        return _generate_json(prompt).get("recipes", [])
    except Exception as exc:
        print(f"Lỗi gọi Gemini gợi ý nhiều món: {exc}")
        return []
