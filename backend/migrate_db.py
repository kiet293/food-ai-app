import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    try:
        # Add trending_score column to recipes if it doesn't exist
        conn.execute(text("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0.0;"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_recipes_trending_score ON recipes (trending_score);"))
        print("Added trending_score to recipes.")
        
        # Add unique constraints (Ignore if they already exist)
        try:
            conn.execute(text("ALTER TABLE ratings ADD CONSTRAINT uq_rating_user_recipe UNIQUE (recipe_id, user_id);"))
            print("Added uq_rating_user_recipe to ratings.")
        except Exception as e:
            print(f"Constraint uq_rating_user_recipe might already exist")
            
        try:
            conn.execute(text("ALTER TABLE favorites ADD CONSTRAINT uq_favorite_user_recipe UNIQUE (recipe_id, user_id);"))
            print("Added uq_favorite_user_recipe to favorites.")
        except Exception as e:
            print(f"Constraint uq_favorite_user_recipe might already exist")
            
        try:
            conn.execute(text("ALTER TABLE collection_recipes ADD CONSTRAINT uq_collection_recipe UNIQUE (collection_id, recipe_id);"))
            print("Added uq_collection_recipe to collection_recipes.")
        except Exception as e:
            print(f"Constraint uq_collection_recipe might already exist")
            
        # Add indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ratings_recipe_id ON ratings (recipe_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ratings_user_id ON ratings (user_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_comments_recipe_id ON comments (recipe_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_comments_user_id ON comments (user_id);"))
        print("Added missing indexes.")
        
        conn.commit()
        print("Database migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {e}")
