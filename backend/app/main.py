from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio

app = FastAPI(title="Food AI Backend")

# Cho phép app điện thoại gọi tới Server mà không bị chặn lỗi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Định nghĩa cấu trúc giống hệt interface bên React Native
class Ingredient(BaseModel):
    name: str
    probability: int

class AIAnalysisResult(BaseModel):
    ingredients: List[Ingredient]
    recipeName: str
    instructions: List[str]

# 2. Tạo API nhận ảnh và trả về kết quả
@app.post("/api/analyze", response_model=AIAnalysisResult)
async def analyze_image(image_file: UploadFile = File(...)):
    
    # Tại đây, bạn có thể in ra tên file để kiểm tra
    print(f"Đã nhận được ảnh từ App: {image_file.filename}")
    
    # Giả lập thời gian AI chạy (3 giây) - Sau này bạn thay bằng code model AI thật
    await asyncio.sleep(3)
    
    # 3. Trả về đúng cấu trúc JSON
    return AIAnalysisResult(
        ingredients=[
            Ingredient(name="Cà chua", probability=98),
            Ingredient(name="Trứng gà", probability=95)
        ],
        recipeName="Canh Cà Chua Trứng (Từ Server Thật)",
        instructions=[
            "1. Server đã nhận được ảnh thành công!",
            "2. Rửa sạch cà chua, thái múi cau.",
            "3. Đánh tan trứng gà ra bát.",
            "4. Phi thơm hành tím, xào cà chua.",
            "5. Đổ nước, thêm trứng và khuấy đều."
        ]
    )