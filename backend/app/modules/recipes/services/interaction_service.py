from .recipe_service import RecipeService


class RecipeInteractionService:
    """Rating and favorite use cases."""

    rate_recipe = RecipeService.rate_recipe
    favorite_recipe = RecipeService.favorite_recipe
    unfavorite_recipe = RecipeService.unfavorite_recipe
