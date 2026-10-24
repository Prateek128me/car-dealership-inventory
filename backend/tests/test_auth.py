import sqlite3
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from conftest import SECRET


def test_registration_returns_token_and_never_password(client, account, db_path):
    response = client.post("/api/auth/register", json=account)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "user"
    assert "password" not in str(data)
    claims = jwt.decode(data["access_token"], SECRET, algorithms=["HS256"])
    assert claims["sub"] == str(data["user"]["id"])
    with sqlite3.connect(db_path) as db:
        hashed = db.execute("SELECT password_hash FROM users").fetchone()[0]
    assert hashed.startswith("$argon2")
    assert hashed != account["password"]


def test_duplicate_email_is_case_insensitive(client, account):
    client.post("/api/auth/register", json=account)
    account["email"] = "BUYER@example.com"
    assert client.post("/api/auth/register", json=account).status_code == 409


def test_login_and_profile(client, account):
    client.post("/api/auth/register", json=account)
    response = client.post("/api/auth/login", json=account)
    assert response.status_code == 200
    profile = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer " + response.json()["access_token"]}
    )
    assert profile.status_code == 200
    assert profile.json()["email"] == account["email"]


@pytest.mark.parametrize(
    "email,password",
    [("missing@example.com", "SafePassword123!"), ("buyer@example.com", "wrong-password")],
)
def test_invalid_credentials(client, account, email, password):
    client.post("/api/auth/register", json=account)
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.parametrize("changes", [{"email": "bad"}, {"password": "short"}, {"role": "admin"}])
def test_registration_validation_and_no_role_escalation(client, account, changes):
    assert client.post("/api/auth/register", json=account | changes).status_code == 422


@pytest.mark.parametrize(
    "token",
    [
        None,
        "invalid",
        jwt.encode(
            {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            SECRET,
            algorithm="HS256",
        ),
    ],
)
def test_profile_requires_valid_unexpired_token(client, token):
    headers = {"Authorization": "Bearer " + token} if token else {}
    assert client.get("/api/auth/me", headers=headers).status_code == 401
