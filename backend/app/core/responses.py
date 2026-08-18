from datetime import datetime, timezone
from typing import Any


def success_response(data: Any = None, message: str = "Thành công") -> dict[str, Any]:
    return {
        "status": "success",
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
