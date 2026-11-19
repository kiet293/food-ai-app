import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import CustomException


class PasswordTests(unittest.TestCase):
    def test_hash_verification_and_wrong_password(self):
        hashed = get_password_hash('a strong password')
        self.assertTrue(verify_password('a strong password', hashed))
        self.assertFalse(verify_password('wrong', hashed))

    def test_invalid_hash_and_long_password_fail_cleanly(self):
        self.assertFalse(verify_password('password', 'invalid-hash'))
        self.assertFalse(verify_password('x' * 73, '$2b$invalid'))
        with self.assertRaises(CustomException):
            get_password_hash('x' * 73)
