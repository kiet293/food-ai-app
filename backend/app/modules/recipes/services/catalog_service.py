from .presenter import format_recipe_summaries
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import Optional

from app.modules.recipes.model import RecipeDB, CommentDB, RatingDB, CategoryDB, RecipeCategoryDB, TagDB, RecipeTagDB
from app.core.exceptions import CustomException
from app.modules.recipes.schemas import AIAnalysisResult
from app.modules.recipes.repositories import RecipeRepository
from app.modules.users.model import FollowDB, UserDB


from .support import RecipeSupport
from .stats_service import RecipeStatsService


class RecipeCatalogService:
    @staticmethod
    def get_trending_recipes(db: Session, limit: int, current_user: Optional[UserDB]):
        try:
            recipes = db.query(RecipeDB).filter(
                RecipeDB.is_ai == False
            ).order_by(RecipeDB.trending_score.desc().nullslast()).limit(limit).all()

            results = []
            for index, summary in enumerate(format_recipe_summaries(db, recipes, current_user)):
                if index < 3:
                    summary["badge"] = "Đang Hot 🚀"
                results.append(summary)
            return results
        except Exception as e:
            print(f"❌ Lỗi khi lấy Trending Recipes: {e}")
            raise CustomException(
                message=f"Lỗi hệ thống khi lấy danh sách Trending",
                code="FETCH_TRENDING_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def save_recipe_to_notebook(db: Session, current_user: UserDB, recipe_data: AIAnalysisResult):
        existing_recipe = db.query(RecipeDB).filter(
            RecipeDB.user_id == current_user.id,
            RecipeDB.recipe_name == recipe_data.recipeName
        ).first()

        if existing_recipe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Công thức này đã tồn tại trong Sổ tay của bạn!"
            )

        try:
            ingredients_list = [{"name": i.name, "probability": i.probability} for i in recipe_data.ingredients]
            new_recipe = RecipeDB(
                user_id=current_user.id,
                recipe_name=recipe_data.recipeName,
                ingredients=ingredients_list,
                instructions=recipe_data.instructions,
                image_url=recipe_data.imageUrl,
                is_ai=True
            )

            db.add(new_recipe)
            db.flush()
            db.refresh(new_recipe)

            from app.modules.collections.model import CollectionDB, CollectionRecipeDB
            ai_collection = db.query(CollectionDB).filter(
                CollectionDB.user_id == current_user.id,
                CollectionDB.name == "AI gợi ý"
            ).first()

            if not ai_collection:
                ai_collection = CollectionDB(user_id=current_user.id, name="AI gợi ý")
                db.add(ai_collection)
                db.flush()
                db.refresh(ai_collection)

            collection_recipe = CollectionRecipeDB(collection_id=ai_collection.id, recipe_id=new_recipe.id)
            db.add(collection_recipe)
            db.flush()

            RecipeStatsService.record_recipe_save(
                db=db,
                recipe_name=recipe_data.recipeName,
                ingredients=ingredients_list,
                instructions=recipe_data.instructions,
                image_url=recipe_data.imageUrl,
                commit=False,
            )
            db.commit()
            return {"recipe_id": new_recipe.id}
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi lưu DB: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể lưu vào CSDL"
            )


    @staticmethod
    def get_notebook_recipes(db: Session, current_user: UserDB):
        try:
            recipes = db.query(RecipeDB).filter(RecipeDB.user_id == current_user.id).order_by(RecipeDB.id.desc()).all()
            return recipes
        except Exception as e:
            print(f"❌ Lỗi khi lấy danh sách Sổ tay: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tải danh sách công thức"
            )


    @staticmethod
    def delete_recipe(db: Session, recipe_id: int, current_user: UserDB):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id, RecipeDB.user_id == current_user.id).first()
            if not recipe:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Không tìm thấy công thức"
                )
            db.delete(recipe)
            db.commit()
            return {"message": "Đã xóa công thức thành công"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi khi xóa công thức: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể xóa công thức"
            )


    @staticmethod
    def get_categories_list(db: Session):
        try:
            categories = db.query(CategoryDB).order_by(CategoryDB.id).all()
            return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
        except Exception as e:
            raise CustomException(status_code=500, code="FETCH_CATEGORIES_ERROR", message=f"Lỗi khi lấy danh mục: {str(e)}")


    @staticmethod
    def get_explore_grid(db: Session, cursor: Optional[int], limit: int, tag: Optional[str]):
        try:
            query = db.query(RecipeDB).filter(RecipeDB.is_ai == False)
            if tag and tag != "Tất Cả":
                tag_slug = RecipeSupport.slugify(tag)
                query = query.join(RecipeTagDB, RecipeTagDB.recipe_id == RecipeDB.id)\
                             .join(TagDB, TagDB.id == RecipeTagDB.tag_id)\
                             .filter(TagDB.slug == tag_slug)

            query = query.order_by(RecipeDB.id.desc())
            if cursor:
                query = query.filter(RecipeDB.id < cursor)

            recipes = query.limit(limit).all()
            next_cursor = recipes[-1].id if len(recipes) == limit else None

            result_list = [
                {
                    "id": r.id,
                    "image": r.image_url or "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"
                }
                for r in recipes
            ]
            return {"items": result_list, "next_cursor": next_cursor}
        except Exception as e:
            print(f"❌ Lỗi khi lấy explore grid: {e}")
            raise CustomException(
                message="Lỗi khi lấy danh sách khám phá",
                code="EXPLORE_GRID_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def get_explore_feed(db: Session, start_id: Optional[int], limit: int, tag: Optional[str], current_user: Optional[UserDB]):
        try:
            query = db.query(RecipeDB).filter(RecipeDB.is_ai == False)
            if tag:
                tag_slug = RecipeSupport.slugify(tag.replace('#', ''))
                query = query.join(RecipeTagDB, RecipeTagDB.recipe_id == RecipeDB.id)\
                             .join(TagDB, TagDB.id == RecipeTagDB.tag_id)\
                             .filter(TagDB.slug == tag_slug)

            query = query.order_by(RecipeDB.id.desc())
            if start_id:
                query = query.filter(RecipeDB.id <= start_id)

            recipes = query.limit(limit).all()
            next_cursor = recipes[-1].id - 1 if len(recipes) == limit else None
            result_list = format_recipe_summaries(db, recipes, current_user)

            return {"items": result_list, "next_cursor": next_cursor}
        except Exception as e:
            print(f"❌ Lỗi khi lấy explore feed: {e}")
            raise CustomException(
                message="Lỗi khi lấy danh sách feed",
                code="EXPLORE_FEED_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def get_following_feed(db: Session, start_id: Optional[int], limit: int, tag: Optional[str], current_user: UserDB):
        try:
            query = db.query(RecipeDB).join(
                FollowDB,
                RecipeDB.user_id == FollowDB.following_id
            ).filter(
                FollowDB.follower_id == current_user.id,
                RecipeDB.is_ai == False
            )

            if tag:
                tag_slug = RecipeSupport.slugify(tag.replace('#', ''))
                query = query.join(RecipeTagDB, RecipeTagDB.recipe_id == RecipeDB.id)\
                             .join(TagDB, TagDB.id == RecipeTagDB.tag_id)\
                             .filter(TagDB.slug == tag_slug)

            query = query.order_by(RecipeDB.id.desc())
            if start_id:
                query = query.filter(RecipeDB.id <= start_id)

            recipes = query.limit(limit).all()
            next_cursor = recipes[-1].id - 1 if len(recipes) == limit else None
            result_list = format_recipe_summaries(db, recipes, current_user)

            return {"items": result_list, "next_cursor": next_cursor}
        except Exception as e:
            print(f"❌ Lỗi khi lấy following feed: {str(e)}")
            raise CustomException(
                message=f"Lỗi khi lấy danh sách following feed: {str(e)}",
                code="FOLLOWING_FEED_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def get_recipe_detail(db: Session, recipe_id: int, current_user: Optional[UserDB]):
        try:
            recipe = RecipeRepository.get_by_id(db, recipe_id)
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            recipe_data = RecipeSupport.format_recipe_summary(recipe, current_user)
            recipe_data["description"] = recipe.description
            recipe_data["ingredients"] = recipe.ingredients
            recipe_data["instructions"] = recipe.instructions
            recipe_data["servings"] = recipe.servings

            recipe_category = db.query(CategoryDB).join(RecipeCategoryDB).filter(RecipeCategoryDB.recipe_id == recipe.id).first()
            recipe_data["category_name"] = recipe_category.name if recipe_category else None

            tags = db.query(TagDB).join(RecipeTagDB).filter(RecipeTagDB.recipe_id == recipe.id).all()
            recipe_data["tags"] = [t.name for t in tags]

            comments_dict = {}
            root_comments = []
            if recipe.comments:
                sorted_comments = sorted(recipe.comments, key=lambda x: x.id)
                for c in sorted_comments:
                    user_info = None
                    if c.user:
                        user_info = {
                            "id": c.user.id,
                            "name": c.user.full_name or c.user.username,
                            "avatar": c.user.avatar
                        }
                    comment_obj = {
                        "id": c.id,
                        "content": c.content,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "user": user_info,
                        "is_author": c.user_id == recipe.user_id,
                        "replies": []
                    }
                    comments_dict[c.id] = comment_obj

                for c in sorted_comments:
                    if getattr(c, "parent_comment_id", None) and getattr(c, "parent_comment_id") in comments_dict:
                        comments_dict[c.parent_comment_id]["replies"].append(comments_dict[c.id])
                    else:
                        root_comments.append(comments_dict[c.id])

            recipe_data["comments"] = root_comments
            return recipe_data
        except CustomException:
            raise
        except Exception as e:
            print(f"❌ Lỗi khi lấy chi tiết công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tải chi tiết công thức",
                code="GET_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @staticmethod
    def get_recipes_list(db: Session, page: int, limit: int, sort_by: str):
        try:
            if sort_by not in ["newest", "popular", "top_rated"]:
                sort_by = "newest"

            query = db.query(RecipeDB).filter(RecipeDB.is_ai == False)

            if sort_by == "newest":
                query = query.order_by(RecipeDB.created_at.desc())

            elif sort_by == "top_rated":
                avg_rating_subq = db.query(
                    RatingDB.recipe_id,
                    func.avg(RatingDB.score).label("avg_score")
                ).group_by(RatingDB.recipe_id).subquery()

                query = query.outerjoin(avg_rating_subq, RecipeDB.id == avg_rating_subq.c.recipe_id)
                query = query.order_by(avg_rating_subq.c.avg_score.desc().nulls_last(), RecipeDB.created_at.desc())

            elif sort_by == "popular":
                rating_count_subq = db.query(
                    RatingDB.recipe_id,
                    func.count(RatingDB.id).label("r_count")
                ).group_by(RatingDB.recipe_id).subquery()

                comment_count_subq = db.query(
                    CommentDB.recipe_id,
                    func.count(CommentDB.id).label("c_count")
                ).group_by(CommentDB.recipe_id).subquery()

                query = query.outerjoin(rating_count_subq, RecipeDB.id == rating_count_subq.c.recipe_id)
                query = query.outerjoin(comment_count_subq, RecipeDB.id == comment_count_subq.c.recipe_id)

                query = query.order_by(
                    (func.coalesce(rating_count_subq.c.r_count, 0) + func.coalesce(comment_count_subq.c.c_count, 0)).desc(),
                    RecipeDB.created_at.desc()
                )

            total_items = query.count()
            total_pages = (total_items + limit - 1) // limit
            recipes = query.offset((page - 1) * limit).limit(limit).all()
            result_list = format_recipe_summaries(db, recipes)

            return {
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            }
        except Exception as e:
            print(f"❌ Lỗi khi lấy danh sách công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi tải danh sách công thức",
                code="GET_RECIPES_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
