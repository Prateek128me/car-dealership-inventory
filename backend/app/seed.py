"""Original sample inventory for a local demonstration, not production data."""

from .schemas import VehicleCreate
from .vehicles import VehicleRepository

DEMO_VEHICLES = [
    ("Toyota", "Camry Hybrid", "Sedan", "4800000", 4),
    ("BMW", "X1 sDrive", "SUV", "5090000", 3),
    ("Hyundai", "Ioniq 5", "Electric", "4610000", 2),
    ("Volkswagen", "Virtus GT", "Sedan", "1940000", 6),
    ("Tata", "Nexon EV", "Electric", "1749000", 0),
    ("Mahindra", "Thar Roxx", "SUV", "2250000", 5),
]


def seed_demo(database):
    repo = VehicleRepository(database)
    if repo.search():
        return False
    for make, model, category, price, quantity in DEMO_VEHICLES:
        repo.create(
            VehicleCreate(make=make, model=model, category=category, price=price, quantity=quantity)
        )
    return True
