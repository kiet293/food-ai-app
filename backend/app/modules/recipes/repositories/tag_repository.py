from sqlalchemy.orm import Session

from app.modules.recipes.model import TagDB


class TagRepository:
    @staticmethod
    def get_hot(db: Session, limit: int = 10) -> list[TagDB]:
        return db.query(TagDB).order_by(TagDB.usage_count.desc()).limit(limit).all()
