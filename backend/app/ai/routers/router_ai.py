from fastapi import APIRouter, UploadFile, File, Depends  # type: ignore
from typing import List
from sqlalchemy.orm import Session  # type: ignore

from app.models.database import get_db
from app.recipes.services import RecipeService
from app.recipes.schemas import AIAnalysisResult, RecipeChatRequest, RecipeSearchRequest, RecipeSearchResponse, Ingredient
from app.ai.services import (
    analyze_food_image, 
    ask_gemini_for_recipe, 
    ask_gemini_for_new_recipe,
    ask_gemini_for_multiple_recipes,
    generate_food_image_url
)

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

# 1. API PHÂN TÍCH HÌNH ẢNH MÓN ĂN (POST /api/ai/analyze)
@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_image(image_files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    all_detected_ingredients = []
    unique_names = set()
    
    for image_file in image_files:
        print(f"📥 Đang xử lý ảnh: {image_file.filename}")
        image_bytes = await image_file.read()

        ingredients = analyze_food_image(image_bytes)
        
        for ing in ingredients:
            if ing.name not in unique_names:
                unique_names.add(ing.name)
                all_detected_ingredients.append(ing)

    ing_names_for_gemini = [i.name for i in all_detected_ingredients]
    recipe_name, english_name, instructions = ask_gemini_for_recipe(ing_names_for_gemini)

    image_url = generate_food_image_url(english_name)

    RecipeService.record_recipe_scan(db, recipe_name, all_detected_ingredients, instructions, image_url)

    print(f"📤 Đã phân tích xong món '{recipe_name}', trả kết quả kèm ảnh về App!")
    return AIAnalysisResult(
        ingredients=all_detected_ingredients,
        recipeName=recipe_name,
        instructions=instructions,
        imageUrl=image_url
    )


# 2. API CHAT ĐỔI MÓN ĂN (POST /api/ai/chat)
@router.post("/chat", response_model=AIAnalysisResult)
async def chat_for_new_recipe(request: RecipeChatRequest, db: Session = Depends(get_db)):
    print(f"💬 Nhận yêu cầu đổi món: '{request.user_message}' từ món '{request.current_recipe}'")
    
    recipe_name, english_name, instructions = ask_gemini_for_new_recipe(
        ingredients_list=request.ingredients,
        current_recipe=request.current_recipe,
        user_message=request.user_message
    )

    image_url = generate_food_image_url(english_name)
    fake_ingredients = [{"name": ing, "probability": 100} for ing in request.ingredients]

    RecipeService.record_recipe_scan(db, recipe_name, fake_ingredients, instructions, image_url)

    print("📤 Đã đổi món xong, trả kết quả về App!")
    return AIAnalysisResult(
        ingredients=fake_ingredients,
        recipeName=recipe_name,
        instructions=instructions,
        imageUrl=image_url
    )


# 3. API GỢI Ý NHIỀU MÓN ĂN TỪ NGUYÊN LIỆU (POST /api/ai/search)
@router.post("/search", response_model=RecipeSearchResponse)
async def search_recipes_by_ingredients(request: RecipeSearchRequest, db: Session = Depends(get_db)):
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
        
        RecipeService.record_recipe_scan(db, recipe_name, formatted_ingredients, instructions, image_url)
        
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
