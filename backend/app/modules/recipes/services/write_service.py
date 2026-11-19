"""Recipe writes with a single database transaction per use case."""
import json

from sqlalchemy import func

from app.core.exceptions import CustomException
from app.modules.recipes.model import RecipeDB, CategoryDB, RecipeCategoryDB, TagDB, RecipeTagDB
from .support import RecipeSupport


def _list(value, field):
    try:
        result = json.loads(value)
    except (ValueError, TypeError) as exc:
        raise CustomException(f"{field} phải là JSON hợp lệ", "INVALID_JSON_FORMAT", 422) from exc
    if not isinstance(result, list):
        raise CustomException(f"{field} phải là danh sách", "INVALID_JSON_FORMAT", 422)
    return result


def _tags(value):
    result = _list(value, "tags")
    if any(not isinstance(tag, str) for tag in result):
        raise CustomException("Tag phải là chuỗi", "INVALID_TAGS", 422)
    # Deduplicate by the same key that is unique in the database.
    unique = {}
    for tag in result:
        tag = tag.strip()
        slug = RecipeSupport.slugify(tag)
        if not slug:
            continue
        if len(tag) > 50 or len(slug) > 60:
            raise CustomException("Tag quá dài", "INVALID_TAGS", 422)
        unique.setdefault(slug, tag)
    return unique


def _set_metadata(db, recipe, category_name, tags):
    if category_name is not None:
        db.query(RecipeCategoryDB).filter_by(recipe_id=recipe.id).delete()
        category = db.query(CategoryDB).filter_by(name=category_name).first()
        if category:
            db.add(RecipeCategoryDB(recipe_id=recipe.id, category_id=category.id))
    if tags is None:
        return
    old_ids = {row[0] for row in db.query(RecipeTagDB.tag_id).filter_by(recipe_id=recipe.id).all()}
    db.query(RecipeTagDB).filter_by(recipe_id=recipe.id).delete()
    existing = {t.slug: t for t in db.query(TagDB).filter(TagDB.slug.in_(tags)).all()}
    touched = set(old_ids)
    for slug, name in tags.items():
        tag = existing.get(slug)
        if tag is None:
            tag = TagDB(name=name, slug=slug, usage_count=0)
            db.add(tag)
            db.flush()
        touched.add(tag.id)
        db.add(RecipeTagDB(recipe_id=recipe.id, tag_id=tag.id))
    db.flush()
    for tag_id in touched:
        db.query(TagDB).filter_by(id=tag_id).update({
            TagDB.usage_count: db.query(func.count()).select_from(RecipeTagDB).filter_by(tag_id=tag_id).scalar(),
        })


class RecipeWriteService:
    @staticmethod
    def create_new_recipe(db, current_user, recipe_name, description, ingredients, instructions,
                          cook_time_minutes, servings, difficulty, category_name, tags, image):
        parsed_ingredients = _list(ingredients, "ingredients")
        parsed_instructions = _list(instructions, "instructions")
        parsed_tags = _tags(tags) if tags is not None else None
        image_url = None
        try:
            image_url = RecipeSupport.upload_image_to_cloudinary(image) if image else None
            recipe = RecipeDB(
                user_id=current_user.id, recipe_name=recipe_name, description=description,
                ingredients=parsed_ingredients, instructions=parsed_instructions,
                cook_time_minutes=cook_time_minutes, servings=servings,
                difficulty=difficulty, image_url=image_url,
            )
            db.add(recipe)
            db.flush()
            recipe_id = recipe.id
            _set_metadata(db, recipe, category_name, parsed_tags)
            db.commit()
            return {"recipe_id": recipe_id}
        except Exception as exc:
            db.rollback()
            if image_url:
                RecipeSupport.delete_image_from_cloudinary(image_url)
            if isinstance(exc, CustomException):
                raise
            raise CustomException("Không thể tạo công thức", "CREATE_RECIPE_ERROR", 500) from exc

    @staticmethod
    def update_recipe(db, recipe_id, current_user, recipe_name, description, ingredients,
                      instructions, cook_time_minutes, servings, difficulty, category_name, tags, image):
        new_image = None
        old_image = None
        try:
            recipe = db.query(RecipeDB).filter_by(id=recipe_id).first()
            if recipe is None:
                raise CustomException("Không tìm thấy công thức", "RECIPE_NOT_FOUND", 404)
            if recipe.user_id != current_user.id:
                raise CustomException("Không có quyền sửa công thức", "FORBIDDEN", 403)
            if ingredients is not None:
                recipe.ingredients = _list(ingredients, "ingredients")
            if instructions is not None:
                recipe.instructions = _list(instructions, "instructions")
            parsed_tags = _tags(tags) if tags is not None else None
            if image:
                old_image = recipe.image_url
                new_image = RecipeSupport.upload_image_to_cloudinary(image)
                recipe.image_url = new_image
            values = dict(recipe_name=recipe_name, description=description,
                          cook_time_minutes=cook_time_minutes, servings=servings, difficulty=difficulty)
            for field, value in values.items():
                if value is not None:
                    setattr(recipe, field, value)
            _set_metadata(db, recipe, category_name, parsed_tags)
            db.commit()
        except Exception as exc:
            db.rollback()
            if new_image:
                RecipeSupport.delete_image_from_cloudinary(new_image)
            if isinstance(exc, CustomException):
                raise
            raise CustomException("Không thể cập nhật công thức", "UPDATE_RECIPE_ERROR", 500) from exc
        if old_image:
            RecipeSupport.delete_image_from_cloudinary(old_image)
        result = RecipeSupport.format_recipe_summary(recipe)
        result.update(description=recipe.description, ingredients=recipe.ingredients,
                      instructions=recipe.instructions, servings=recipe.servings)
        return result
