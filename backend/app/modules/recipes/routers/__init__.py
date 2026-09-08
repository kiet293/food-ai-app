"""Compose the focused recipe routers."""

from fastapi import APIRouter

from .catalog import router as catalog_router
from .comments import recipe_router as recipe_comments_router
from .comments import router as comments_router
from .interactions import router as interactions_router
from .tags import router as tags_router


router = APIRouter()
router.routes.extend(catalog_router.routes)
router.routes.extend(recipe_comments_router.routes)
router.routes.extend(interactions_router.routes)

comment_router = APIRouter()
comment_router.routes.extend(comments_router.routes)
comment_router.routes.extend(tags_router.routes)

__all__ = ["comment_router", "router"]
