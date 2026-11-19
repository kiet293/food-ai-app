from io import BytesIO
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

from fastapi import UploadFile

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app.core.exceptions import CustomException
from app.modules.ai.service import AIService
from app.integrations.yolo import _get_model


class AIServiceTests(unittest.TestCase):
    def test_empty_upload_list_is_rejected_before_inference(self):
        with self.assertRaises(CustomException) as error:
            AIService.analyze_image([], MagicMock())
        self.assertEqual(error.exception.code, 'INVALID_IMAGE_COUNT')

    def test_invalid_image_is_reported_as_validation_error(self):
        with self.assertRaises(CustomException) as error:
            AIService.analyze_image([UploadFile(filename='bad.jpg', file=BytesIO(b'not an image'))], MagicMock())
        self.assertEqual(error.exception.code, 'INVALID_IMAGE')

    def test_missing_model_is_service_unavailable(self):
        _get_model.cache_clear()
        with patch('app.integrations.yolo.get_settings', return_value=MagicMock(yolo_model_path='missing-model.pt')):
            with self.assertRaises(CustomException) as error:
                _get_model()
        self.assertEqual(error.exception.status_code, 503)
        _get_model.cache_clear()
