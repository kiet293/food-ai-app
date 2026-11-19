-- Sync columns added to ORM models after initial schema creation.
ALTER TABLE reel_comments
    ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES reel_comments (id) ON DELETE CASCADE;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS actor_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
