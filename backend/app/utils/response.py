from datetime import datetime, timezone
from typing import Any

def success_response(data: Any = None, message: str = "Thành công"):
    return {
        "status": "success",
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

class CustomException(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
