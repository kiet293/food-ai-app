from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ai_route

app = FastAPI(title="Food AI Backend")

# Xử lý CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký nhóm API từ thư mục routes vào đường dẫn gốc /api
app.include_router(ai_route.router, prefix="/api", tags=["AI Analysis"])

# Một API nhỏ để kiểm tra xem Server có đang sống không
@app.get("/")
def read_root():
    return {"message": "Server Food AI cấu trúc mới đang chạy ngon lành!"}