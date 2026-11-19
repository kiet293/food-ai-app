from app.modules.recipes.repositories.summary_repository import load_summary_data


def format_recipe_summaries(db, recipes, current_user=None):
    data = load_summary_data(db, recipes, current_user)
    result = []
    for recipe in recipes:
        author = data['authors'].get(recipe.user_id)
        author_info = None
        if author:
            author_info = {
                'id': author.id, 'name': author.full_name or author.username,
                'handle': f'@{author.username}', 'avatar': author.avatar,
                'is_following': author.id in data['followed'],
                'is_self': current_user is not None and current_user.id == author.id,
            }
        average, count = data['ratings'].get(recipe.id, (0, 0))
        result.append({
            'id': recipe.id, 'title': recipe.recipe_name, 'description': recipe.description,
            'image': recipe.image_url, 'cook_time_minutes': recipe.cook_time_minutes,
            'difficulty': recipe.difficulty, 'author': author_info,
            'ratings_avg': round(average, 1), 'ratings_count': count,
            'comments_count': data['comments'].get(recipe.id, 0),
            'favorites_count': data['favorites'].get(recipe.id, 0),
            'is_favorited': recipe.id in data['liked'],
            'is_in_collection': recipe.id in data['saved'], 'cooked_count': 0,
            'created_at': recipe.created_at.isoformat() if recipe.created_at else None,
        })
    return result
