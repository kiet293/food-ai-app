from .recipe_service import RecipeService


class RecipeCommentService:
    """Recipe comment use cases."""

    add_recipe_comment = RecipeService.add_recipe_comment
    update_recipe_comment = RecipeService.update_recipe_comment
    delete_recipe_comment = RecipeService.delete_recipe_comment
