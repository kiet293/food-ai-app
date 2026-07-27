import asyncio
import logging
from sqlalchemy import text
from app.models.database import SessionLocal

logger = logging.getLogger(__name__)

async def calculate_trending_scores():
    db = SessionLocal()
    try:
        # Base Score = (Tổng số sao rating) + (Số Lượt Lưu * 3) + (Số Tim * 1)
        # Note: Tổng số sao rating có trọng số cao nhất so với chỉ đếm lượt.
        # Trending Score = Base Score / ((Tuổi của bài đăng theo giờ) + 2)^1.5
        update_query = text("""
            UPDATE recipes
            SET trending_score = (
                COALESCE((SELECT SUM(score) FROM ratings WHERE recipe_id = recipes.id), 0) * 1.5 +
                COALESCE((SELECT COUNT(*) FROM favorites WHERE recipe_id = recipes.id), 0) * 1.0 +
                COALESCE((SELECT COUNT(*) FROM collection_recipes WHERE recipe_id = recipes.id), 0) * 3.0
            ) / POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600.0 + 2, 1.5)
        """)
        db.execute(update_query)
        db.commit()
        logger.info("Successfully updated trending_score for all recipes.")
    except Exception as e:
        logger.error(f"Failed to update trending_score: {e}")
        db.rollback()
    finally:
        db.close()

async def trending_scheduler_task():
    while True:
        # Chạy ngay khi task được bắt đầu (Khởi động Server hoặc đến kỳ)
        await calculate_trending_scores()
        
        # Đợi 1 tiếng (3600 giây) rồi lặp lại
        await asyncio.sleep(3600)
