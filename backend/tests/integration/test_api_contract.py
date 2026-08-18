import sys
import unittest
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))


class ApiContractTests(unittest.TestCase):
    def test_public_http_routes_are_registered(self):
        from app.main import app

        paths = set(app.openapi()["paths"])
        expected = {
            "/api/auth/login",
            "/api/auth/register",
            "/api/ai/analyze",
            "/api/recipes",
            "/api/recipes/trending",
            "/api/recipes/{recipe_id}",
            "/api/recipes/{recipe_id}/comments",
            "/api/recipes/{recipe_id}/favorite",
            "/api/comments/{comment_id}",
            "/api/tags/hot",
            "/api/reels",
            "/api/collections",
            "/api/notifications",
            "/api/search/recipes",
            "/api/users/{user_id}/profile",
        }
        self.assertTrue(expected.issubset(paths), expected - paths)


if __name__ == "__main__":
    unittest.main()
