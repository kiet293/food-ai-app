from app.models.database import engine, SessionLocal
from app.models.user_model import UserDB
from app.models.recipe_model import RecipeDB, CollectionDB, CollectionRecipeDB

def seed_data():
    db = SessionLocal()
    try:
        # Create a test user if not exists
        user = db.query(UserDB).filter(UserDB.username == "test_chef").first()
        if not user:
            user = UserDB(
                username="test_chef",
                hashed_password="dummy_password_hash",
                full_name="SHARON SMITH",
                avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
                follower_count=114
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Clear existing data for this user to avoid duplicates on multiple runs
        db.query(RecipeDB).filter(RecipeDB.user_id == user.id).delete()
        db.query(CollectionDB).filter(CollectionDB.user_id == user.id).delete()
        db.commit()

        # Add some recipes
        recipes = [
            RecipeDB(user_id=user.id, recipe_name="Lemon Dijon Chicken Orzo", image_url="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=500&q=80"),
            RecipeDB(user_id=user.id, recipe_name="Parmesan Baked Pork Chops", image_url="https://images.unsplash.com/photo-1627308595229-7830b5c91f5f?w=500&q=80"),
            RecipeDB(user_id=user.id, recipe_name="Lemon Herb Chicken Bake", image_url="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&q=80"),
            RecipeDB(user_id=user.id, recipe_name="Classic Sourdough Bread", image_url="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80"),
            RecipeDB(user_id=user.id, recipe_name="Hummus and Pita", image_url="https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=500&q=80")
        ]
        db.add_all(recipes)
        db.commit()

        # Get them back to get IDs
        r1 = db.query(RecipeDB).filter(RecipeDB.recipe_name == "Lemon Dijon Chicken Orzo").first()
        r4 = db.query(RecipeDB).filter(RecipeDB.recipe_name == "Classic Sourdough Bread").first()
        r5 = db.query(RecipeDB).filter(RecipeDB.recipe_name == "Hummus and Pita").first()

        # Add collections
        c1 = CollectionDB(user_id=user.id, name="CHICKEN")
        c2 = CollectionDB(user_id=user.id, name="BREAD")
        c3 = CollectionDB(user_id=user.id, name="MIDDLE EASTERN MEALS")
        
        db.add_all([c1, c2, c3])
        db.commit()

        # Add recipes to collections
        db.add_all([
            CollectionRecipeDB(collection_id=c1.id, recipe_id=r1.id),
            CollectionRecipeDB(collection_id=c2.id, recipe_id=r4.id),
            CollectionRecipeDB(collection_id=c3.id, recipe_id=r5.id)
        ])
        db.commit()

        print(f"Seed complete. Test user ID: {user.id}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
