from app.models.database import engine
from sqlalchemy import text
import sys

try:
    with engine.connect() as con:
        con.execute(text("ALTER TABLE public.users ADD COLUMN follower_count integer NOT NULL DEFAULT 0;"))
        con.commit()
    print("Migration successful")
except Exception as e:
    if "already exists" in str(e).lower():
        print("Column already exists. Skipping.")
    else:
        print(f"Error: {e}")
        sys.exit(1)
