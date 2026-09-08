-- Idempotent updates previously spread across migrate_db.py and run_migration.py.
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_image VARCHAR;
ALTER TABLE collection_recipes
    ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_recipes_trending_score ON recipes (trending_score);
CREATE INDEX IF NOT EXISTS ix_recipes_is_ai ON recipes (is_ai);
CREATE INDEX IF NOT EXISTS ix_ratings_recipe_id ON ratings (recipe_id);
CREATE INDEX IF NOT EXISTS ix_ratings_user_id ON ratings (user_id);
CREATE INDEX IF NOT EXISTS ix_comments_recipe_id ON comments (recipe_id);
CREATE INDEX IF NOT EXISTS ix_comments_user_id ON comments (user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_rating_user_recipe'
    ) THEN
        ALTER TABLE ratings ADD CONSTRAINT uq_rating_user_recipe
            UNIQUE (recipe_id, user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_favorite_user_recipe'
    ) THEN
        ALTER TABLE favorites ADD CONSTRAINT uq_favorite_user_recipe
            UNIQUE (recipe_id, user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_collection_recipe'
    ) THEN
        ALTER TABLE collection_recipes ADD CONSTRAINT uq_collection_recipe
            UNIQUE (collection_id, recipe_id);
    END IF;
END $$;
