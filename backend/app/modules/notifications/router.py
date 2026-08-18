from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import List

from app.api.dependencies import get_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.notifications.schema import NotificationSettingsUpdate
from app.modules.notifications.service import NotificationService
from app.modules.notifications.websocket import manager
from app.modules.users.model import UserDB

router = APIRouter(tags=["WebSockets & Notifications"])

# 1. WS RECIPE DETAIL CONNECTION
@router.websocket("/ws/recipes/{recipe_id}")
async def websocket_endpoint(websocket: WebSocket, recipe_id: str):
    await manager.connect(websocket, recipe_id)
    try:
        while True:
            # Giữ kết nối mở, chờ nhận dữ liệu từ client nếu có
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, recipe_id)


# 2. WS GLOBAL FEED CONNECTION
@router.websocket("/ws/feed")
async def feed_websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "GLOBAL_FEED")
    try:
        while True:
            # Giữ kết nối mở
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "GLOBAL_FEED")


# 3. WS USER NOTIFICATION CONNECTION
@router.websocket("/ws/notifications/{user_id}")
async def notifications_websocket_endpoint(websocket: WebSocket, user_id: int):
    room_id = f"USER_NOTIFY_{user_id}"
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)


# 4. REST API: LẤY DANH SÁCH THÔNG BÁO (GET /api/notifications)
@router.get("/api/notifications")
def get_user_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = NotificationService.get_user_notifications(db=db, user_id=current_user.id, limit=limit)
    return success_response(data=data, message="Lấy danh sách thông báo thành công")


# 5. REST API: ĐÁNH DẤU THÔNG BÁO ĐÃ ĐỌC (PUT /api/notifications/{id}/read)
@router.put("/api/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    NotificationService.mark_as_read(db=db, notification_id=notification_id, user_id=current_user.id)
    return success_response(message="Đã đánh dấu thông báo đã đọc")


# 6. REST API: LẤY CÀI ĐẶT THÔNG BÁO (GET /api/notifications/settings)
@router.get("/api/notifications/settings")
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = NotificationService.get_settings(db=db, user_id=current_user.id)
    return success_response(data=data, message="Lấy cấu hình thông báo thành công")


# 7. REST API: CẬP NHẬT CÀI ĐẶT THÔNG BÁO (PUT /api/notifications/settings)
@router.put("/api/notifications/settings")
def update_notification_settings(
    settings_in: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    data = NotificationService.update_settings(db=db, user_id=current_user.id, settings_in=settings_in)
    return success_response(data=data, message="Cập nhật cấu hình thông báo thành công")
