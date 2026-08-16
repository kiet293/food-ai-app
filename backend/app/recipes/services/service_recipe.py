import json
import re
import unicodedata
import cloudinary.uploader
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from fastapi import UploadFile, HTTPException, status, BackgroundTasks
from typing import Optional, List
from app.utils.ws_manager import manager

from app.recipes.models import (
    RecipeDB,
    RecipeStatsDB,
    CommentDB,
    RatingDB,
    CategoryDB,
    RecipeCategoryDB,
    TagDB,
    RecipeTagDB,
    FavoriteDB
)
from app.users.models import UserDB, FollowDB
from app.recipes.schemas import AIAnalysisResult, RateRecipeRequest
from app.utils.response import CustomException

DEFAULT_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80"

class RecipeService:
    @staticmethod
    def slugify(text: str) -> str:
        text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', '', text).strip().lower()
        return re.sub(r'[-\s]+', '-', text)

    @staticmethod
    def upload_image_to_cloudinary(image: UploadFile) -> str:
        try:
            upload_result = cloudinary.uploader.upload(image.file)
            image_url = upload_result.get("secure_url")
            return image_url
        except Exception as e:
            print(f"❌ Lỗi khi upload ảnh lên Cloudinary: {e}")
            raise CustomException(
                message=f"Không thể upload ảnh: {str(e)}",
                code="IMAGE_UPLOAD_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def delete_image_from_cloudinary(image_url: str):
        if not image_url or "cloudinary.com" not in image_url:
            return
        try:
            parts = image_url.split('/upload/')
            if len(parts) > 1:
                path_part = parts[1]
                if path_part.startswith('v'):
                    path_part = path_part.split('/', 1)[1] if '/' in path_part else path_part
                public_id = path_part.rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
        except Exception as e:
            print(f"❌ Lỗi khi xóa ảnh cũ trên Cloudinary: {e}")

    @staticmethod
    def format_recipe_summary(recipe: RecipeDB, current_user: Optional[UserDB] = None):
        author_info = None
        if recipe.author:
            db = Session.object_session(recipe)
            is_following = False
            is_self = False
            if current_user and db:
                is_self = current_user.id == recipe.author.id
                if not is_self:
                    is_following = db.query(FollowDB).filter(
                        FollowDB.follower_id == current_user.id,
                        FollowDB.following_id == recipe.author.id
                    ).first() is not None

            author_info = {
                "id": recipe.author.id,
                "name": recipe.author.full_name or recipe.author.username,
                "handle": f"@{recipe.author.username}",
                "avatar": recipe.author.avatar,
                "is_following": is_following,
                "is_self": is_self
            }

        ratings_list = [r.score for r in recipe.ratings] if recipe.ratings else []
        ratings_avg = sum(ratings_list) / len(ratings_list) if ratings_list else 0

        is_favorited = False
        if current_user and recipe.favorites:
            is_favorited = any(f.user_id == current_user.id for f in recipe.favorites)

        is_in_collection = False
        if current_user and recipe.collection_associations:
            is_in_collection = any(assoc.collection and assoc.collection.user_id == current_user.id for assoc in recipe.collection_associations)

        return {
            "id": recipe.id,
            "title": recipe.recipe_name,
            "description": recipe.description,
            "image": recipe.image_url,
            "cook_time_minutes": recipe.cook_time_minutes,
            "difficulty": recipe.difficulty,
            "author": author_info,
            "ratings_avg": round(ratings_avg, 1),
            "ratings_count": len(ratings_list),
            "comments_count": len(recipe.comments) if recipe.comments else 0,
            "favorites_count": len(recipe.favorites) if recipe.favorites else 0,
            "is_favorited": is_favorited,
            "is_in_collection": is_in_collection,
            "cooked_count": 0,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None
        }

    @staticmethod
    def record_recipe_scan(db: Session, recipe_name: str, ingredients: list, instructions: list, image_url: str):
        try:
            clean_name = recipe_name.strip()
            ingredients_list = []
            for ing in ingredients:
                if isinstance(ing, dict):
                    ingredients_list.append({"name": ing.get("name", ""), "probability": ing.get("probability", 100)})
                else:
                    ingredients_list.append({"name": ing.name, "probability": ing.probability})

            stats = db.query(RecipeStatsDB).filter(RecipeStatsDB.recipe_name == clean_name).first()
            if stats:
                stats.scan_count += 1
                if image_url:
                    stats.image_url = image_url
                stats.ingredients = ingredients_list
                stats.instructions = instructions
            else:
                stats = RecipeStatsDB(
                    recipe_name=clean_name,
                    scan_count=1,
                    save_count=0,
                    ingredients=ingredients_list,
                    instructions=instructions,
                    image_url=image_url
                )
                db.add(stats)
            db.commit()
            print(f"📊 Đã ghi nhận 1 lượt quét cho món: {clean_name} (scan_count={stats.scan_count})")
        except Exception as e:
            db.rollback()
            print(f"⚠️ Lỗi khi cập nhật lượt quét món ăn '{recipe_name}': {e}")

    @staticmethod
    def record_recipe_save(db: Session, recipe_name: str, ingredients: list, instructions: list, image_url: str):
        try:
            clean_name = recipe_name.strip()
            ingredients_list = []
            for ing in ingredients:
                if isinstance(ing, dict):
                    ingredients_list.append({
                        "name": ing.get("name", ""), 
                        "probability": ing.get("probability", 100)
                    })
                else:
                    ingredients_list.append({
                        "name": ing.name, 
                        "probability": ing.probability
                    })

            stats = db.query(RecipeStatsDB).filter(RecipeStatsDB.recipe_name == clean_name).first()
            if stats:
                stats.save_count += 1
                if image_url:
                    stats.image_url = image_url
                stats.ingredients = ingredients_list
                stats.instructions = instructions
            else:
                stats = RecipeStatsDB(
                    recipe_name=clean_name,
                    scan_count=1,  
                    save_count=1,
                    ingredients=ingredients_list,
                    instructions=instructions,
                    image_url=image_url
                )
                db.add(stats)
            db.commit()
            print(f"📊 Đã ghi nhận 1 lượt lưu cho món: {clean_name} (save_count={stats.save_count})")
            return True
        except Exception as e:
            db.rollback()
            print(f"⚠️ Lỗi khi cập nhật lượt lưu món ăn '{recipe_name}': {e}")
            return False

    @staticmethod
    def get_trending_recipes(db: Session, limit: int, current_user: Optional[UserDB]):
        try:
            recipes = db.query(RecipeDB).filter(
                RecipeDB.is_ai == False
            ).order_by(RecipeDB.trending_score.desc().nullslast()).limit(limit).all()
            
            results = []
            for index, recipe in enumerate(recipes):
                summary = RecipeService.format_recipe_summary(recipe, current_user)
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
            db.commit()
            db.refresh(new_recipe)

            from app.collections.models import CollectionDB, CollectionRecipeDB
            ai_collection = db.query(CollectionDB).filter(
                CollectionDB.user_id == current_user.id,
                CollectionDB.name == "AI gợi ý"
            ).first()

            if not ai_collection:
                ai_collection = CollectionDB(user_id=current_user.id, name="AI gợi ý")
                db.add(ai_collection)
                db.commit()
                db.refresh(ai_collection)
            
            collection_recipe = CollectionRecipeDB(collection_id=ai_collection.id, recipe_id=new_recipe.id)
            db.add(collection_recipe)
            db.commit()

            RecipeService.record_recipe_save(
                db=db, 
                recipe_name=recipe_data.recipeName, 
                ingredients=ingredients_list, 
                instructions=recipe_data.instructions, 
                image_url=recipe_data.imageUrl
            )
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
    def get_popular_recipes(db: Session):
        try:
            popular_recipes = db.query(RecipeStatsDB).order_by(
                RecipeStatsDB.save_count.desc(),
                RecipeStatsDB.scan_count.desc()
            ).limit(10).all()
            return popular_recipes
        except Exception as e:
            print(f"❌ Lỗi khi lấy danh sách xu hướng: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Không thể tải danh sách món ăn xu hướng"
            )

    @staticmethod
    def create_new_recipe(
        db: Session,
        current_user: UserDB,
        recipe_name: str,
        description: Optional[str],
        ingredients: str,
        instructions: str,
        cook_time_minutes: Optional[int],
        servings: Optional[int],
        difficulty: Optional[str],
        category_name: Optional[str],
        tags: Optional[str],
        image: Optional[UploadFile]
    ):
        try:
            try:
                parsed_ingredients = json.loads(ingredients)
                parsed_instructions = json.loads(instructions)
            except json.JSONDecodeError as e:
                print(f"❌ Lỗi khi parse JSON: {e}")
                raise CustomException(
                    message="Dữ liệu ingredients hoặc instructions không đúng định dạng JSON",
                    code="INVALID_JSON_FORMAT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            image_url = RecipeService.upload_image_to_cloudinary(image) if image else None

            try:
                new_recipe = RecipeDB(
                    user_id=current_user.id,
                    recipe_name=recipe_name,
                    description=description,
                    ingredients=parsed_ingredients,
                    instructions=parsed_instructions,
                    cook_time_minutes=cook_time_minutes,
                    servings=servings,
                    difficulty=difficulty,
                    image_url=image_url
                )

                db.add(new_recipe)
                db.commit()
                db.refresh(new_recipe)
                
                if category_name:
                    category = db.query(CategoryDB).filter(CategoryDB.name == category_name).first()
                    if category:
                        recipe_cat = RecipeCategoryDB(recipe_id=new_recipe.id, category_id=category.id)
                        db.add(recipe_cat)

                if tags:
                    try:
                        parsed_tags = json.loads(tags)
                        if isinstance(parsed_tags, list):
                            for tag_name in parsed_tags:
                                tag_name = tag_name.strip()
                                if not tag_name: continue
                                tag_slug = RecipeService.slugify(tag_name)
                                existing_tag = db.query(TagDB).filter(TagDB.slug == tag_slug).first()
                                if not existing_tag:
                                    existing_tag = TagDB(name=tag_name, slug=tag_slug, usage_count=1)
                                    db.add(existing_tag)
                                    db.commit()
                                    db.refresh(existing_tag)
                                else:
                                    existing_tag.usage_count += 1
                                recipe_tag = RecipeTagDB(recipe_id=new_recipe.id, tag_id=existing_tag.id)
                                db.add(recipe_tag)
                    except json.JSONDecodeError as e:
                        print(f"Lỗi parse tags JSON: {e}")

                db.commit()
                return {"recipe_id": new_recipe.id}
            except Exception as e:
                db.rollback()
                print(f"❌ Lỗi DATABASE khi insert công thức: {e}")
                raise CustomException(
                    message=f"Lỗi Database: {str(e)}",
                    code="DB_INSERT_ERROR",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except CustomException:
            raise
        except Exception as e:
            print(f"❌ Lỗi hệ thống: {e}")
            raise CustomException(
                message="Không thể tạo công thức mới",
                code="CREATE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_categories_list(db: Session):
        try:
            categories = db.query(CategoryDB).order_by(CategoryDB.id).all()
            return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
        except Exception as e:
            raise CustomException(status_code=500, message=f"Lỗi khi lấy danh mục: {str(e)}")

    @staticmethod
    def get_explore_grid(db: Session, cursor: Optional[int], limit: int, tag: Optional[str]):
        try:
            query = db.query(RecipeDB).filter(RecipeDB.is_ai == False)
            if tag and tag != "Tất Cả":
                tag_slug = RecipeService.slugify(tag)
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
                tag_slug = RecipeService.slugify(tag.replace('#', ''))
                query = query.join(RecipeTagDB, RecipeTagDB.recipe_id == RecipeDB.id)\
                             .join(TagDB, TagDB.id == RecipeTagDB.tag_id)\
                             .filter(TagDB.slug == tag_slug)
                             
            query = query.order_by(RecipeDB.id.desc())
            if start_id:
                query = query.filter(RecipeDB.id <= start_id)

            recipes = query.limit(limit).all()
            next_cursor = recipes[-1].id - 1 if len(recipes) == limit else None
            result_list = [RecipeService.format_recipe_summary(r, current_user) for r in recipes]
            
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
                tag_slug = RecipeService.slugify(tag.replace('#', ''))
                query = query.join(RecipeTagDB, RecipeTagDB.recipe_id == RecipeDB.id)\
                             .join(TagDB, TagDB.id == RecipeTagDB.tag_id)\
                             .filter(TagDB.slug == tag_slug)
                             
            query = query.order_by(RecipeDB.id.desc())
            if start_id:
                query = query.filter(RecipeDB.id <= start_id)

            recipes = query.limit(limit).all()
            next_cursor = recipes[-1].id - 1 if len(recipes) == limit else None
            result_list = [RecipeService.format_recipe_summary(r, current_user) for r in recipes]
            
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
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            recipe_data = RecipeService.format_recipe_summary(recipe, current_user)
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
            result_list = [RecipeService.format_recipe_summary(recipe) for recipe in recipes]

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

    @staticmethod
    def update_recipe(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        recipe_name: Optional[str],
        description: Optional[str],
        ingredients: Optional[str],
        instructions: Optional[str],
        cook_time_minutes: Optional[int],
        servings: Optional[int],
        difficulty: Optional[str],
        category_name: Optional[str],
        tags: Optional[str],
        image: Optional[UploadFile]
    ):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
                
            if recipe.user_id != current_user.id:
                raise CustomException(
                    message="Bạn không có quyền chỉnh sửa công thức này",
                    code="FORBIDDEN",
                    status_code=status.HTTP_403_FORBIDDEN
                )
                
            if ingredients:
                try:
                    parsed_ingredients = json.loads(ingredients)
                    recipe.ingredients = parsed_ingredients
                except json.JSONDecodeError as e:
                    print(f"❌ Lỗi khi parse JSON ingredients: {e}")
                    raise CustomException(
                        message="Dữ liệu ingredients không đúng định dạng JSON",
                        code="INVALID_JSON_FORMAT",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                    
            if instructions:
                try:
                    parsed_instructions = json.loads(instructions)
                    recipe.instructions = parsed_instructions
                except json.JSONDecodeError as e:
                    print(f"❌ Lỗi khi parse JSON instructions: {e}")
                    raise CustomException(
                        message="Dữ liệu instructions không đúng định dạng JSON",
                        code="INVALID_JSON_FORMAT",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )

            if image:
                RecipeService.delete_image_from_cloudinary(recipe.image_url)
                recipe.image_url = RecipeService.upload_image_to_cloudinary(image)

            if recipe_name is not None:
                recipe.recipe_name = recipe_name
            if description is not None:
                recipe.description = description
            if cook_time_minutes is not None:
                recipe.cook_time_minutes = cook_time_minutes
            if servings is not None:
                recipe.servings = servings
            if difficulty is not None:
                recipe.difficulty = difficulty

            if category_name is not None:
                db.query(RecipeCategoryDB).filter(RecipeCategoryDB.recipe_id == recipe.id).delete()
                category = db.query(CategoryDB).filter(CategoryDB.name == category_name).first()
                if category:
                    db.add(RecipeCategoryDB(recipe_id=recipe.id, category_id=category.id))

            if tags is not None:
                try:
                    db.query(RecipeTagDB).filter(RecipeTagDB.recipe_id == recipe.id).delete()
                    parsed_tags = json.loads(tags)
                    if isinstance(parsed_tags, list):
                        for tag_name in parsed_tags:
                            tag_name = tag_name.strip()
                            if not tag_name: continue
                            tag_slug = RecipeService.slugify(tag_name)
                            existing_tag = db.query(TagDB).filter(TagDB.slug == tag_slug).first()
                            if not existing_tag:
                                existing_tag = TagDB(name=tag_name, slug=tag_slug, usage_count=1)
                                db.add(existing_tag)
                                db.commit()
                                db.refresh(existing_tag)
                            else:
                                existing_tag.usage_count += 1
                            db.add(RecipeTagDB(recipe_id=recipe.id, tag_id=existing_tag.id))
                except json.JSONDecodeError as e:
                    print(f"Lỗi parse tags JSON: {e}")

            db.commit()
            db.refresh(recipe)
            
            recipe_data = RecipeService.format_recipe_summary(recipe)
            recipe_data["description"] = recipe.description
            recipe_data["ingredients"] = recipe.ingredients
            recipe_data["instructions"] = recipe.instructions
            recipe_data["servings"] = recipe.servings
            return recipe_data
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi cập nhật công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi cập nhật công thức",
                code="UPDATE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def rate_recipe(db: Session, recipe_id: int, current_user: UserDB, request: RateRecipeRequest):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=404
                )
                
            existing_rating = db.query(RatingDB).filter(
                RatingDB.recipe_id == recipe_id, 
                RatingDB.user_id == current_user.id
            ).first()
            
            if existing_rating:
                existing_rating.score = request.score
            else:
                new_rating = RatingDB(
                    recipe_id=recipe_id,
                    user_id=current_user.id,
                    score=request.score
                )
                db.add(new_rating)
                
            if request.comment and request.comment.strip():
                new_comment = CommentDB(
                    recipe_id=recipe_id,
                    user_id=current_user.id,
                    content=request.comment.strip()
                )
                db.add(new_comment)
                
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise CustomException(
                message=f"Lỗi khi lưu đánh giá: {e}",
                code="RATE_RECIPE_ERROR",
                status_code=500
            )

    @staticmethod
    def add_recipe_comment(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        content: str,
        parent_comment_id: Optional[int],
        background_tasks: BackgroundTasks
    ):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )
                
            if not content.strip():
                raise CustomException(
                    message="Nội dung bình luận không được để trống",
                    code="INVALID_COMMENT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
            if parent_comment_id:
                parent = db.query(CommentDB).filter(CommentDB.id == parent_comment_id).first()
                if not parent:
                    raise CustomException(
                        message="Bình luận gốc không tồn tại",
                        code="PARENT_COMMENT_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND
                    )
                
            new_comment = CommentDB(
                recipe_id=recipe_id,
                user_id=current_user.id,
                content=content.strip(),
                parent_comment_id=parent_comment_id
            )
            
            db.add(new_comment)
            db.commit()
            db.refresh(new_comment)

            total_comments = db.query(CommentDB).filter(CommentDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "COMMENT_UPDATE", "recipe_id": recipe_id, "comments_count": total_comments}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)
            
            return {
                "id": new_comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": new_comment.content,
                "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
                "parent_comment_id": new_comment.parent_comment_id
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi đăng bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi lưu bình luận",
                code="CREATE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def update_recipe_comment(
        db: Session,
        comment_id: int,
        current_user: UserDB,
        content: str
    ):
        try:
            comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
            if not comment:
                raise CustomException(
                    message="Không tìm thấy bình luận",
                    code="COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            if comment.user_id != current_user.id:
                raise CustomException(
                    message="Bạn không có quyền sửa bình luận này",
                    code="FORBIDDEN",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            new_content = content.strip()
            if not new_content:
                raise CustomException(
                    message="Nội dung bình luận không được để trống",
                    code="INVALID_COMMENT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            comment.content = new_content
            db.commit()
            db.refresh(comment)

            return {
                "id": comment.id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.full_name or current_user.username,
                    "avatar": current_user.avatar
                },
                "content": comment.content,
                "created_at": comment.created_at.isoformat() if comment.created_at else None
            }
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi sửa bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi cập nhật bình luận",
                code="UPDATE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def delete_recipe_comment(
        db: Session,
        comment_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            comment = db.query(CommentDB).filter(CommentDB.id == comment_id).first()
            if not comment:
                raise CustomException(
                    message="Không tìm thấy bình luận",
                    code="COMMENT_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            if comment.user_id != current_user.id and not current_user.is_admin:
                raise CustomException(
                    message="Bạn không có quyền xóa bình luận này",
                    code="FORBIDDEN",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            recipe_id = comment.recipe_id
            db.delete(comment)
            db.commit()

            total_comments = db.query(CommentDB).filter(CommentDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "COMMENT_UPDATE", "recipe_id": recipe_id, "comments_count": total_comments}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)
            return True
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi xóa bình luận: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi xóa bình luận",
                code="DELETE_COMMENT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def favorite_recipe(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
            if not recipe:
                raise CustomException(
                    message="Không tìm thấy công thức",
                    code="RECIPE_NOT_FOUND",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            existing_favorite = db.query(FavoriteDB).filter(
                FavoriteDB.recipe_id == recipe_id,
                FavoriteDB.user_id == current_user.id
            ).first()

            if existing_favorite:
                return {"isFavorited": True, "already": True}

            new_favorite = FavoriteDB(recipe_id=recipe_id, user_id=current_user.id)
            db.add(new_favorite)
            db.commit()

            total = db.query(FavoriteDB).filter(FavoriteDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "TYM_UPDATE", "recipe_id": recipe_id, "favorites_count": total}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)

            return {"isFavorited": True, "already": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi yêu thích công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi yêu thích công thức",
                code="FAVORITE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def unfavorite_recipe(
        db: Session,
        recipe_id: int,
        current_user: UserDB,
        background_tasks: BackgroundTasks
    ):
        try:
            existing_favorite = db.query(FavoriteDB).filter(
                FavoriteDB.recipe_id == recipe_id,
                FavoriteDB.user_id == current_user.id
            ).first()

            if not existing_favorite:
                raise CustomException(
                    message="Bạn chưa yêu thích công thức này",
                    code="NOT_FAVORITED_ERROR",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            db.delete(existing_favorite)
            db.commit()

            total = db.query(FavoriteDB).filter(FavoriteDB.recipe_id == recipe_id).count()
            async def broadcast():
                payload = {"type": "TYM_UPDATE", "recipe_id": recipe_id, "favorites_count": total}
                await manager.broadcast_to_recipe(str(recipe_id), payload)
                await manager.broadcast_to_recipe("GLOBAL_FEED", payload)
            background_tasks.add_task(broadcast)

            return {"isFavorited": False}
        except CustomException:
            raise
        except Exception as e:
            db.rollback()
            print(f"❌ Lỗi hệ thống khi bỏ yêu thích công thức: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi bỏ yêu thích",
                code="UNFAVORITE_RECIPE_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_hot_tags(db: Session) -> List[TagDB]:
        try:
            hot_tags = db.query(TagDB).order_by(TagDB.usage_count.desc()).limit(10).all()
            return hot_tags
        except Exception as e:
            print(f"❌ Lỗi hệ thống khi lấy hot tags: {e}")
            raise CustomException(
                message="Lỗi hệ thống khi lấy danh sách nhãn phổ biến",
                code="GET_HOT_TAGS_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

