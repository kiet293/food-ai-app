# Food AI Backend - Setup

## 1) Clone du an
```bash
git clone <REPO_URL>
cd backend
```

## 2) Tao virtual environment
### Windows (PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Neu bi chan script khi activate:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
```

### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

## 3) Cai dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 4) Chay server

Copy `.env.example` to `.env` and set the database credentials and API keys.
Initialize or upgrade the database before starting the server:

```bash
docker compose up -d db
docker compose --profile tools run --rm flyway
```

```bash
uvicorn app.main:app --reload
```

Run scheduled trending updates in a second terminal with `python -m app.workers`,
or start the container stack with `docker compose --profile workers up -d api scheduler`.
The API no longer creates tables or starts the scheduler by default.
To import Pexels videos explicitly, set `PEXELS_API_KEY` and run
`python -m app.workers sync-pexels`.

## 5) Tat virtual environment
```bash
deactivate
```
lệnh chạy server:
# Quan trọng: Phải chạy với host 0.0.0.0 để cho phép kết nối từ bên ngoài
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000

## Cấu trúc backend

Kiến trúc và quy tắc phụ thuộc được mô tả trong [ARCHITECTURE.md](ARCHITECTURE.md).
`app/main.py` chỉ là ASGI entry point; cấu hình ứng dụng nằm trong
`app/application.py`, router được đăng ký tại `app/api/router.py`, và các dịch
vụ bên ngoài nằm trong `app/integrations/`.

## Chạy test

```powershell
python -m unittest discover -s tests -v
```

## Migration

Migration mới được đặt tại `migrations/` và chạy bằng Flyway:

```powershell
docker compose --profile tools run --rm flyway
```
