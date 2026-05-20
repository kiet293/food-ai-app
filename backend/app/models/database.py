from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:123456@localhost:5432/food_app_db" # Dữ liệu dự phòng
    )

# Khởi tạo động cơ kết nối
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo các phiên làm việc (Session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lớp Base để các Model khác kế thừa
Base = declarative_base()

# Hàm lấy Database Session cho từng API (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()