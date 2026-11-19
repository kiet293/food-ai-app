-- Complete baseline for fresh databases. Existing nonempty databases baseline at version 0.
CREATE TABLE categories (
	id SERIAL NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	slug VARCHAR(120) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (slug)
);

CREATE TABLE recipe_stats (
	id SERIAL NOT NULL, 
	recipe_name VARCHAR, 
	scan_count INTEGER, 
	save_count INTEGER, 
	ingredients JSON, 
	instructions JSON, 
	image_url VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
);

CREATE TABLE tags (
	id SERIAL NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	slug VARCHAR(60) NOT NULL, 
	usage_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (slug)
);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	username VARCHAR, 
	hashed_password VARCHAR, 
	full_name VARCHAR, 
	avatar VARCHAR, 
	bio VARCHAR, 
	is_admin BOOLEAN, 
	follower_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
);

CREATE TABLE collections (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	cover_image VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE follows (
	id SERIAL NOT NULL, 
	follower_id INTEGER NOT NULL, 
	following_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(follower_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(following_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE notification_settings (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	follow_enabled BOOLEAN NOT NULL, 
	like_enabled BOOLEAN NOT NULL, 
	comment_enabled BOOLEAN NOT NULL, 
	rating_enabled BOOLEAN NOT NULL, 
	new_recipe_enabled BOOLEAN NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	type VARCHAR(30) NOT NULL, 
	reference_type VARCHAR(30), 
	reference_id INTEGER, 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	actor_id INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(actor_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE recipes (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	recipe_name VARCHAR, 
	ingredients JSON, 
	instructions JSON, 
	image_url VARCHAR, 
	description VARCHAR, 
	cook_time_minutes INTEGER, 
	servings INTEGER, 
	difficulty VARCHAR, 
	trending_score FLOAT, 
	is_ai BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE collection_recipes (
	id SERIAL NOT NULL, 
	collection_id INTEGER NOT NULL, 
	recipe_id INTEGER NOT NULL, 
	added_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(collection_id) REFERENCES collections (id) ON DELETE CASCADE, 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);

CREATE TABLE comments (
	id SERIAL NOT NULL, 
	recipe_id INTEGER, 
	user_id INTEGER, 
	content TEXT NOT NULL, 
	parent_comment_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(parent_comment_id) REFERENCES comments (id)
);

CREATE TABLE favorites (
	id SERIAL NOT NULL, 
	recipe_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	CONSTRAINT uq_favorite_user_recipe UNIQUE (recipe_id, user_id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE ratings (
	id SERIAL NOT NULL, 
	recipe_id INTEGER, 
	user_id INTEGER, 
	score INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	CONSTRAINT uq_rating_user_recipe UNIQUE (recipe_id, user_id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE recipe_categories (
	id SERIAL NOT NULL, 
	recipe_id INTEGER NOT NULL, 
	category_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE TABLE recipe_tags (
	recipe_id INTEGER NOT NULL, 
	tag_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (recipe_id, tag_id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id) ON DELETE CASCADE, 
	FOREIGN KEY(tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE TABLE reels (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	video_url VARCHAR NOT NULL, 
	poster_url VARCHAR, 
	caption TEXT, 
	recipe_id INTEGER, 
	view_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(recipe_id) REFERENCES recipes (id)
);

CREATE TABLE reel_comments (
	id SERIAL NOT NULL, 
	reel_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	content TEXT NOT NULL, 
	parent_comment_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(reel_id) REFERENCES reels (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(parent_comment_id) REFERENCES reel_comments (id) ON DELETE CASCADE
);

CREATE TABLE reel_likes (
	id SERIAL NOT NULL, 
	reel_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(reel_id) REFERENCES reels (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE reel_comment_likes (
	id SERIAL NOT NULL, 
	comment_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(comment_id) REFERENCES reel_comments (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_categories_id ON categories (id);
CREATE INDEX ix_recipe_stats_id ON recipe_stats (id);
CREATE UNIQUE INDEX ix_recipe_stats_recipe_name ON recipe_stats (recipe_name);
CREATE INDEX ix_tags_id ON tags (id);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_collections_id ON collections (id);
CREATE INDEX ix_collections_name ON collections (name);
CREATE INDEX ix_collections_user_id ON collections (user_id);
CREATE INDEX ix_follows_follower_id ON follows (follower_id);
CREATE INDEX ix_follows_following_id ON follows (following_id);
CREATE INDEX ix_follows_id ON follows (id);
CREATE INDEX ix_notification_settings_id ON notification_settings (id);
CREATE INDEX ix_notifications_id ON notifications (id);
CREATE INDEX ix_notifications_user_id ON notifications (user_id);
CREATE INDEX ix_recipes_id ON recipes (id);
CREATE INDEX ix_recipes_is_ai ON recipes (is_ai);
CREATE INDEX ix_recipes_recipe_name ON recipes (recipe_name);
CREATE INDEX ix_recipes_trending_score ON recipes (trending_score);
CREATE INDEX ix_collection_recipes_collection_id ON collection_recipes (collection_id);
CREATE INDEX ix_collection_recipes_id ON collection_recipes (id);
CREATE INDEX ix_collection_recipes_recipe_id ON collection_recipes (recipe_id);
CREATE INDEX ix_comments_id ON comments (id);
CREATE INDEX ix_comments_recipe_id ON comments (recipe_id);
CREATE INDEX ix_comments_user_id ON comments (user_id);
CREATE INDEX ix_favorites_id ON favorites (id);
CREATE INDEX ix_favorites_recipe_id ON favorites (recipe_id);
CREATE INDEX ix_favorites_user_id ON favorites (user_id);
CREATE INDEX ix_ratings_id ON ratings (id);
CREATE INDEX ix_ratings_recipe_id ON ratings (recipe_id);
CREATE INDEX ix_ratings_user_id ON ratings (user_id);
CREATE INDEX ix_recipe_categories_id ON recipe_categories (id);
CREATE INDEX ix_reels_id ON reels (id);
CREATE INDEX ix_reel_comments_id ON reel_comments (id);
CREATE INDEX ix_reel_likes_id ON reel_likes (id);
CREATE INDEX ix_reel_comment_likes_id ON reel_comment_likes (id);
