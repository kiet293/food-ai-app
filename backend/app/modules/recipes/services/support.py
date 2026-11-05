import re
import unicodedata
from app.integrations.cloudinary import upload_asset, delete_image_url
from sqlalchemy.orm import Session
from fastapi import UploadFile, status
from typing import Optional

from app.modules.recipes.model import RecipeDB
from app.core.exceptions import CustomException
from app.modules.users.model import UserDB


class RecipeSupport:
    @staticmethod
    def slugify(text: str) -> str:
        text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', '', text).strip().lower()
        return re.sub(r'[-\s]+', '-', text)


    @staticmethod
    def upload_image_to_cloudinary(image: UploadFile) -> str:
        try:
            upload_result = upload_asset(image.file)
            image_url = upload_result.get("secure_url")
            if not image_url:
                raise RuntimeError("Upload provider returned no image URL")
            return image_url
        except Exception as e:
            print(f"❌ Lỗi khi upload ảnh lên Cloudinary: {e}")
            raise CustomException(
                message=f"Không thể upload ảnh: {str(e)}",
                code="IMAGE_UPLOAD_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def delete_image_from_cloudinary(image_url: str):
        delete_image_url(image_url)


    @staticmethod
    def format_recipe_summary(recipe: RecipeDB, current_user: Optional[UserDB] = None):
        from .presenter import format_recipe_summaries
        db = Session.object_session(recipe)
        if db is None:
            raise ValueError("Recipe must be attached to a database session")
        return format_recipe_summaries(db, [recipe], current_user)[0]
