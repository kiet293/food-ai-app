"""CLI utility to manage admin accounts.

Usage:
    python -m app.modules.admin.cli grant <username>
    python -m app.modules.admin.cli revoke <username>
    python -m app.modules.admin.cli create <username> <password> [--name "Admin"]
    python -m app.modules.admin.cli list
"""
import argparse
import sys

# Ensure all ORM models are registered before querying.
import app.modules.collections.model  # noqa: F401
import app.modules.notifications.model  # noqa: F401
import app.modules.recipes.model  # noqa: F401
import app.modules.reels.model  # noqa: F401
import app.modules.users.model  # noqa: F401

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.modules.users.model import UserDB


def main() -> int:
    parser = argparse.ArgumentParser(description="Food AI Admin Account CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p_grant = sub.add_parser("grant", help="Grant admin role to an existing user")
    p_grant.add_argument("username")

    p_revoke = sub.add_parser("revoke", help="Revoke admin role from an existing user")
    p_revoke.add_argument("username")

    p_create = sub.add_parser("create", help="Create a new admin user")
    p_create.add_argument("username")
    p_create.add_argument("password")
    p_create.add_argument("--name", default="Administrator")

    sub.add_parser("list", help="List all admin accounts")

    args = parser.parse_args()

    with SessionLocal() as db:
        if args.command == "grant":
            user = db.query(UserDB).filter(UserDB.username == args.username).first()
            if not user:
                print(f"Không tìm thấy người dùng '{args.username}'.")
                return 1
            user.is_admin = True
            db.commit()
            print(f"Đã cấp quyền admin cho '{user.username}' (id={user.id}).")
            return 0

        if args.command == "revoke":
            user = db.query(UserDB).filter(UserDB.username == args.username).first()
            if not user:
                print(f"Không tìm thấy người dùng '{args.username}'.")
                return 1
            user.is_admin = False
            db.commit()
            print(f"Đã thu hồi quyền admin của '{user.username}' (id={user.id}).")
            return 0

        if args.command == "create":
            existing = db.query(UserDB).filter(UserDB.username == args.username).first()
            if existing:
                print(f"Tài khoản '{args.username}' đã tồn tại. Dùng lệnh 'grant' để cấp quyền.")
                return 1
            user = UserDB(
                username=args.username,
                hashed_password=get_password_hash(args.password),
                full_name=args.name,
                is_admin=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Đã tạo tài khoản admin '{user.username}' (id={user.id}).")
            return 0

        if args.command == "list":
            admins = db.query(UserDB).filter(UserDB.is_admin == True).order_by(UserDB.id.asc()).all()
            if not admins:
                print("Chưa có tài khoản admin nào.")
            else:
                for u in admins:
                    print(f"- id={u.id} | username={u.username} | full_name={u.full_name or ''}")
            return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
