import cloudinary
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime, timezone
from app.utils.response import CustomException
from fastapi.middleware.cors import CORSMiddleware
from app.models import database
from app.reels.models import models_reel as reel_model
from app.users.models import models_user as user_model
from app.recipes.models import models_recipe as recipe_model
from app.collections.models import models_collection as collection_model
from app.notifications.models import models_notification as notification_model
from app.reels.routers import router as reel_router
from app.users.routers import router_auth, router_user
from app.recipes.routers import router as recipe_router, comment_router as recipe_comment_router
from app.collections.routers import router as collection_router
from app.ai.routers import router as ai_router
from app.search.routers import router as search_router
from app.notifications.routers import router as notification_router
from app.tasks.trending_task import trending_scheduler_task
import asyncio
from dotenv import load_dotenv
import os
app = FastAPI(title="Food AI Backend")
load_dotenv()
# Tự động tạo bảng trong PostgreSQL nếu chưa có
database.Base.metadata.create_all(bind=database.engine)

@app.on_event("startup")
async def startup_event():
    # Khởi động Task ngầm cập nhật Trending Score
    asyncio.create_task(trending_scheduler_task())

# Xử lý CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký nhóm API từ thư mục routes vào đường dẫn gốc /api
app.include_router(router_auth, prefix="/api/auth", tags=["Authentication"]) # <--- Đăng ký API
app.include_router(ai_router, prefix="/api", tags=["AI Analysis"])
app.include_router(recipe_router, prefix="/api/recipes", tags=["Recipe Management"])
app.include_router(recipe_comment_router, prefix="/api")
app.include_router(search_router, prefix="/api/search", tags=["Search API"])
app.include_router(reel_router, prefix="/api/reels", tags=["Reels Management"])
app.include_router(router_user, prefix="/api/users", tags=["User Management"])
app.include_router(collection_router, prefix="/api/collections", tags=["Collection Management"])
app.include_router(notification_router)

# Khai báo cấu hình Cloudinary trong quá trình khởi động ứng dụng
cloudinary.config(
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key = os.getenv("CLOUDINARY_API_KEY"),
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

# Một API nhỏ để kiểm tra xem Server có đang sống không (reload)
@app.get("/")
def read_root():
    return {"message": "Server đang chạy cùng Database PostgreSQL!"}

# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "code": exc.code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": str(exc.detail),
            "code": f"HTTP_{exc.status_code}_ERROR",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        if "input" in err and isinstance(err["input"], bytes):
            err = dict(err)
            err["input"] = err["input"].decode("utf-8", errors="ignore")
        errors.append(err)
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Dữ liệu đầu vào không hợp lệ",
            "code": "VALIDATION_ERROR",
            "data": errors,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
    )