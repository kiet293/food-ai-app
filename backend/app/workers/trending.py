import asyncio
import logging

from sqlalchemy import text

from app.db import SessionLocal


logger = logging.getLogger(__name__)


def calculate_trending_scores() -> None:
    """Recalculate scores in a short-lived, worker-owned transaction."""
    db = SessionLocal()
    try:
        # Prevent overlapping updates even if multiple scheduler processes start.
        if not db.execute(text("SELECT pg_try_advisory_xact_lock(194721031)")).scalar():
            return
        db.execute(
            text(
                """
                UPDATE recipes
                SET trending_score = (
                    COALESCE((SELECT SUM(score) FROM ratings WHERE recipe_id = recipes.id), 0) * 1.5 +
                    COALESCE((SELECT COUNT(*) FROM favorites WHERE recipe_id = recipes.id), 0) * 1.0 +
                    COALESCE((SELECT COUNT(*) FROM collection_recipes WHERE recipe_id = recipes.id), 0) * 3.0
                ) / POWER(
                    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 + 2,
                    1.5
                )
                """
            )
        )
        db.commit()
        logger.info("Successfully updated trending scores")
    except Exception:
        db.rollback()
        logger.exception("Failed to update trending scores")
    finally:
        db.close()


async def trending_scheduler_task(interval_seconds: int = 3600) -> None:
    while True:
        await asyncio.to_thread(calculate_trending_scores)
        await asyncio.sleep(interval_seconds)
