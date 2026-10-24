"""Disposable real HTTP server for Playwright; never touches the user's DB."""

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uvicorn

from app.auth import password_hasher
from app.database import Database
from app.main import create_app
from app.seed import seed_demo

with tempfile.TemporaryDirectory(prefix="apex-e2e-") as directory:
    path = str(Path(directory) / "test.db")
    app = create_app(path, "e2e-only-signing-secret-at-least-32-bytes")
    db = Database(path)
    for email, role in [("admin@example.test", "admin"), ("buyer@example.test", "user")]:
        user = db.add_user(email, password_hasher.hash("TestPassword123!"))
        with db.connect() as conn:
            conn.execute("UPDATE users SET role=? WHERE id=?", (role, user["id"]))
    seed_demo(db)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
