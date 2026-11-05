from sqlalchemy.orm import Session
from fastapi import status
from typing import List

from app.modules.recipes.model import TagDB
from app.core.exceptions import CustomException
from app.modules.recipes.repositories import TagRepository


class RecipeTagService:
    @staticmethod
    def get_hot_tags(db: Session) -> List[TagDB]:
        try:
            hot_tags = TagRepository.get_hot(db, limit=10)
            return hot_tags
        except Exception as e:
            print(f"❌ Lỗi hệ thống khi lấy hot tags: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi lấy danh sách nhãn phổ biến",
                code="GET_HOT_TAGS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
