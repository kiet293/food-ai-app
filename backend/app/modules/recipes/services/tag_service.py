from .recipe_service import RecipeService


class RecipeTagService:
    """Recipe tag use cases."""

    get_hot_tags = RecipeService.get_hot_tags
