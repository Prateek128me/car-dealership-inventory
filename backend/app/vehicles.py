"""Vehicle persistence and inventory operations with atomic stock updates."""
from decimal import Decimal
from fastapi import HTTPException


def serialize(row):
    if row is None:
        raise HTTPException(404, "Vehicle not found")
    result = dict(row)
    result["price"] = f'{Decimal(result.pop("price_cents")) / 100:.2f}'
    return result


class VehicleRepository:
    def __init__(self, database):
        self.database = database

    def create(self, vehicle):
        with self.database.connect() as db:
            return serialize(db.execute(
                "INSERT INTO vehicles(make, model, category, price_cents, quantity) VALUES (?, ?, ?, ?, ?) RETURNING *",
                (vehicle.make, vehicle.model, vehicle.category, int(vehicle.price * 100), vehicle.quantity),
            ).fetchone())

    def search(self, make=None, model=None, category=None, min_price=None, max_price=None):
        clauses, values = [], []
        # Only fixed column names enter SQL; every user-supplied value is bound.
        for column, value in (("make", make), ("model", model), ("category", category)):
            if value:
                clauses.append(f"instr(lower({column}), lower(?)) > 0")
                values.append(value.strip())
        for operator, price in ((">=", min_price), ("<=", max_price)):
            if price is not None:
                clauses.append(f"price_cents {operator} ?")
                values.append(int(price * 100))
        query = "SELECT * FROM vehicles"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        with self.database.connect() as db:
            return [serialize(row) for row in db.execute(query + " ORDER BY id DESC", values).fetchall()]

    def update(self, vehicle_id, vehicle):
        # Stock is changed only by purchase/restock, never by a stale edit form.
        with self.database.connect() as db:
            return serialize(db.execute(
                "UPDATE vehicles SET make=?, model=?, category=?, price_cents=? WHERE id=? RETURNING *",
                (vehicle.make, vehicle.model, vehicle.category, int(vehicle.price * 100), vehicle_id),
            ).fetchone())

    def delete(self, vehicle_id):
        with self.database.connect() as db:
            if db.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,)).rowcount == 0:
                raise HTTPException(404, "Vehicle not found")

    def change_stock(self, vehicle_id, delta):
        with self.database.connect() as db:
            # One conditional UPDATE prevents two buyers claiming the last unit.
            row = db.execute(
                "UPDATE vehicles SET quantity=quantity+? WHERE id=? AND quantity+? BETWEEN 0 AND 1000000 RETURNING *",
                (delta, vehicle_id, delta),
            ).fetchone()
            if row is None:
                if db.execute("SELECT id FROM vehicles WHERE id=?", (vehicle_id,)).fetchone() is None:
                    raise HTTPException(404, "Vehicle not found")
                raise HTTPException(409, "Out of stock" if delta < 0 else "Stock limit exceeded")
            return serialize(row)
