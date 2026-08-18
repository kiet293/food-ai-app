import urllib.parse

from app.core.config import get_settings


FALLBACK_IMAGE_URL = (
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800"
)


def generate_food_image_url(english_name: str) -> str:
    import httpx

    clean_name = english_name.strip() if english_name else "Vietnamese food"
    api_key = get_settings().pexels_api_key
    if not api_key:
        return FALLBACK_IMAGE_URL

    try:
        query = urllib.parse.quote(clean_name)
        response = httpx.get(
            f"https://api.pexels.com/v1/search?query={query}&per_page=1",
            headers={"Authorization": api_key},
            timeout=5.0,
        )
        response.raise_for_status()
        photos = response.json().get("photos", [])
        if photos:
            return photos[0].get("src", {}).get("large", FALLBACK_IMAGE_URL)
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Lỗi khi tìm ảnh Pexels cho '{clean_name}': {exc}")

    return FALLBACK_IMAGE_URL
