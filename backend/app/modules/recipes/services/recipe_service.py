"""Compatibility facade; new callers should import focused services."""
from .write_service import RecipeWriteService
from .support import RecipeSupport
from .stats_service import RecipeStatsService
from .catalog_service import RecipeCatalogService
from .comment_service import RecipeCommentService
from .interaction_service import RecipeInteractionService
from .tag_service import RecipeTagService


class RecipeService(RecipeWriteService, RecipeSupport, RecipeStatsService, RecipeCatalogService, RecipeCommentService, RecipeInteractionService, RecipeTagService):
    pass
