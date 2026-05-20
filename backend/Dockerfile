# 1. Dùng hệ điều hành Linux siêu nhẹ có sẵn Python 3.10
FROM python:3.10-slim

# 2. Tạo một thư mục tên là /app bên trong Docker để chứa code
WORKDIR /app

# 3. Copy file thư viện vào trước và cài đặt
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# 4. Copy toàn bộ code hiện tại vào Docker
COPY . .

# 5. Khai báo cổng chạy app
EXPOSE 8000

# 6. Lệnh khởi chạy server (Có cờ --reload để hỗ trợ dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]