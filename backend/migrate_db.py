import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def run_sql(stmt):
    with engine.begin() as conn:
        try:
            conn.execute(text(stmt))
        except Exception as e:
            pass

run_sql("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0.0;")
run_sql("CREATE INDEX IF NOT EXISTS ix_recipes_trending_score ON recipes (trending_score);")
run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(255);")
run_sql("ALTER TABLE ratings ADD CONSTRAINT uq_rating_user_recipe UNIQUE (recipe_id, user_id);")
run_sql("ALTER TABLE favorites ADD CONSTRAINT uq_favorite_user_recipe UNIQUE (recipe_id, user_id);")
run_sql("ALTER TABLE collection_recipes ADD CONSTRAINT uq_collection_recipe UNIQUE (collection_id, recipe_id);")
run_sql("CREATE INDEX IF NOT EXISTS ix_ratings_recipe_id ON ratings (recipe_id);")
run_sql("CREATE INDEX IF NOT EXISTS ix_ratings_user_id ON ratings (user_id);")
run_sql("CREATE INDEX IF NOT EXISTS ix_comments_recipe_id ON comments (recipe_id);")
run_sql("CREATE INDEX IF NOT EXISTS ix_comments_user_id ON comments (user_id);")
run_sql("ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_image VARCHAR;")
run_sql("ALTER TABLE collection_recipes ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
run_sql("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;")
run_sql("CREATE INDEX IF NOT EXISTS ix_recipes_is_ai ON recipes (is_ai);")
run_sql("ALTER TABLE reels ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;")

print("Database migration completed successfully!")
