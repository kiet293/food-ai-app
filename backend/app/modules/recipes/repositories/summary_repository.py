"""Batch read model for recipe cards, independent of lazy ORM relationships."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.collections.model import CollectionDB, CollectionRecipeDB
from app.modules.recipes.model import CommentDB, FavoriteDB, RatingDB
from app.modules.users.model import FollowDB, UserDB


def load_summary_data(db: Session, recipes: list, current_user=None) -> dict:
    ids = [recipe.id for recipe in recipes]
    if not ids:
        return {}
    author_ids = {r.user_id for r in recipes if r.user_id is not None}
    authors = {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(author_ids)).all()}
    ratings = {row[0]: (float(row[1]), row[2]) for row in db.query(
        RatingDB.recipe_id, func.avg(RatingDB.score), func.count(RatingDB.id),
    ).filter(RatingDB.recipe_id.in_(ids)).group_by(RatingDB.recipe_id).all()}
    def counts(model):
        return dict(db.query(model.recipe_id, func.count(model.id)).filter(
            model.recipe_id.in_(ids),
        ).group_by(model.recipe_id).all())
    favorites = counts(FavoriteDB)
    comments = counts(CommentDB)
    followed, liked, saved = set(), set(), set()
    if current_user is not None:
        followed = {row[0] for row in db.query(FollowDB.following_id).filter(
            FollowDB.follower_id == current_user.id, FollowDB.following_id.in_(author_ids),
        ).all()}
        liked = {row[0] for row in db.query(FavoriteDB.recipe_id).filter(
            FavoriteDB.user_id == current_user.id, FavoriteDB.recipe_id.in_(ids),
        ).all()}
        saved = {row[0] for row in db.query(CollectionRecipeDB.recipe_id).join(
            CollectionDB, CollectionDB.id == CollectionRecipeDB.collection_id,
        ).filter(CollectionDB.user_id == current_user.id, CollectionRecipeDB.recipe_id.in_(ids)).all()}
    return dict(authors=authors, ratings=ratings, favorites=favorites, comments=comments,
                followed=followed, liked=liked, saved=saved)
