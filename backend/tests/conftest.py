import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

SECRET = "test-only-secret-with-at-least-32-bytes"


@pytest.fixture
def db_path(tmp_path):
    return str(tmp_path / "dealership.db")


@pytest.fixture
def client(db_path):
    with TestClient(create_app(db_path, SECRET)) as client:
        yield client


@pytest.fixture
def account():
    return {"email": "buyer@example.com", "password": "SafePassword123!"}


@pytest.fixture
def headers(client, account):
    response = client.post("/api/auth/register", json=account)
    return {"Authorization": "Bearer " + response.json()["access_token"]}


@pytest.fixture
def admin_headers(client, db_path):
    account = {"email": "admin@example.com", "password": "SafePassword123!"}
    response = client.post("/api/auth/register", json=account)
    with sqlite3.connect(db_path) as db:
        db.execute("UPDATE users SET role='admin' WHERE email=?", (account["email"],))
    return {"Authorization": "Bearer " + response.json()["access_token"]}


@pytest.fixture
def vehicle():
    return {
        "make": "Toyota",
        "model": "Camry",
        "category": "Sedan",
        "price": "3500000.50",
        "quantity": 2,
    }
