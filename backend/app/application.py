import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.modules.collections.model  # noqa: F401
import app.modules.notifications.model  # noqa: F401
import app.modules.recipes.model  # noqa: F401
import app.modules.reels.model  # noqa: F401
import app.modules.users.model  # noqa: F401
from app.api.exception_handlers import register_exception_handlers
from app.api.router import register_api_routers
from app.core.config import get_settings
from app.db import Base, engine
from app.integrations import configure_cloudinary
from app.workers import trending_scheduler_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.auto_create_schema:
        if settings.is_production:
            raise RuntimeError("AUTO_CREATE_SCHEMA must be disabled in production")
        Base.metadata.create_all(bind=engine)
    configure_cloudinary()
    trending_task = (
        asyncio.create_task(trending_scheduler_task(settings.trending_interval_seconds))
        if settings.run_scheduler else None
    )
    app.state.trending_task = trending_task
    try:
        yield
    finally:
        if trending_task is not None:
            trending_task.cancel()
            with suppress(asyncio.CancelledError):
                await trending_task
        engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    origins = list(settings.cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials="*" not in origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_api_routers(app)
    register_exception_handlers(app)

    @app.get("/")
    def read_root():
        return {"message": "Server đang chạy cùng Database PostgreSQL!"}

    return app
