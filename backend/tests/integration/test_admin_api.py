import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import app.modules.collections.model  # noqa: F401
import app.modules.notifications.model  # noqa: F401
import app.modules.recipes.model  # noqa: F401
import app.modules.reels.model  # noqa: F401
import app.modules.users.model  # noqa: F401

from app.application import create_app
from app.core.security import create_access_token
from app.db import get_db
from app.db.base import Base
from app.modules.collections.model import CollectionDB, CollectionRecipeDB
from app.modules.recipes.model import (
    CategoryDB,
    CommentDB,
    FavoriteDB,
    RatingDB,
    RecipeCategoryDB,
    RecipeDB,
    RecipeStatsDB,
    RecipeTagDB,
    TagDB,
)
from app.modules.reels.model import ReelCommentDB, ReelDB, ReelLikeDB
from app.modules.users.model import UserDB


class AdminApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

        self.admin = UserDB(
            username="admin_user",
            hashed_password="unused",
            full_name="Super Admin",
            is_admin=True,
        )
        self.regular = UserDB(
            username="normal_user",
            hashed_password="unused",
            full_name="Normal User",
            is_admin=False,
        )
        self.db.add_all([self.admin, self.regular])
        self.db.commit()

        self.app = create_app()

        def override_get_db():
            yield self.db

        self.app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(self.app)

        self.admin_headers = {
            "Authorization": f"Bearer {create_access_token({'sub': str(self.admin.id)})}"
        }
        self.user_headers = {
            "Authorization": f"Bearer {create_access_token({'sub': str(self.regular.id)})}"
        }

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.db.close()
        self.engine.dispose()

    def test_admin_endpoints_reject_unauthenticated_and_non_admin(self):
        res_unauth = self.client.get("/api/admin/dashboard")
        self.assertEqual(res_unauth.status_code, 401)

        res_forbidden = self.client.get("/api/admin/dashboard", headers=self.user_headers)
        self.assertEqual(res_forbidden.status_code, 403)

        res_me = self.client.get("/api/admin/me", headers=self.admin_headers)
        self.assertEqual(res_me.status_code, 200)
        self.assertTrue(res_me.json()["data"]["is_admin"])

    def test_dashboard_aggregates_counts_and_top_lists(self):
        r1 = RecipeDB(
            user_id=self.regular.id,
            recipe_name="Phở Bò",
            trending_score=99.5,
            is_ai=False,
        )
        r2 = RecipeDB(
            user_id=self.regular.id,
            recipe_name="Trứng Chiên AI",
            trending_score=10.0,
            is_ai=True,
        )
        reel = ReelDB(
            user_id=self.regular.id,
            video_url="https://video.test/1.mp4",
            caption="Nấu phở",
            view_count=42,
        )
        stats = RecipeStatsDB(recipe_name="Phở Bò", scan_count=7, save_count=3)
        self.db.add_all([r1, r2, reel, stats])
        self.db.commit()

        res = self.client.get("/api/admin/dashboard?days=7", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["summary"]["total_users"], 2)
        self.assertEqual(data["summary"]["total_admins"], 1)
        self.assertEqual(data["summary"]["total_recipes"], 2)
        self.assertEqual(data["summary"]["ai_recipes"], 1)
        self.assertEqual(data["summary"]["community_recipes"], 1)
        self.assertEqual(data["summary"]["total_reels"], 1)
        self.assertEqual(data["summary"]["total_reel_views"], 42)
        self.assertEqual(data["summary"]["total_ai_scans"], 7)
        self.assertEqual(len(data["growth_series"]), 7)
        self.assertEqual(data["top_trending"][0]["recipe_name"], "Phở Bò")
        self.assertEqual(data["top_ai_dishes"][0]["recipe_name"], "Phở Bò")

    def test_user_management_guards_self_and_deletes_cleanly(self):
        # Cannot self-demote or self-delete
        res_demote = self.client.patch(
            f"/api/admin/users/{self.admin.id}",
            json={"is_admin": False},
            headers=self.admin_headers,
        )
        self.assertEqual(res_demote.status_code, 400)

        res_del_self = self.client.delete(
            f"/api/admin/users/{self.admin.id}", headers=self.admin_headers
        )
        self.assertEqual(res_del_self.status_code, 400)

        # Promote regular user
        res_promote = self.client.patch(
            f"/api/admin/users/{self.regular.id}",
            json={"is_admin": True, "full_name": "Chef Pro"},
            headers=self.admin_headers,
        )
        self.assertEqual(res_promote.status_code, 200)
        self.assertTrue(res_promote.json()["data"]["is_admin"])
        self.assertEqual(res_promote.json()["data"]["full_name"], "Chef Pro")

        # Attach recipe, reel, collection and delete regular user
        recipe = RecipeDB(
            user_id=self.regular.id,
            recipe_name="Bún Bò",
            image_url="https://res.cloudinary.com/demo/image/upload/v1/bun.jpg",
        )
        self.db.add(recipe)
        self.db.flush()
        reel = ReelDB(
            user_id=self.regular.id,
            video_url="https://video.test/bun.mp4",
            recipe_id=recipe.id,
        )
        col = CollectionDB(user_id=self.regular.id, name="Món ngon")
        self.db.add_all([reel, col])
        self.db.flush()
        self.db.add(CollectionRecipeDB(collection_id=col.id, recipe_id=recipe.id))
        self.db.commit()

        with patch("app.modules.admin.service.delete_image_url") as cleanup:
            res_del = self.client.delete(
                f"/api/admin/users/{self.regular.id}", headers=self.admin_headers
            )
            self.assertEqual(res_del.status_code, 200)
            cleanup.assert_any_call(
                "https://res.cloudinary.com/demo/image/upload/v1/bun.jpg"
            )

        self.assertIsNone(self.db.get(UserDB, self.regular.id))
        self.assertEqual(self.db.query(RecipeDB).count(), 0)
        self.assertEqual(self.db.query(ReelDB).count(), 0)

    def test_recipe_update_and_delete_unlinks_reels_and_updates_tag_count(self):
        tag = TagDB(name="Món Việt", slug="mon-viet", usage_count=1)
        recipe = RecipeDB(
            user_id=self.regular.id,
            recipe_name="Cơm Tấm",
            image_url="https://res.cloudinary.com/demo/image/upload/v1/com.jpg",
            difficulty="Dễ",
        )
        self.db.add_all([tag, recipe])
        self.db.flush()
        self.db.add(RecipeTagDB(recipe_id=recipe.id, tag_id=tag.id))
        reel = ReelDB(
            user_id=self.admin.id,
            video_url="https://video.test/com.mp4",
            recipe_id=recipe.id,
        )
        parent_comment = CommentDB(
            recipe_id=recipe.id, user_id=self.regular.id, content="Ngon quá"
        )
        self.db.add_all([reel, parent_comment])
        self.db.flush()
        self.db.add(
            CommentDB(
                recipe_id=recipe.id,
                user_id=self.admin.id,
                content="Cảm ơn!",
                parent_comment_id=parent_comment.id,
            )
        )
        self.db.add(FavoriteDB(recipe_id=recipe.id, user_id=self.admin.id))
        self.db.add(RatingDB(recipe_id=recipe.id, user_id=self.admin.id, score=5))
        self.db.commit()

        # Patch recipe
        res_patch = self.client.patch(
            f"/api/admin/recipes/{recipe.id}",
            json={"recipe_name": "Cơm Tấm Sườn Bì", "cook_time_minutes": 35},
            headers=self.admin_headers,
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["data"]["recipe_name"], "Cơm Tấm Sườn Bì")

        # Delete recipe
        with patch("app.modules.admin.service.delete_image_url") as cleanup:
            res_del = self.client.delete(
                f"/api/admin/recipes/{recipe.id}", headers=self.admin_headers
            )
            self.assertEqual(res_del.status_code, 200)
            cleanup.assert_called_once_with(
                "https://res.cloudinary.com/demo/image/upload/v1/com.jpg"
            )

        self.db.expire_all()
        self.assertIsNone(self.db.get(RecipeDB, recipe.id))
        self.assertIsNone(self.db.get(ReelDB, reel.id).recipe_id)
        self.assertEqual(self.db.get(TagDB, tag.id).usage_count, 0)
        self.assertEqual(self.db.query(CommentDB).count(), 0)

    def test_categories_tags_comments_and_jobs(self):
        # Categories CRUD
        res_cat = self.client.post(
            "/api/admin/categories",
            json={"name": "Món Nướng"},
            headers=self.admin_headers,
        )
        self.assertEqual(res_cat.status_code, 200)
        cat_id = res_cat.json()["data"]["id"]
        self.assertEqual(res_cat.json()["data"]["slug"], "mon-nuong")

        res_dup = self.client.post(
            "/api/admin/categories",
            json={"name": "Món Nướng"},
            headers=self.admin_headers,
        )
        self.assertEqual(res_dup.status_code, 409)

        res_cat_upd = self.client.patch(
            f"/api/admin/categories/{cat_id}",
            json={"name": "Món Nướng BBQ"},
            headers=self.admin_headers,
        )
        self.assertEqual(res_cat_upd.status_code, 200)
        self.assertEqual(res_cat_upd.json()["data"]["slug"], "mon-nuong-bbq")

        res_cat_del = self.client.delete(
            f"/api/admin/categories/{cat_id}", headers=self.admin_headers
        )
        self.assertEqual(res_cat_del.status_code, 200)

        # Comments moderation (reel)
        reel = ReelDB(user_id=self.regular.id, video_url="https://video.test/r.mp4")
        self.db.add(reel)
        self.db.flush()
        rc = ReelCommentDB(reel_id=reel.id, user_id=self.regular.id, content="Spam link")
        self.db.add(rc)
        self.db.add(ReelLikeDB(reel_id=reel.id, user_id=self.regular.id))
        self.db.commit()

        res_comments = self.client.get(
            "/api/admin/comments?kind=reel&search=Spam", headers=self.admin_headers
        )
        self.assertEqual(res_comments.status_code, 200)
        self.assertEqual(len(res_comments.json()["data"]["items"]), 1)

        res_del_c = self.client.delete(
            f"/api/admin/comments/reel/{rc.id}", headers=self.admin_headers
        )
        self.assertEqual(res_del_c.status_code, 200)
        self.assertEqual(self.db.query(ReelCommentDB).count(), 0)

        # Jobs triggers
        with patch("app.modules.admin.service.calculate_trending_scores") as mock_trend:
            res_trend = self.client.post(
                "/api/admin/jobs/recalculate-trending", headers=self.admin_headers
            )
            self.assertEqual(res_trend.status_code, 200)
            mock_trend.assert_called_once()

        with patch(
            "app.modules.admin.service.PexelsService.sync_pexels_cooking_videos"
        ) as mock_pexels:
            res_pexels = self.client.post(
                "/api/admin/jobs/sync-pexels", headers=self.admin_headers
            )
            self.assertEqual(res_pexels.status_code, 200)
            if self.db.query(ReelDB).count() < 15:
                # Called when PEXELS_API_KEY is configured in .env
                self.assertIn("after_count", res_pexels.json()["data"])
            _ = mock_pexels


if __name__ == "__main__":
    unittest.main()
