"""Atomic counters: concurrent requests cannot overwrite each other's increments."""
import logging
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from app.modules.recipes.model import RecipeStatsDB

logger = logging.getLogger(__name__)


class RecipeStatsService:
    @staticmethod
    def _record(db, recipe_name, ingredients, instructions, image_url, *, saved=False, commit=True):
        values = [item if isinstance(item, dict) else item.model_dump() for item in ingredients]
        insert = sqlite_insert if db.get_bind().dialect.name == "sqlite" else pg_insert
        statement = insert(RecipeStatsDB).values(
            recipe_name=recipe_name.strip(), ingredients=values, instructions=instructions,
            image_url=image_url, scan_count=0 if saved else 1, save_count=1 if saved else 0,
        )
        update = dict(ingredients=statement.excluded.ingredients,
                      instructions=statement.excluded.instructions, updated_at=func.now())
        counter = RecipeStatsDB.save_count if saved else RecipeStatsDB.scan_count
        update["save_count" if saved else "scan_count"] = func.coalesce(counter, 0) + 1
        if image_url:
            update["image_url"] = statement.excluded.image_url
        db.execute(statement.on_conflict_do_update(index_elements=["recipe_name"], set_=update))
        if commit:
            db.commit()
        else:
            db.flush()

    @staticmethod
    def record_recipe_scan(db, recipe_name, ingredients, instructions, image_url):
        try:
            RecipeStatsService._record(db, recipe_name, ingredients, instructions, image_url)
        except Exception:
            db.rollback()
            logger.exception("Failed to record recipe scan")

    @staticmethod
    def record_recipe_save(db, recipe_name, ingredients, instructions, image_url, *, commit=True):
        try:
            RecipeStatsService._record(db, recipe_name, ingredients, instructions, image_url,
                                       saved=True, commit=commit)
            return True
        except Exception:
            if not commit:
                raise
            db.rollback()
            logger.exception("Failed to record recipe save")
            return False

    @staticmethod
    def get_popular_recipes(db):
        return db.query(RecipeStatsDB).order_by(
            RecipeStatsDB.save_count.desc(), RecipeStatsDB.scan_count.desc(), RecipeStatsDB.id.desc(),
        ).limit(10).all()
