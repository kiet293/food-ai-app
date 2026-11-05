from sqlalchemy.orm import Session, selectinload

from app.modules.recipes.model import RecipeDB, CommentDB


class RecipeRepository:
    """Database access shared by recipe use cases."""

    @staticmethod
    def get_by_id(db: Session, recipe_id: int) -> RecipeDB | None:
        return db.query(RecipeDB).options(
            selectinload(RecipeDB.comments).joinedload(CommentDB.user),
        ).filter(RecipeDB.id == recipe_id).first()

    @staticmethod
    def add(db: Session, recipe: RecipeDB) -> RecipeDB:
        db.add(recipe)
        return recipe
