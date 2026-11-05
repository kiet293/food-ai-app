from fastapi import UploadFile
from PIL import UnidentifiedImageError
from typing import List
from sqlalchemy.orm import Session  # type: ignore

from app.integrations import (
    analyze_food_image,
    ask_gemini_for_recipe,
    ask_gemini_for_new_recipe,
    ask_gemini_for_multiple_recipes,
    generate_food_image_url
)
from app.modules.recipes.schemas import AIAnalysisResult, Ingredient, RecipeChatRequest, RecipeSearchRequest, RecipeSearchResponse
from app.modules.recipes.services.stats_service import RecipeStatsService
from app.core.exceptions import CustomException


class AIService:
    @staticmethod
    def analyze_image(image_files: List[UploadFile], db: Session):
        if not 1 <= len(image_files) <= 5:
            raise CustomException("Chỉ nhận từ 1 đến 5 ảnh", "INVALID_IMAGE_COUNT", 422)
        all_detected_ingredients = []
        unique_names = set()

        for image_file in image_files:
            print(f"📥 Đang xử lý ảnh: {image_file.filename}")
            image_bytes = image_file.file.read(10 * 1024 * 1024 + 1)

            if len(image_bytes) > 10 * 1024 * 1024:
                raise CustomException("Mỗi ảnh tối đa 10 MB", "IMAGE_TOO_LARGE", 413)
            try:
                ingredients = [Ingredient.model_validate(item) for item in analyze_food_image(image_bytes)]
            except (UnidentifiedImageError, OSError, ValueError) as exc:
                raise CustomException("Ảnh không hợp lệ", "INVALID_IMAGE", 422) from exc

            for ing in ingredients:
                if ing.name not in unique_names:
                    unique_names.add(ing.name)
                    all_detected_ingredients.append(ing)

        ing_names_for_gemini = [i.name for i in all_detected_ingredients]
        recipe_name, english_name, instructions = ask_gemini_for_recipe(ing_names_for_gemini)

        image_url = generate_food_image_url(english_name)

        RecipeStatsService.record_recipe_scan(db, recipe_name, all_detected_ingredients, instructions, image_url)

        print(f"📤 Đã phân tích xong món '{recipe_name}', trả kết quả kèm ảnh về App!")
        return AIAnalysisResult(
            ingredients=all_detected_ingredients,
            recipeName=recipe_name,
            instructions=instructions,
            imageUrl=image_url
        )


    @staticmethod
    def chat_for_new_recipe(request: RecipeChatRequest, db: Session):
        print(f"💬 Nhận yêu cầu đổi món: '{request.user_message}' từ món '{request.current_recipe}'")

        recipe_name, english_name, instructions = ask_gemini_for_new_recipe(
            ingredients_list=request.ingredients,
            current_recipe=request.current_recipe,
            user_message=request.user_message
        )

        image_url = generate_food_image_url(english_name)
        fake_ingredients = [{"name": ing, "probability": 100} for ing in request.ingredients]

        RecipeStatsService.record_recipe_scan(db, recipe_name, fake_ingredients, instructions, image_url)

        print("📤 Đã đổi món xong, trả kết quả về App!")
        return AIAnalysisResult(
            ingredients=fake_ingredients,
            recipeName=recipe_name,
            instructions=instructions,
            imageUrl=image_url
        )


    @staticmethod
    def search_recipes_by_ingredients(request: RecipeSearchRequest, db: Session):
        print(f"🔎 Nhận yêu cầu tìm kiếm từ nguyên liệu: {request.ingredients}")

        raw_recipes = ask_gemini_for_multiple_recipes(request.ingredients)

        formatted_recipes = []
        for r in raw_recipes:
            recipe_name = r.get("recipeName", "Món ăn từ AI")
            english_name = r.get("englishName", "Delicious Vietnamese food")
            ingredients = r.get("ingredients", [])
            instructions = r.get("instructions", [])

            image_url = generate_food_image_url(english_name)
            formatted_ingredients = [Ingredient(name=name, probability=100) for name in ingredients]

            RecipeStatsService.record_recipe_scan(db, recipe_name, formatted_ingredients, instructions, image_url)

            formatted_recipes.append(
                AIAnalysisResult(
                    ingredients=formatted_ingredients,
                    recipeName=recipe_name,
                    instructions=instructions,
                    imageUrl=image_url
                )
            )

        print(f"📤 Trả về {len(formatted_recipes)} món ăn gợi ý thành công!")
        return RecipeSearchResponse(recipes=formatted_recipes)
