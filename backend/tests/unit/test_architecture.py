import sys
import unittest
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))


class ModuleStructureTests(unittest.TestCase):
    def test_domain_models_share_the_database_base(self):
        from app.db import Base
        from app.modules.collections.model import CollectionDB
        from app.modules.notifications.model import NotificationDB
        from app.modules.recipes.model import RecipeDB
        from app.modules.reels.model import ReelDB
        from app.modules.users.model import UserDB

        for model in (CollectionDB, NotificationDB, RecipeDB, ReelDB, UserDB):
            self.assertIs(model.metadata, Base.metadata)

    def test_old_domain_source_packages_are_removed(self):
        for package in (
            "users", "recipes", "collections", "reels", "notifications",
            "search", "ai", "models", "utils", "tasks",
        ):
            self.assertFalse((BACKEND_ROOT / "app" / package / "__init__.py").exists())


if __name__ == "__main__":
    unittest.main()
