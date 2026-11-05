import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import app.modules.users.model
import app.modules.recipes.model
import app.modules.collections.model
import app.modules.reels.model
import app.modules.notifications.model
from app.db.base import Base
from app.modules.users.model import UserDB, FollowDB
from app.modules.recipes.model import RecipeDB, RatingDB, FavoriteDB, CommentDB, RecipeTagDB, RecipeStatsDB
from app.modules.collections.model import CollectionDB, CollectionRecipeDB
from app.modules.reels.model import ReelDB, ReelLikeDB, ReelCommentDB
from app.modules.recipes.services.write_service import RecipeWriteService
from app.modules.recipes.services.catalog_service import RecipeCatalogService
from app.modules.recipes.services.presenter import format_recipe_summaries
from app.modules.recipes.services.stats_service import RecipeStatsService
from app.modules.reels.service import ReelService
from app.modules.recipes.schemas import AIAnalysisResult


class RecipeUseCaseTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)
        self.user = UserDB(username='chef', hashed_password='unused')
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def create_recipe(self, **overrides):
        args = dict(db=self.db, current_user=self.user, recipe_name='Soup', description=None,
                    ingredients='[]', instructions='[]', cook_time_minutes=10, servings=2,
                    difficulty=None, category_name=None, tags=None, image=None)
        args.update(overrides)
        return RecipeWriteService.create_new_recipe(**args)

    def test_recipe_and_tags_rollback_together(self):
        def fail_on_tag(session, *_):
            if any(isinstance(item, RecipeTagDB) for item in session.new):
                raise RuntimeError('simulated association write failure')
        event.listen(self.db, 'before_flush', fail_on_tag)
        with self.assertRaises(Exception):
            self.create_recipe(tags='["soup"]')
        self.assertEqual(self.db.query(RecipeDB).count(), 0)

    def test_invalid_tags_do_not_create_recipe_or_upload(self):
        with patch('app.modules.recipes.services.support.RecipeSupport.upload_image_to_cloudinary') as upload:
            with self.assertRaises(Exception):
                self.create_recipe(tags='{"invalid": true}', image=object())
            upload.assert_not_called()
        self.assertEqual(self.db.query(RecipeDB).count(), 0)

    def test_duplicate_tags_are_deduplicated(self):
        self.create_recipe(tags='["Soup", "soup", "Soup"]')
        self.assertEqual(self.db.query(RecipeTagDB).count(), 1)

    def test_notebook_stats_failure_rolls_back_recipe_and_collection(self):
        data = AIAnalysisResult(recipeName='AI soup', ingredients=[], instructions=[], imageUrl='')
        with patch.object(RecipeStatsService, 'record_recipe_save', side_effect=RuntimeError('stats failed')):
            with self.assertRaises(Exception):
                RecipeCatalogService.save_recipe_to_notebook(self.db, self.user, data)
        self.assertEqual(self.db.query(RecipeDB).count(), 0)
        self.assertEqual(self.db.query(CollectionDB).count(), 0)

    def test_summary_query_count_does_not_grow_per_recipe(self):
        recipes = [RecipeDB(user_id=self.user.id, recipe_name=f'Recipe {i}') for i in range(20)]
        self.db.add_all(recipes)
        self.db.flush()
        recipe = recipes[0]
        self.db.add_all([
            RatingDB(recipe_id=recipe.id, user_id=self.user.id, score=4),
            FavoriteDB(recipe_id=recipe.id, user_id=self.user.id),
            CommentDB(recipe_id=recipe.id, user_id=self.user.id, content='Nice'),
        ])
        self.db.commit()
        queries = []
        def record(*args):
            queries.append(args[2])
        event.listen(self.engine, 'before_cursor_execute', record)
        one = format_recipe_summaries(self.db, recipes[:1], self.user)
        count_one = len(queries)
        queries.clear()
        many = format_recipe_summaries(self.db, recipes, self.user)
        self.assertEqual(len(queries), count_one)
        self.assertEqual(len(many), 20)
        self.assertEqual(one[0]['ratings_avg'], 4)
        self.assertEqual(one[0]['comments_count'], 1)
        self.assertTrue(one[0]['is_favorited'])

    def test_reels_paginate_with_aggregated_counts(self):
        reels = [ReelDB(user_id=self.user.id, video_url=f'https://video/{i}') for i in range(3)]
        self.db.add_all(reels)
        self.db.flush()
        self.db.add(ReelLikeDB(reel_id=reels[0].id, user_id=self.user.id))
        self.db.commit()
        with patch('app.modules.reels.service.PexelsService.sync_pexels_cooking_videos') as sync:
            first = ReelService.get_reels_list(self.db, self.user, 1, 2)
            second = ReelService.get_reels_list(self.db, self.user, 2, 2)
            sync.assert_not_called()
        self.assertEqual(len(first), 2)
        self.assertEqual(len(second), 1)
        self.assertEqual(len({item['db_id'] for item in first + second}), 3)
        self.assertEqual(second[0]['likesCount'], 1)
        self.assertTrue(second[0]['isLiked'])

    def test_atomic_stats_increment_preserves_both_counters(self):
        RecipeStatsService.record_recipe_scan(self.db, 'Soup', [], [], '')
        RecipeStatsService.record_recipe_scan(self.db, 'Soup', [], [], '')
        RecipeStatsService.record_recipe_save(self.db, 'Soup', [], [], '')
        stats = self.db.query(RecipeStatsDB).one()
        self.assertEqual((stats.scan_count, stats.save_count), (2, 1))

    def test_update_failure_keeps_old_image_and_cleans_new_upload(self):
        recipe_id = self.create_recipe()['recipe_id']
        recipe = self.db.get(RecipeDB, recipe_id)
        recipe.image_url = 'https://old-image'
        self.db.commit()
        args = dict(db=self.db, recipe_id=recipe_id, current_user=self.user,
                    recipe_name=None, description=None, ingredients=None, instructions=None,
                    cook_time_minutes=None, servings=None, difficulty=None,
                    category_name=None, tags=None, image=object())
        with patch('app.modules.recipes.services.support.RecipeSupport.upload_image_to_cloudinary', return_value='https://new-image'), \
             patch('app.modules.recipes.services.support.RecipeSupport.delete_image_from_cloudinary') as cleanup, \
             patch.object(self.db, 'commit', side_effect=RuntimeError('commit failed')):
            with self.assertRaises(Exception):
                RecipeWriteService.update_recipe(**args)
            cleanup.assert_called_once_with('https://new-image')
        self.assertEqual(self.db.get(RecipeDB, recipe_id).image_url, 'https://old-image')

    def test_single_reel_lookup_finds_items_outside_first_page(self):
        reels = [ReelDB(user_id=self.user.id, video_url=f'https://video/{i}') for i in range(25)]
        self.db.add_all(reels)
        self.db.commit()
        result = ReelService.get_reels_list(self.db, self.user, reel_id=reels[0].id)
        self.assertEqual([item['db_id'] for item in result], [reels[0].id])

    def test_registration_token_failure_rolls_back_account(self):
        from app.modules.users.auth_service import AuthService
        from app.modules.users.schema import UserCreate
        with patch('app.modules.users.auth_service.create_access_token', side_effect=RuntimeError('no key')):
            with self.assertRaises(RuntimeError):
                AuthService.register(self.db, UserCreate(username='new-user', password='password'))
        self.assertIsNone(self.db.query(UserDB).filter_by(username='new-user').first())


if __name__ == '__main__':
    unittest.main()
