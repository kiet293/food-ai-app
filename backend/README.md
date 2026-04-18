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
```bash
uvicorn app.main:app --reload
```

## 5) Tat virtual environment
```bash
deactivate
```
