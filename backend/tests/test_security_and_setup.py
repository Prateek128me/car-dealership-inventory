import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from conftest import SECRET
from test_vehicles import add

from app.database import Database
from app.main import create_app
from app.seed import seed_demo


@pytest.mark.parametrize(
    "changes,key",
    [
        ({"exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, SECRET),
        ({"sub": "not-an-id"}, SECRET),
        ({"sub": "999999"}, SECRET),
        ({"sub": str(10**100)}, SECRET),
        ({}, "different-signing-secret-at-least-32-bytes"),
    ],
)
def test_rejects_forged_expired_and_unknown_subject_tokens(client, headers, changes, key):
    claims = jwt.decode(headers["Authorization"].split()[1], SECRET, algorithms=["HS256"])
    claims.update(changes)
    token = jwt.encode(claims, key, algorithm="HS256")
    response = client.get("/api/vehicles", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_admin_role_revocation_applies_to_existing_token(client, admin_headers, db_path, vehicle):
    created = add(client, admin_headers, vehicle)
    with sqlite3.connect(db_path) as db:
        db.execute("UPDATE users SET role='user'")
    assert client.delete(f"/api/vehicles/{created['id']}", headers=admin_headers).status_code == 403


def test_concurrent_restocks_do_not_lose_updates(client, admin_headers, vehicle):
    created = add(client, admin_headers, vehicle | {"quantity": 0})
    with ThreadPoolExecutor(max_workers=8) as pool:
        statuses = list(
            pool.map(
                lambda _: (
                    client.post(
                        f"/api/vehicles/{created['id']}/restock",
                        json={"quantity": 1},
                        headers=admin_headers,
                    ).status_code
                ),
                range(8),
            )
        )
    assert statuses == [200] * 8
    assert client.get("/api/vehicles", headers=admin_headers).json()[0]["quantity"] == 8


def test_configuration_rejects_weak_secrets_and_in_memory_database(db_path):
    with pytest.raises(ValueError, match="32 bytes"):
        create_app(db_path, "weak")
    with pytest.raises(ValueError, match="persistent"):
        Database(":memory:")


def test_seed_is_idempotent_and_health_is_public(client, db_path):
    db = Database(db_path)
    assert seed_demo(db) is True
    assert seed_demo(db) is False
    with db.connect() as conn:
        assert conn.execute("SELECT count(*) FROM vehicles").fetchone()[0] == 6
    assert client.get("/api/health").json() == {"status": "ok"}
