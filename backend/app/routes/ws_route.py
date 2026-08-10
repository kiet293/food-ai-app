from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.ws_manager import manager

router = APIRouter()

@router.websocket("/ws/recipes/{recipe_id}")
async def websocket_endpoint(websocket: WebSocket, recipe_id: str):
    await manager.connect(websocket, recipe_id)
    try:
        while True:
            # Giữ kết nối mở, chờ nhận dữ liệu từ client nếu có
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, recipe_id)

@router.websocket("/ws/feed")
async def feed_websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "GLOBAL_FEED")
    try:
        while True:
            # Giữ kết nối mở
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "GLOBAL_FEED")

@router.websocket("/ws/notifications/{user_id}")
async def notifications_websocket_endpoint(websocket: WebSocket, user_id: int):
    room_id = f"USER_NOTIFY_{user_id}"
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
