from concurrent.futures import ThreadPoolExecutor
import pytest
from test_vehicles import add


def test_purchase_and_admin_restock(client, headers, admin_headers, vehicle):
    created = add(client, headers, vehicle | {"quantity": 1})
    url = f'/api/vehicles/{created["id"]}'
    assert client.post(url + "/purchase", headers=headers).json()["quantity"] == 0
    assert client.post(url + "/purchase", headers=headers).status_code == 409
    assert client.post(url + "/restock", json={"quantity": 3}, headers=headers).status_code == 403
    restocked = client.post(url + "/restock", json={"quantity": 3}, headers=admin_headers)
    assert restocked.status_code == 200
    assert restocked.json()["quantity"] == 3


@pytest.mark.parametrize("quantity", [0, -1, 1.5, True, 1000001])
def test_restock_rejects_invalid_quantity(client, admin_headers, vehicle, quantity):
    created = add(client, admin_headers, vehicle)
    assert client.post(f'/api/vehicles/{created["id"]}/restock', json={"quantity": quantity}, headers=admin_headers).status_code == 422


def test_inventory_missing_id(client, headers, admin_headers):
    assert client.post("/api/vehicles/999/purchase", headers=headers).status_code == 404
    assert client.post("/api/vehicles/999/restock", json={"quantity": 1}, headers=admin_headers).status_code == 404


def test_concurrent_purchases_cannot_oversell(client, headers, vehicle):
    created = add(client, headers, vehicle | {"quantity": 1})
    with ThreadPoolExecutor(max_workers=8) as pool:
        statuses = list(pool.map(lambda _: client.post(f'/api/vehicles/{created["id"]}/purchase', headers=headers).status_code, range(8)))
    assert statuses.count(200) == 1
    assert statuses.count(409) == 7
    assert client.get("/api/vehicles", headers=headers).json()[0]["quantity"] == 0


def test_restock_cannot_exceed_capacity(client, admin_headers, vehicle):
    created = add(client, admin_headers, vehicle | {"quantity": 1000000})
    assert client.post(f'/api/vehicles/{created["id"]}/restock', json={"quantity": 1}, headers=admin_headers).status_code == 409
