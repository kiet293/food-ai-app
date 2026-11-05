from app.core.config import get_settings
import logging
import re
from urllib.parse import urlparse


logger = logging.getLogger(__name__)


def upload_asset(file, **options) -> dict:
    import cloudinary.uploader
    return cloudinary.uploader.upload(file, **options)


def destroy_asset(public_id: str, **options) -> dict:
    import cloudinary.uploader
    return cloudinary.uploader.destroy(public_id, **options)


def delete_image_url(image_url: str | None) -> None:
    """Best-effort cleanup after a successful write or failed upload transaction."""
    if not image_url:
        return
    parsed = urlparse(image_url)
    if parsed.hostname != "res.cloudinary.com" or "/image/upload/" not in parsed.path:
        return
    public_id = parsed.path.split("/image/upload/", 1)[1]
    public_id = re.sub(r"^v\d+/", "", public_id).rsplit(".", 1)[0]
    try:
        destroy_asset(public_id)
    except Exception:
        logger.exception("Failed to clean up uploaded image")


def configure_cloudinary() -> None:
    import cloudinary

    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
