from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ai_route, recipe_route
from app.models import database, recipe_model

app = FastAPI(title="Food AI Backend")

# Tự động tạo bảng trong PostgreSQL nếu chưa có
recipe_model.Base.metadata.create_all(bind=database.engine)

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
app.include_router(recipe_route.router, prefix="/api/recipes", tags=["Recipe Management"])

# Một API nhỏ để kiểm tra xem Server có đang sống không
@app.get("/")
def read_root():
    return {"message": "Server đang chạy cùng Database PostgreSQL!"}