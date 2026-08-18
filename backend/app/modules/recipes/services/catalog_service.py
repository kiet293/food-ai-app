from .recipe_service import RecipeService


class RecipeCatalogService:
    """Catalog, notebook and feed use cases."""

    get_trending_recipes = RecipeService.get_trending_recipes
    save_recipe_to_notebook = RecipeService.save_recipe_to_notebook
    get_notebook_recipes = RecipeService.get_notebook_recipes
    delete_recipe = RecipeService.delete_recipe
    get_popular_recipes = RecipeService.get_popular_recipes
    create_new_recipe = RecipeService.create_new_recipe
    get_categories_list = RecipeService.get_categories_list
    get_explore_grid = RecipeService.get_explore_grid
    get_explore_feed = RecipeService.get_explore_feed
    get_following_feed = RecipeService.get_following_feed
    get_recipe_detail = RecipeService.get_recipe_detail
    get_recipes_list = RecipeService.get_recipes_list
    update_recipe = RecipeService.update_recipe
