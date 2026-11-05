"""Run one scheduler process: python -m app.workers."""
import asyncio
import argparse
import logging

from app.core.config import get_settings
from app.workers.trending import trending_scheduler_task


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Food AI background jobs")
    parser.add_argument("job", nargs="?", default="trending", choices=["trending", "sync-pexels"])
    args = parser.parse_args()
    if args.job == "trending":
        asyncio.run(trending_scheduler_task(get_settings().trending_interval_seconds))
    else:
        # Register all ORM relationships before running a standalone domain job.
        import app.modules.collections.model
        import app.modules.notifications.model
        import app.modules.recipes.model
        import app.modules.reels.model
        import app.modules.users.model
        from app.db.session import SessionLocal
        from app.modules.reels.pexels_service import PexelsService
        with SessionLocal() as db:
            PexelsService.sync_pexels_cooking_videos(db)
