"""Local administration commands. Public registration never creates admins."""

import argparse
import getpass
import os
import secrets
import sqlite3
from pathlib import Path

from dotenv import load_dotenv

from app.auth import password_hasher
from app.database import Database
from app.schemas import Credentials
from app.seed import seed_demo


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["init", "create-admin", "seed-demo"])
    parser.add_argument("--email")
    args = parser.parse_args()
    if args.command == "init":
        path = Path(".env")
        if path.exists():
            print("Existing .env preserved.")
        else:
            with path.open("x") as output:
                output.write(
                    f"JWT_SECRET={secrets.token_hex(32)}\nDATABASE_PATH=data/dealership.db\n"
                )
            path.chmod(0o600)
            print("Created .env with a random signing secret.")
        return
    load_dotenv()
    database = Database(os.environ.get("DATABASE_PATH", "data/dealership.db"))
    if args.command == "seed-demo":
        print(
            "Added demo vehicles."
            if seed_demo(database)
            else "Inventory is not empty; no changes made."
        )
        return
    credentials = Credentials(
        email=args.email or input("Admin email: "),
        password=getpass.getpass("Admin password (10–128 characters): "),
    )
    try:
        user = database.add_user(credentials.email, password_hasher.hash(credentials.password))
    except sqlite3.IntegrityError:
        raise SystemExit(
            "Email already exists; choose another email. Existing accounts are not promoted automatically."
        )
    with database.connect() as db:
        db.execute("UPDATE users SET role='admin' WHERE id=?", (user["id"],))
    print("Administrator created.")


if __name__ == "__main__":
    main()
