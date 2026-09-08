from fastapi import FastAPI

from app.modules.ai.router import router as ai_router
from app.modules.collections.router import router as collection_router
from app.modules.notifications.router import router as notification_router
from app.modules.recipes.routers.catalog import router as recipe_catalog_router
from app.modules.recipes.routers.comments import recipe_router as recipe_comments_router
from app.modules.recipes.routers.comments import router as comments_router
from app.modules.recipes.routers.interactions import router as recipe_interactions_router
from app.modules.recipes.routers.tags import router as tags_router
from app.modules.reels.router import router as reel_router
from app.modules.search.router import router as search_router
from app.modules.users.auth_router import router as router_auth
from app.modules.users.router import router as router_user


def register_api_routers(app: FastAPI) -> None:
    app.include_router(router_auth, prefix="/api/auth", tags=["Authentication"])
    app.include_router(ai_router, prefix="/api", tags=["AI Analysis"])
    app.include_router(
        recipe_catalog_router,
        prefix="/api/recipes",
        tags=["Recipe Management"],
    )
    app.include_router(
        recipe_comments_router,
        prefix="/api/recipes",
        tags=["Recipe Management"],
    )
    app.include_router(
        recipe_interactions_router,
        prefix="/api/recipes",
        tags=["Recipe Management"],
    )
    app.include_router(comments_router, prefix="/api")
    app.include_router(tags_router, prefix="/api")
    app.include_router(search_router, prefix="/api/search", tags=["Search API"])
    app.include_router(reel_router, prefix="/api/reels", tags=["Reels Management"])
    app.include_router(router_user, prefix="/api/users", tags=["User Management"])
    app.include_router(
        collection_router,
        prefix="/api/collections",
        tags=["Collection Management"],
    )
    app.include_router(notification_router)


__all__ = ["register_api_routers"]
