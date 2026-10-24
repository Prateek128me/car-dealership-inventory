import pytest
from conftest import SECRET
from fastapi.testclient import TestClient

from app.main import create_app


def add(client, headers, vehicle):
    response = client.post("/api/vehicles", json=vehicle, headers=headers)
    assert response.status_code == 201
    return response.json()


def test_add_list_update_delete_and_persist(client, headers, admin_headers, vehicle, db_path):
    created = add(client, headers, vehicle)
    assert created["id"] > 0
    assert created["price"] == "3500000.50"
    assert client.get("/api/vehicles", headers=headers).json() == [created]
    with TestClient(create_app(db_path, SECRET)) as restarted:
        assert restarted.get("/api/vehicles", headers=headers).json() == [created]
    details = {key: value for key, value in vehicle.items() if key != "quantity"}
    updated = client.put(
        f"/api/vehicles/{created['id']}", json=details | {"model": "Corolla"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["model"] == "Corolla"
    assert updated.json()["quantity"] == 2
    assert client.delete(f"/api/vehicles/{created['id']}", headers=headers).status_code == 403
    assert client.delete(f"/api/vehicles/{created['id']}", headers=admin_headers).status_code == 204
    assert client.get("/api/vehicles", headers=headers).json() == []


@pytest.mark.parametrize(
    "params,expected",
    [
        ({"make": "toy"}, ["Camry"]),
        ({"model": "cAM"}, ["Camry"]),
        ({"category": "suv"}, ["X1"]),
        ({"min_price": "3500000.50", "max_price": "3500000.50"}, ["Camry"]),
        ({"make": "Toyota", "category": "SUV"}, []),
        ({"max_price": "1"}, []),
        ({"make": "%' OR 1=1 --"}, []),
        ({"make": "%"}, []),
    ],
)
def test_search_filters(client, headers, vehicle, params, expected):
    add(client, headers, vehicle)
    add(
        client,
        headers,
        vehicle | {"make": "BMW", "model": "X1", "category": "SUV", "price": "5000000"},
    )
    response = client.get("/api/vehicles/search", params=params, headers=headers)
    assert response.status_code == 200
    assert [item["model"] for item in response.json()] == expected


@pytest.mark.parametrize(
    "changes",
    [
        {"price": "-1"},
        {"price": "1.001"},
        {"price": "NaN"},
        {"quantity": -1},
        {"quantity": 1.5},
        {"quantity": True},
        {"make": "  "},
        {"category": ""},
        {"unexpected": 1},
    ],
)
def test_invalid_vehicle(client, headers, vehicle, changes):
    assert client.post("/api/vehicles", json=vehicle | changes, headers=headers).status_code == 422


@pytest.mark.parametrize(
    "params", [{"min_price": -1}, {"min_price": 3, "max_price": 2}, {"max_price": "NaN"}]
)
def test_invalid_price_range(client, headers, params):
    assert client.get("/api/vehicles/search", params=params, headers=headers).status_code == 422


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/vehicles"),
        ("get", "/api/vehicles/search"),
        ("post", "/api/vehicles"),
        ("put", "/api/vehicles/1"),
        ("delete", "/api/vehicles/1"),
        ("post", "/api/vehicles/1/purchase"),
        ("post", "/api/vehicles/1/restock"),
    ],
)
def test_all_vehicle_endpoints_require_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_missing_vehicle_and_stock_cannot_be_overwritten(client, headers, admin_headers, vehicle):
    details = {key: value for key, value in vehicle.items() if key != "quantity"}
    assert client.put("/api/vehicles/999", json=details, headers=headers).status_code == 404
    assert client.delete("/api/vehicles/999", headers=admin_headers).status_code == 404
    created = add(client, headers, vehicle)
    assert (
        client.put(f"/api/vehicles/{created['id']}", json=vehicle, headers=headers).status_code
        == 422
    )
