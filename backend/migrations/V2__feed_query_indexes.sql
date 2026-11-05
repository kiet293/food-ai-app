-- Support paginated feeds, profile lookups and batched interaction counts.
CREATE INDEX IF NOT EXISTS ix_recipes_user_created ON recipes (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_recipes_public_feed ON recipes (is_ai, id DESC);
CREATE INDEX IF NOT EXISTS ix_reels_user_created ON reels (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_reel_likes_reel_user ON reel_likes (reel_id, user_id);
CREATE INDEX IF NOT EXISTS ix_reel_likes_user_created ON reel_likes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_reel_comments_reel_created ON reel_comments (reel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_recipe_tags_tag_recipe ON recipe_tags (tag_id, recipe_id);
CREATE INDEX IF NOT EXISTS ix_collection_recipes_collection_added ON collection_recipes (collection_id, added_at DESC);
CREATE INDEX IF NOT EXISTS ix_notifications_user_created ON notifications (user_id, created_at DESC);
