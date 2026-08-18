from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Lưu trữ các kết nối được nhóm theo recipe_id
        # Ví dụ: { "1": [websocket1, websocket2, ...], "2": [...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, recipe_id: str):
        await websocket.accept()
        if recipe_id not in self.active_connections:
            self.active_connections[recipe_id] = []
        self.active_connections[recipe_id].append(websocket)

    def disconnect(self, websocket: WebSocket, recipe_id: str):
        if recipe_id in self.active_connections:
            if websocket in self.active_connections[recipe_id]:
                self.active_connections[recipe_id].remove(websocket)
            if not self.active_connections[recipe_id]:
                del self.active_connections[recipe_id]

    async def broadcast_to_recipe(self, recipe_id: str, message: dict):
        """Phát tín hiệu tới tất cả các kết nối đang mở màn hình recipe_id"""
        if recipe_id in self.active_connections:
            # Tạo bản sao danh sách để tránh lỗi khi phần tử bị xóa giữa chừng
            for connection in list(self.active_connections[recipe_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"WebSocket send error cho recipe {recipe_id}: {e}")
                    self.disconnect(connection, recipe_id)

# Tạo một instance duy nhất (Singleton pattern) để dùng chung toàn app
manager = ConnectionManager()
