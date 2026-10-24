"""File-backed SQLite; a fresh connection per operation, never a global connection."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3


class Database:
    def __init__(self, path: str):
        if path == ":memory:":
            raise ValueError("A persistent SQLite file is required")
        self.path = path
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))
                );
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    make TEXT NOT NULL,
                    model TEXT NOT NULL,
                    category TEXT NOT NULL,
                    price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
                    quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 1000000)
                );
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def user_by_email(self, email):
        with self.connect() as db:
            return db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    def user_by_id(self, user_id):
        with self.connect() as db:
            return db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    def add_user(self, email, password_hash):
        with self.connect() as db:
            cursor = db.execute("INSERT INTO users(email, password_hash) VALUES (?, ?)", (email, password_hash))
            return db.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
