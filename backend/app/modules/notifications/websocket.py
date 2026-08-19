from fastapi import WebSocket
from typing import Dict, List

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
        print(f"🔌 WebSocket Connected to room '{recipe_id}'. Active rooms: {list(self.active_connections.keys())}")

    def disconnect(self, websocket: WebSocket, recipe_id: str):
        if recipe_id in self.active_connections:
            if websocket in self.active_connections[recipe_id]:
                self.active_connections[recipe_id].remove(websocket)
            if not self.active_connections[recipe_id]:
                del self.active_connections[recipe_id]
        print(f"❌ WebSocket Disconnected from room '{recipe_id}'. Active rooms: {list(self.active_connections.keys())}")

    async def broadcast_to_recipe(self, recipe_id: str, message: dict):
        """Phát tín hiệu tới tất cả các kết nối đang mở màn hình recipe_id"""
        print(f"📢 Broadcasting to room '{recipe_id}': {message}")
        if recipe_id in self.active_connections:
            print(f"   -> Found {len(self.active_connections[recipe_id])} active connections in room '{recipe_id}'")
            # Tạo bản sao danh sách để tránh lỗi khi phần tử bị xóa giữa chừng
            for connection in list(self.active_connections[recipe_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"WebSocket send error cho recipe {recipe_id}: {e}")
                    self.disconnect(connection, recipe_id)
        else:
            print(f"   -> Room '{recipe_id}' not found in active connections: {list(self.active_connections.keys())}")

# Tạo một instance duy nhất (Singleton pattern) để dùng chung toàn app
manager = ConnectionManager()
