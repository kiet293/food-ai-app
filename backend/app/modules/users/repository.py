from sqlalchemy.orm import Session

from app.modules.users.model import UserDB


class UserRepository:
    """Database access for users; transaction boundaries stay in services."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> UserDB | None:
        return db.query(UserDB).filter(UserDB.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> UserDB | None:
        return db.query(UserDB).filter(UserDB.username == username).first()

    @staticmethod
    def add(db: Session, user: UserDB) -> UserDB:
        db.add(user)
        return user
