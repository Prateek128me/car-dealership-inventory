"""Production entry point: python -m uvicorn app.server:app --env-file .env."""
import os
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .main import create_app

app = create_app(os.environ.get("DATABASE_PATH", "data/dealership.db"), os.environ.get("JWT_SECRET", ""))
frontend = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(404, "Not found")
        return FileResponse(frontend / "index.html")
