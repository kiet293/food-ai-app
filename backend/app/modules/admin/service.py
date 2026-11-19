from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import CustomException
from app.integrations.cloudinary import delete_image_url
from app.modules.collections.model import CollectionDB, CollectionRecipeDB
from app.modules.notifications.model import NotificationDB, NotificationSettingsDB
from app.modules.recipes.model import (
    CategoryDB,
    CommentDB,
    FavoriteDB,
    RatingDB,
    RecipeCategoryDB,
    RecipeDB,
    RecipeStatsDB,
    RecipeTagDB,
    TagDB,
)
from app.modules.recipes.services.support import RecipeSupport
from app.modules.reels.model import ReelCommentDB, ReelCommentLikeDB, ReelDB, ReelLikeDB
from app.modules.reels.pexels_service import PexelsService
from app.modules.users.model import FollowDB, UserDB
from app.workers.trending import calculate_trending_scores

from .schema import (
    AdminCategoryCreate,
    AdminCategoryUpdate,
    AdminRecipeUpdate,
    AdminTagUpdate,
    AdminUserUpdate,
)


def _pagination(page: int, limit: int, total: int) -> dict:
    total_pages = ceil(total / limit) if total > 0 else 0
    return {
        "current_page": page,
        "limit": limit,
        "total_items": total,
        "total_pages": total_pages,
    }


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _delete_recipe_comments(db: Session, comment_ids: list[int]) -> None:
    if not comment_ids:
        return
    # Collect descendants iteratively to satisfy non-cascading self-FK.
    all_ids = set(comment_ids)
    frontier = list(comment_ids)
    while frontier:
        children = [
            row[0]
            for row in db.query(CommentDB.id)
            .filter(CommentDB.parent_comment_id.in_(frontier))
            .all()
        ]
        new_children = [cid for cid in children if cid not in all_ids]
        all_ids.update(new_children)
        frontier = new_children

    db.query(CommentDB).filter(CommentDB.id.in_(all_ids)).update(
        {CommentDB.parent_comment_id: None}, synchronize_session=False
    )
    db.query(CommentDB).filter(CommentDB.id.in_(all_ids)).delete(
        synchronize_session=False
    )


def _delete_reel_comments(db: Session, comment_ids: list[int]) -> None:
    if not comment_ids:
        return
    all_ids = set(comment_ids)
    frontier = list(comment_ids)
    while frontier:
        children = [
            row[0]
            for row in db.query(ReelCommentDB.id)
            .filter(ReelCommentDB.parent_comment_id.in_(frontier))
            .all()
        ]
        new_children = [cid for cid in children if cid not in all_ids]
        all_ids.update(new_children)
        frontier = new_children

    db.query(ReelCommentLikeDB).filter(
        ReelCommentLikeDB.comment_id.in_(all_ids)
    ).delete(synchronize_session=False)
    db.query(ReelCommentDB).filter(ReelCommentDB.id.in_(all_ids)).update(
        {ReelCommentDB.parent_comment_id: None}, synchronize_session=False
    )
    db.query(ReelCommentDB).filter(ReelCommentDB.id.in_(all_ids)).delete(
        synchronize_session=False
    )


def _delete_recipe_in_session(db: Session, recipe: RecipeDB) -> Optional[str]:
    image_url = recipe.image_url
    recipe_id = recipe.id

    db.query(ReelDB).filter(ReelDB.recipe_id == recipe_id).update(
        {ReelDB.recipe_id: None}, synchronize_session=False
    )

    touched_tag_ids = [
        row[0]
        for row in db.query(RecipeTagDB.tag_id)
        .filter(RecipeTagDB.recipe_id == recipe_id)
        .all()
    ]
    db.query(RecipeTagDB).filter(RecipeTagDB.recipe_id == recipe_id).delete(
        synchronize_session=False
    )
    db.query(RecipeCategoryDB).filter(RecipeCategoryDB.recipe_id == recipe_id).delete(
        synchronize_session=False
    )
    db.query(CollectionRecipeDB).filter(
        CollectionRecipeDB.recipe_id == recipe_id
    ).delete(synchronize_session=False)
    db.query(FavoriteDB).filter(FavoriteDB.recipe_id == recipe_id).delete(
        synchronize_session=False
    )
    db.query(RatingDB).filter(RatingDB.recipe_id == recipe_id).delete(
        synchronize_session=False
    )

    comment_ids = [
        row[0]
        for row in db.query(CommentDB.id).filter(CommentDB.recipe_id == recipe_id).all()
    ]
    _delete_recipe_comments(db, comment_ids)

    db.delete(recipe)
    db.flush()

    for tag_id in touched_tag_ids:
        new_count = (
            db.query(func.count())
            .select_from(RecipeTagDB)
            .filter(RecipeTagDB.tag_id == tag_id)
            .scalar()
        )
        db.query(TagDB).filter(TagDB.id == tag_id).update(
            {TagDB.usage_count: new_count or 0}, synchronize_session=False
        )

    return image_url


def _delete_reel_in_session(db: Session, reel: ReelDB) -> None:
    reel_id = reel.id
    comment_ids = [
        row[0]
        for row in db.query(ReelCommentDB.id)
        .filter(ReelCommentDB.reel_id == reel_id)
        .all()
    ]
    _delete_reel_comments(db, comment_ids)
    db.query(ReelLikeDB).filter(ReelLikeDB.reel_id == reel_id).delete(
        synchronize_session=False
    )
    db.delete(reel)


class AdminService:
    # ------------------------------------------------------------------
    # DASHBOARD
    # ------------------------------------------------------------------
    @staticmethod
    def get_dashboard_overview(db: Session, days: int = 14) -> dict:
        days = max(7, min(90, days))
        total_users = db.query(func.count(UserDB.id)).scalar() or 0
        total_admins = (
            db.query(func.count(UserDB.id)).filter(UserDB.is_admin == True).scalar() or 0
        )
        total_recipes = db.query(func.count(RecipeDB.id)).scalar() or 0
        ai_recipes = (
            db.query(func.count(RecipeDB.id)).filter(RecipeDB.is_ai == True).scalar()
            or 0
        )
        community_recipes = total_recipes - ai_recipes
        total_reels = db.query(func.count(ReelDB.id)).scalar() or 0
        total_reel_views = db.query(func.coalesce(func.sum(ReelDB.view_count), 0)).scalar() or 0
        total_recipe_comments = db.query(func.count(CommentDB.id)).scalar() or 0
        total_reel_comments = db.query(func.count(ReelCommentDB.id)).scalar() or 0
        total_ratings = db.query(func.count(RatingDB.id)).scalar() or 0
        total_categories = db.query(func.count(CategoryDB.id)).scalar() or 0
        total_tags = db.query(func.count(TagDB.id)).scalar() or 0
        total_ai_scans = (
            db.query(func.coalesce(func.sum(RecipeStatsDB.scan_count), 0)).scalar() or 0
        )
        total_ai_saves = (
            db.query(func.coalesce(func.sum(RecipeStatsDB.save_count), 0)).scalar() or 0
        )

        # Build daily growth series in a DB-agnostic way (works on PostgreSQL & SQLite)
        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=days - 1)
        cutoff = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

        user_buckets = {
            (start_date + timedelta(days=i)).isoformat(): 0 for i in range(days)
        }
        recipe_buckets = dict(user_buckets)
        reel_buckets = dict(user_buckets)

        for (created_at,) in (
            db.query(UserDB.created_at).filter(UserDB.created_at >= cutoff).all()
        ):
            if created_at:
                key = created_at.date().isoformat()
                if key in user_buckets:
                    user_buckets[key] += 1

        for (created_at,) in (
            db.query(RecipeDB.created_at).filter(RecipeDB.created_at >= cutoff).all()
        ):
            if created_at:
                key = created_at.date().isoformat()
                if key in recipe_buckets:
                    recipe_buckets[key] += 1

        for (created_at,) in (
            db.query(ReelDB.created_at).filter(ReelDB.created_at >= cutoff).all()
        ):
            if created_at:
                key = created_at.date().isoformat()
                if key in reel_buckets:
                    reel_buckets[key] += 1

        growth_series = [
            {
                "date": date_key,
                "users": user_buckets[date_key],
                "recipes": recipe_buckets[date_key],
                "reels": reel_buckets[date_key],
            }
            for date_key in sorted(user_buckets.keys())
        ]

        # Top trending recipes
        top_trending_rows = (
            db.query(RecipeDB)
            .filter(RecipeDB.is_ai == False)
            .order_by(RecipeDB.trending_score.desc(), RecipeDB.id.desc())
            .limit(5)
            .all()
        )
        author_ids = {r.user_id for r in top_trending_rows if r.user_id is not None}
        authors = (
            {
                u.id: u
                for u in db.query(UserDB).filter(UserDB.id.in_(author_ids)).all()
            }
            if author_ids
            else {}
        )
        top_trending = [
            {
                "id": r.id,
                "recipe_name": r.recipe_name,
                "image_url": r.image_url,
                "trending_score": round(float(r.trending_score or 0.0), 2),
                "author_name": (
                    (authors[r.user_id].full_name or authors[r.user_id].username)
                    if r.user_id in authors
                    else "Ẩn danh"
                ),
            }
            for r in top_trending_rows
        ]

        # Top AI scanned dishes
        top_ai_rows = (
            db.query(RecipeStatsDB)
            .order_by(RecipeStatsDB.scan_count.desc(), RecipeStatsDB.save_count.desc())
            .limit(5)
            .all()
        )
        top_ai_dishes = [
            {
                "id": s.id,
                "recipe_name": s.recipe_name,
                "scan_count": s.scan_count or 0,
                "save_count": s.save_count or 0,
                "image_url": s.image_url,
            }
            for s in top_ai_rows
        ]

        return {
            "summary": {
                "total_users": total_users,
                "total_admins": total_admins,
                "total_recipes": total_recipes,
                "community_recipes": community_recipes,
                "ai_recipes": ai_recipes,
                "total_reels": total_reels,
                "total_reel_views": int(total_reel_views),
                "total_comments": total_recipe_comments + total_reel_comments,
                "total_ratings": total_ratings,
                "total_categories": total_categories,
                "total_tags": total_tags,
                "total_ai_scans": int(total_ai_scans),
                "total_ai_saves": int(total_ai_saves),
            },
            "growth_series": growth_series,
            "top_trending": top_trending,
            "top_ai_dishes": top_ai_dishes,
        }

    # ------------------------------------------------------------------
    # USERS
    # ------------------------------------------------------------------
    @staticmethod
    def list_users(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        is_admin: Optional[bool] = None,
    ) -> dict:
        query = db.query(UserDB)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    UserDB.username.ilike(pattern),
                    UserDB.full_name.ilike(pattern),
                )
            )
        if is_admin is not None:
            query = query.filter(UserDB.is_admin == is_admin)

        total = query.count()
        users = (
            query.order_by(UserDB.created_at.desc(), UserDB.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        user_ids = [u.id for u in users]
        recipe_counts = (
            dict(
                db.query(RecipeDB.user_id, func.count(RecipeDB.id))
                .filter(RecipeDB.user_id.in_(user_ids))
                .group_by(RecipeDB.user_id)
                .all()
            )
            if user_ids
            else {}
        )
        reel_counts = (
            dict(
                db.query(ReelDB.user_id, func.count(ReelDB.id))
                .filter(ReelDB.user_id.in_(user_ids))
                .group_by(ReelDB.user_id)
                .all()
            )
            if user_ids
            else {}
        )

        items = [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name or "",
                "avatar": u.avatar,
                "bio": u.bio or "",
                "is_admin": bool(u.is_admin),
                "follower_count": u.follower_count or 0,
                "recipes_count": recipe_counts.get(u.id, 0),
                "reels_count": reel_counts.get(u.id, 0),
                "created_at": _iso(u.created_at),
            }
            for u in users
        ]
        return {"items": items, "pagination": _pagination(page, limit, total)}

    @staticmethod
    def update_user(
        db: Session, user_id: int, data: AdminUserUpdate, current_admin: UserDB
    ) -> dict:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise CustomException("Không tìm thấy người dùng", "USER_NOT_FOUND", 404)

        if (
            data.is_admin is False
            and user.id == current_admin.id
        ):
            raise CustomException(
                "Không thể tự thu hồi quyền quản trị của chính bạn",
                "CANNOT_DEMOTE_SELF",
                400,
            )

        if data.full_name is not None:
            user.full_name = data.full_name.strip()
        if data.bio is not None:
            user.bio = data.bio.strip()
        if data.is_admin is not None:
            user.is_admin = data.is_admin

        db.commit()
        db.refresh(user)
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name or "",
            "avatar": user.avatar,
            "bio": user.bio or "",
            "is_admin": bool(user.is_admin),
            "follower_count": user.follower_count or 0,
            "created_at": _iso(user.created_at),
        }

    @staticmethod
    def delete_user(db: Session, user_id: int, current_admin: UserDB) -> dict:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise CustomException("Không tìm thấy người dùng", "USER_NOT_FOUND", 404)
        if user.id == current_admin.id:
            raise CustomException(
                "Không thể tự xóa tài khoản quản trị đang đăng nhập",
                "CANNOT_DELETE_SELF",
                400,
            )

        images_to_cleanup: list[str] = []
        if user.avatar:
            images_to_cleanup.append(user.avatar)

        try:
            # 1. Delete user's recipes and collect images
            user_recipes = db.query(RecipeDB).filter(RecipeDB.user_id == user_id).all()
            for recipe in user_recipes:
                img = _delete_recipe_in_session(db, recipe)
                if img:
                    images_to_cleanup.append(img)

            # 2. Delete user's reels
            user_reels = db.query(ReelDB).filter(ReelDB.user_id == user_id).all()
            for reel in user_reels:
                _delete_reel_in_session(db, reel)

            # 3. Delete user's comments & interactions on other content
            user_comment_ids = [
                row[0]
                for row in db.query(CommentDB.id)
                .filter(CommentDB.user_id == user_id)
                .all()
            ]
            _delete_recipe_comments(db, user_comment_ids)

            user_reel_comment_ids = [
                row[0]
                for row in db.query(ReelCommentDB.id)
                .filter(ReelCommentDB.user_id == user_id)
                .all()
            ]
            _delete_reel_comments(db, user_reel_comment_ids)

            db.query(ReelCommentLikeDB).filter(
                ReelCommentLikeDB.user_id == user_id
            ).delete(synchronize_session=False)
            db.query(ReelLikeDB).filter(ReelLikeDB.user_id == user_id).delete(
                synchronize_session=False
            )
            db.query(FavoriteDB).filter(FavoriteDB.user_id == user_id).delete(
                synchronize_session=False
            )
            db.query(RatingDB).filter(RatingDB.user_id == user_id).delete(
                synchronize_session=False
            )

            # 4. Delete collections, follows, notifications
            collection_ids = [
                row[0]
                for row in db.query(CollectionDB.id)
                .filter(CollectionDB.user_id == user_id)
                .all()
            ]
            if collection_ids:
                db.query(CollectionRecipeDB).filter(
                    CollectionRecipeDB.collection_id.in_(collection_ids)
                ).delete(synchronize_session=False)
                db.query(CollectionDB).filter(
                    CollectionDB.id.in_(collection_ids)
                ).delete(synchronize_session=False)

            db.query(FollowDB).filter(
                or_(
                    FollowDB.follower_id == user_id,
                    FollowDB.following_id == user_id,
                )
            ).delete(synchronize_session=False)
            db.query(NotificationDB).filter(
                or_(
                    NotificationDB.user_id == user_id,
                    NotificationDB.actor_id == user_id,
                )
            ).delete(synchronize_session=False)
            db.query(NotificationSettingsDB).filter(
                NotificationSettingsDB.user_id == user_id
            ).delete(synchronize_session=False)

            db.delete(user)
            db.commit()
        except Exception as exc:
            db.rollback()
            if isinstance(exc, CustomException):
                raise
            raise CustomException(
                f"Không thể xóa người dùng: {exc}", "DELETE_USER_ERROR", 500
            ) from exc

        for url in images_to_cleanup:
            delete_image_url(url)

        return {"deleted_user_id": user_id}

    # ------------------------------------------------------------------
    # RECIPES
    # ------------------------------------------------------------------
    @staticmethod
    def list_recipes(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        is_ai: Optional[bool] = None,
        difficulty: Optional[str] = None,
    ) -> dict:
        query = db.query(RecipeDB)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    RecipeDB.recipe_name.ilike(pattern),
                    RecipeDB.description.ilike(pattern),
                )
            )
        if is_ai is not None:
            query = query.filter(RecipeDB.is_ai == is_ai)
        if difficulty:
            query = query.filter(RecipeDB.difficulty == difficulty)

        total = query.count()
        recipes = (
            query.order_by(RecipeDB.created_at.desc(), RecipeDB.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        recipe_ids = [r.id for r in recipes]
        author_ids = {r.user_id for r in recipes if r.user_id is not None}

        authors = (
            {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(author_ids)).all()}
            if author_ids
            else {}
        )
        favorites = (
            dict(
                db.query(FavoriteDB.recipe_id, func.count(FavoriteDB.id))
                .filter(FavoriteDB.recipe_id.in_(recipe_ids))
                .group_by(FavoriteDB.recipe_id)
                .all()
            )
            if recipe_ids
            else {}
        )
        comments = (
            dict(
                db.query(CommentDB.recipe_id, func.count(CommentDB.id))
                .filter(CommentDB.recipe_id.in_(recipe_ids))
                .group_by(CommentDB.recipe_id)
                .all()
            )
            if recipe_ids
            else {}
        )
        ratings = (
            {
                row[0]: (round(float(row[1]), 1), row[2])
                for row in db.query(
                    RatingDB.recipe_id,
                    func.avg(RatingDB.score),
                    func.count(RatingDB.id),
                )
                .filter(RatingDB.recipe_id.in_(recipe_ids))
                .group_by(RatingDB.recipe_id)
                .all()
            }
            if recipe_ids
            else {}
        )

        items = []
        for r in recipes:
            author = authors.get(r.user_id)
            avg_score, rating_cnt = ratings.get(r.id, (0.0, 0))
            items.append(
                {
                    "id": r.id,
                    "recipe_name": r.recipe_name,
                    "description": r.description or "",
                    "image_url": r.image_url,
                    "cook_time_minutes": r.cook_time_minutes,
                    "servings": r.servings,
                    "difficulty": r.difficulty or "",
                    "trending_score": round(float(r.trending_score or 0.0), 2),
                    "is_ai": bool(r.is_ai),
                    "author": (
                        {
                            "id": author.id,
                            "username": author.username,
                            "full_name": author.full_name or author.username,
                            "avatar": author.avatar,
                        }
                        if author
                        else None
                    ),
                    "favorites_count": favorites.get(r.id, 0),
                    "comments_count": comments.get(r.id, 0),
                    "ratings_avg": avg_score,
                    "ratings_count": rating_cnt,
                    "created_at": _iso(r.created_at),
                }
            )
        return {"items": items, "pagination": _pagination(page, limit, total)}

    @staticmethod
    def get_recipe_detail(db: Session, recipe_id: int) -> dict:
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException("Không tìm thấy công thức", "RECIPE_NOT_FOUND", 404)
        author = (
            db.query(UserDB).filter(UserDB.id == recipe.user_id).first()
            if recipe.user_id
            else None
        )
        categories = [
            row[0]
            for row in db.query(CategoryDB.name)
            .join(RecipeCategoryDB, RecipeCategoryDB.category_id == CategoryDB.id)
            .filter(RecipeCategoryDB.recipe_id == recipe.id)
            .all()
        ]
        tags = [
            row[0]
            for row in db.query(TagDB.name)
            .join(RecipeTagDB, RecipeTagDB.tag_id == TagDB.id)
            .filter(RecipeTagDB.recipe_id == recipe.id)
            .all()
        ]
        return {
            "id": recipe.id,
            "recipe_name": recipe.recipe_name,
            "description": recipe.description or "",
            "ingredients": recipe.ingredients or [],
            "instructions": recipe.instructions or [],
            "image_url": recipe.image_url,
            "cook_time_minutes": recipe.cook_time_minutes,
            "servings": recipe.servings,
            "difficulty": recipe.difficulty or "",
            "trending_score": round(float(recipe.trending_score or 0.0), 2),
            "is_ai": bool(recipe.is_ai),
            "categories": categories,
            "tags": tags,
            "author": (
                {
                    "id": author.id,
                    "username": author.username,
                    "full_name": author.full_name or author.username,
                    "avatar": author.avatar,
                }
                if author
                else None
            ),
            "created_at": _iso(recipe.created_at),
            "updated_at": _iso(recipe.updated_at),
        }

    @staticmethod
    def update_recipe(db: Session, recipe_id: int, data: AdminRecipeUpdate) -> dict:
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException("Không tìm thấy công thức", "RECIPE_NOT_FOUND", 404)

        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(recipe, field, value)

        db.commit()
        db.refresh(recipe)
        return AdminService.get_recipe_detail(db, recipe.id)

    @staticmethod
    def delete_recipe(db: Session, recipe_id: int) -> dict:
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException("Không tìm thấy công thức", "RECIPE_NOT_FOUND", 404)

        try:
            image_url = _delete_recipe_in_session(db, recipe)
            db.commit()
        except Exception as exc:
            db.rollback()
            raise CustomException(
                f"Không thể xóa công thức: {exc}", "DELETE_RECIPE_ERROR", 500
            ) from exc

        if image_url:
            delete_image_url(image_url)

        return {"deleted_recipe_id": recipe_id}

    # ------------------------------------------------------------------
    # REELS
    # ------------------------------------------------------------------
    @staticmethod
    def list_reels(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> dict:
        query = db.query(ReelDB)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(ReelDB.caption.ilike(pattern))

        total = query.count()
        reels = (
            query.order_by(ReelDB.created_at.desc(), ReelDB.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        reel_ids = [r.id for r in reels]
        author_ids = {r.user_id for r in reels if r.user_id is not None}

        authors = (
            {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(author_ids)).all()}
            if author_ids
            else {}
        )
        likes = (
            dict(
                db.query(ReelLikeDB.reel_id, func.count(ReelLikeDB.id))
                .filter(ReelLikeDB.reel_id.in_(reel_ids))
                .group_by(ReelLikeDB.reel_id)
                .all()
            )
            if reel_ids
            else {}
        )
        comments = (
            dict(
                db.query(ReelCommentDB.reel_id, func.count(ReelCommentDB.id))
                .filter(ReelCommentDB.reel_id.in_(reel_ids))
                .group_by(ReelCommentDB.reel_id)
                .all()
            )
            if reel_ids
            else {}
        )

        items = []
        for r in reels:
            author = authors.get(r.user_id)
            items.append(
                {
                    "id": r.id,
                    "video_url": r.video_url,
                    "poster_url": r.poster_url,
                    "caption": r.caption or "",
                    "recipe_id": r.recipe_id,
                    "view_count": r.view_count or 0,
                    "likes_count": likes.get(r.id, 0),
                    "comments_count": comments.get(r.id, 0),
                    "is_pexels": bool(
                        author and (author.username or "").startswith("pexels_user_")
                    ),
                    "author": (
                        {
                            "id": author.id,
                            "username": author.username,
                            "full_name": author.full_name or author.username,
                            "avatar": author.avatar,
                        }
                        if author
                        else None
                    ),
                    "created_at": _iso(r.created_at),
                }
            )
        return {"items": items, "pagination": _pagination(page, limit, total)}

    @staticmethod
    def delete_reel(db: Session, reel_id: int) -> dict:
        reel = db.query(ReelDB).filter(ReelDB.id == reel_id).first()
        if not reel:
            raise CustomException("Không tìm thấy video reel", "REEL_NOT_FOUND", 404)

        try:
            _delete_reel_in_session(db, reel)
            db.commit()
        except Exception as exc:
            db.rollback()
            raise CustomException(
                f"Không thể xóa video reel: {exc}", "DELETE_REEL_ERROR", 500
            ) from exc

        return {"deleted_reel_id": reel_id}

    # ------------------------------------------------------------------
    # CATEGORIES & TAGS
    # ------------------------------------------------------------------
    @staticmethod
    def list_categories(db: Session) -> list[dict]:
        categories = db.query(CategoryDB).order_by(CategoryDB.name.asc()).all()
        counts = dict(
            db.query(RecipeCategoryDB.category_id, func.count(RecipeCategoryDB.id))
            .group_by(RecipeCategoryDB.category_id)
            .all()
        )
        return [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "recipes_count": counts.get(c.id, 0),
                "created_at": _iso(c.created_at),
            }
            for c in categories
        ]

    @staticmethod
    def create_category(db: Session, data: AdminCategoryCreate) -> dict:
        name = data.name.strip()
        slug = (data.slug.strip() if data.slug else "") or RecipeSupport.slugify(name)
        if not slug:
            raise CustomException("Slug không hợp lệ", "INVALID_SLUG", 422)

        exists = (
            db.query(CategoryDB)
            .filter(or_(CategoryDB.name == name, CategoryDB.slug == slug))
            .first()
        )
        if exists:
            raise CustomException(
                "Danh mục hoặc slug đã tồn tại", "CATEGORY_EXISTS", 409
            )

        category = CategoryDB(name=name, slug=slug)
        db.add(category)
        db.commit()
        db.refresh(category)
        return {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "recipes_count": 0,
            "created_at": _iso(category.created_at),
        }

    @staticmethod
    def update_category(
        db: Session, category_id: int, data: AdminCategoryUpdate
    ) -> dict:
        category = db.query(CategoryDB).filter(CategoryDB.id == category_id).first()
        if not category:
            raise CustomException("Không tìm thấy danh mục", "CATEGORY_NOT_FOUND", 404)

        new_name = data.name.strip() if data.name is not None else category.name
        new_slug = (
            data.slug.strip()
            if data.slug is not None and data.slug.strip()
            else (
                RecipeSupport.slugify(new_name)
                if data.name is not None and data.slug is None
                else category.slug
            )
        )
        if not new_slug:
            raise CustomException("Slug không hợp lệ", "INVALID_SLUG", 422)

        conflict = (
            db.query(CategoryDB)
            .filter(
                CategoryDB.id != category_id,
                or_(CategoryDB.name == new_name, CategoryDB.slug == new_slug),
            )
            .first()
        )
        if conflict:
            raise CustomException(
                "Tên danh mục hoặc slug đã tồn tại", "CATEGORY_EXISTS", 409
            )

        category.name = new_name
        category.slug = new_slug
        db.commit()
        db.refresh(category)
        recipes_count = (
            db.query(func.count(RecipeCategoryDB.id))
            .filter(RecipeCategoryDB.category_id == category.id)
            .scalar()
            or 0
        )
        return {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "recipes_count": recipes_count,
            "created_at": _iso(category.created_at),
        }

    @staticmethod
    def delete_category(db: Session, category_id: int) -> dict:
        category = db.query(CategoryDB).filter(CategoryDB.id == category_id).first()
        if not category:
            raise CustomException("Không tìm thấy danh mục", "CATEGORY_NOT_FOUND", 404)
        db.query(RecipeCategoryDB).filter(
            RecipeCategoryDB.category_id == category_id
        ).delete(synchronize_session=False)
        db.delete(category)
        db.commit()
        return {"deleted_category_id": category_id}

    @staticmethod
    def list_tags(
        db: Session,
        page: int = 1,
        limit: int = 30,
        search: Optional[str] = None,
    ) -> dict:
        query = db.query(TagDB)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(TagDB.name.ilike(pattern), TagDB.slug.ilike(pattern))
            )
        total = query.count()
        tags = (
            query.order_by(TagDB.usage_count.desc(), TagDB.name.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        items = [
            {
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "usage_count": t.usage_count or 0,
                "created_at": _iso(t.created_at),
            }
            for t in tags
        ]
        return {"items": items, "pagination": _pagination(page, limit, total)}

    @staticmethod
    def update_tag(db: Session, tag_id: int, data: AdminTagUpdate) -> dict:
        tag = db.query(TagDB).filter(TagDB.id == tag_id).first()
        if not tag:
            raise CustomException("Không tìm thấy tag", "TAG_NOT_FOUND", 404)

        new_name = data.name.strip() if data.name is not None else tag.name
        new_slug = (
            data.slug.strip()
            if data.slug is not None and data.slug.strip()
            else (
                RecipeSupport.slugify(new_name)
                if data.name is not None and data.slug is None
                else tag.slug
            )
        )
        if not new_slug:
            raise CustomException("Slug không hợp lệ", "INVALID_SLUG", 422)

        conflict = (
            db.query(TagDB)
            .filter(
                TagDB.id != tag_id,
                or_(TagDB.name == new_name, TagDB.slug == new_slug),
            )
            .first()
        )
        if conflict:
            raise CustomException("Tag hoặc slug đã tồn tại", "TAG_EXISTS", 409)

        tag.name = new_name
        tag.slug = new_slug
        db.commit()
        db.refresh(tag)
        return {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "usage_count": tag.usage_count or 0,
            "created_at": _iso(tag.created_at),
        }

    @staticmethod
    def delete_tag(db: Session, tag_id: int) -> dict:
        tag = db.query(TagDB).filter(TagDB.id == tag_id).first()
        if not tag:
            raise CustomException("Không tìm thấy tag", "TAG_NOT_FOUND", 404)
        db.query(RecipeTagDB).filter(RecipeTagDB.tag_id == tag_id).delete(
            synchronize_session=False
        )
        db.delete(tag)
        db.commit()
        return {"deleted_tag_id": tag_id}

    # ------------------------------------------------------------------
    # COMMENTS MODERATION
    # ------------------------------------------------------------------
    @staticmethod
    def list_comments(
        db: Session,
        kind: str = "recipe",
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> dict:
        if kind not in ("recipe", "reel"):
            raise CustomException(
                "Loại bình luận phải là 'recipe' hoặc 'reel'", "INVALID_KIND", 422
            )

        if kind == "recipe":
            query = db.query(CommentDB)
            if search:
                query = query.filter(CommentDB.content.ilike(f"%{search.strip()}%"))
            total = query.count()
            rows = (
                query.order_by(CommentDB.created_at.desc(), CommentDB.id.desc())
                .offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            user_ids = {c.user_id for c in rows if c.user_id is not None}
            recipe_ids = {c.recipe_id for c in rows if c.recipe_id is not None}
            users = (
                {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(user_ids)).all()}
                if user_ids
                else {}
            )
            recipes = (
                {
                    r.id: r
                    for r in db.query(RecipeDB)
                    .filter(RecipeDB.id.in_(recipe_ids))
                    .all()
                }
                if recipe_ids
                else {}
            )
            items = [
                {
                    "id": c.id,
                    "kind": "recipe",
                    "content": c.content,
                    "parent_comment_id": c.parent_comment_id,
                    "target_id": c.recipe_id,
                    "target_title": (
                        recipes[c.recipe_id].recipe_name
                        if c.recipe_id in recipes
                        else f"Công thức #{c.recipe_id}"
                    ),
                    "author": (
                        {
                            "id": users[c.user_id].id,
                            "username": users[c.user_id].username,
                            "full_name": users[c.user_id].full_name
                            or users[c.user_id].username,
                            "avatar": users[c.user_id].avatar,
                        }
                        if c.user_id in users
                        else None
                    ),
                    "created_at": _iso(c.created_at),
                }
                for c in rows
            ]
        else:
            query = db.query(ReelCommentDB)
            if search:
                query = query.filter(ReelCommentDB.content.ilike(f"%{search.strip()}%"))
            total = query.count()
            rows = (
                query.order_by(ReelCommentDB.created_at.desc(), ReelCommentDB.id.desc())
                .offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            user_ids = {c.user_id for c in rows if c.user_id is not None}
            reel_ids = {c.reel_id for c in rows if c.reel_id is not None}
            users = (
                {u.id: u for u in db.query(UserDB).filter(UserDB.id.in_(user_ids)).all()}
                if user_ids
                else {}
            )
            reels = (
                {r.id: r for r in db.query(ReelDB).filter(ReelDB.id.in_(reel_ids)).all()}
                if reel_ids
                else {}
            )
            items = [
                {
                    "id": c.id,
                    "kind": "reel",
                    "content": c.content,
                    "parent_comment_id": c.parent_comment_id,
                    "target_id": c.reel_id,
                    "target_title": (
                        (reels[c.reel_id].caption or f"Reel #{c.reel_id}")[:80]
                        if c.reel_id in reels
                        else f"Reel #{c.reel_id}"
                    ),
                    "author": (
                        {
                            "id": users[c.user_id].id,
                            "username": users[c.user_id].username,
                            "full_name": users[c.user_id].full_name
                            or users[c.user_id].username,
                            "avatar": users[c.user_id].avatar,
                        }
                        if c.user_id in users
                        else None
                    ),
                    "created_at": _iso(c.created_at),
                }
                for c in rows
            ]

        return {"items": items, "pagination": _pagination(page, limit, total)}

    @staticmethod
    def delete_comment(db: Session, kind: str, comment_id: int) -> dict:
        if kind not in ("recipe", "reel"):
            raise CustomException(
                "Loại bình luận phải là 'recipe' hoặc 'reel'", "INVALID_KIND", 422
            )

        if kind == "recipe":
            comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
            if not comment:
                raise CustomException("Không tìm thấy bình luận", "COMMENT_NOT_FOUND", 404)
            _delete_recipe_comments(db, [comment_id])
        else:
            comment = (
                db.query(ReelCommentDB).filter(ReelCommentDB.id == comment_id).first()
            )
            if not comment:
                raise CustomException("Không tìm thấy bình luận", "COMMENT_NOT_FOUND", 404)
            _delete_reel_comments(db, [comment_id])

        db.commit()
        return {"deleted_comment_id": comment_id, "kind": kind}

    # ------------------------------------------------------------------
    # SYSTEM JOBS
    # ------------------------------------------------------------------
    @staticmethod
    def trigger_trending_recalculation() -> dict:
        calculate_trending_scores()
        return {
            "job": "recalculate_trending",
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def trigger_pexels_sync(db: Session) -> dict:
        settings = get_settings()
        before = db.query(ReelDB).count()
        if not settings.pexels_api_key:
            return {
                "job": "sync_pexels",
                "before_count": before,
                "after_count": before,
                "added_count": 0,
                "note": "PEXELS_API_KEY chưa được cấu hình trong backend/.env",
            }
        PexelsService.sync_pexels_cooking_videos(db)
        after = db.query(ReelDB).count()
        note = (
            f"Đã đồng bộ thêm {after - before} video mới"
            if after > before
            else (
                "Database đã có >= 15 video nên không tải thêm"
                if before >= 15
                else "Không có video mới nào được thêm"
            )
        )
        return {
            "job": "sync_pexels",
            "before_count": before,
            "after_count": after,
            "added_count": max(0, after - before),
            "note": note,
        }
