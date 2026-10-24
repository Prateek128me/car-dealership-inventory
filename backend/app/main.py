from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from .errors import DomainError
from .database import Database
from .auth import AuthService
from .schemas import Credentials, TokenOut, UserOut, VehicleCreate, VehicleDetails, VehicleOut, Restock, Price
from .vehicles import VehicleRepository


def create_app(db_path: str, secret: str) -> FastAPI:
    app = FastAPI(title="Car Dealership API", version="1.0.0")
    @app.exception_handler(DomainError)
    async def domain_error_handler(request, error):
        headers = {"WWW-Authenticate": "Bearer"} if error.status == 401 else None
        return JSONResponse(status_code=error.status, content={"detail": error.message}, headers=headers)

    database = Database(db_path)
    auth = AuthService(database, secret)
    bearer = HTTPBearer(auto_error=False)
    vehicles = VehicleRepository(database)

    def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials is None:
            raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Bearer"})
        return auth.authenticate(credentials.credentials)

    def admin_user(user=Depends(current_user)):
        if user.role != "admin":
            raise HTTPException(403, "Admin access required")
        return user

    @app.post("/api/auth/register", status_code=201, response_model=TokenOut)
    def register(credentials: Credentials):
        return auth.register(credentials)

    @app.post("/api/auth/login", response_model=TokenOut)
    def login(credentials: Credentials):
        return auth.login(credentials)

    @app.get("/api/auth/me", response_model=UserOut)
    def me(user=Depends(current_user)):
        return user

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/vehicles", response_model=list[VehicleOut])
    def list_vehicles(user=Depends(current_user)):
        return vehicles.search()

    @app.get("/api/vehicles/search", response_model=list[VehicleOut])
    def search_vehicles(make: str | None = None, model: str | None = None, category: str | None = None,
                        min_price: Price | None = None, max_price: Price | None = None, user=Depends(current_user)):
        if min_price is not None and max_price is not None and min_price > max_price:
            raise HTTPException(422, "Minimum price cannot exceed maximum price")
        return vehicles.search(make, model, category, min_price, max_price)

    @app.post("/api/vehicles", status_code=201, response_model=VehicleOut)
    def create_vehicle(vehicle: VehicleCreate, user=Depends(current_user)):
        return vehicles.create(vehicle)

    @app.put("/api/vehicles/{vehicle_id}", response_model=VehicleOut)
    def update_vehicle(vehicle_id: int, vehicle: VehicleDetails, user=Depends(current_user)):
        return vehicles.update(vehicle_id, vehicle)

    @app.delete("/api/vehicles/{vehicle_id}", status_code=204)
    def delete_vehicle(vehicle_id: int, user=Depends(admin_user)):
        vehicles.delete(vehicle_id)

    @app.post("/api/vehicles/{vehicle_id}/purchase", response_model=VehicleOut)
    def purchase_vehicle(vehicle_id: int, user=Depends(current_user)):
        return vehicles.change_stock(vehicle_id, -1)

    @app.post("/api/vehicles/{vehicle_id}/restock", response_model=VehicleOut)
    def restock_vehicle(vehicle_id: int, amount: Restock, user=Depends(admin_user)):
        return vehicles.change_stock(vehicle_id, amount.quantity)

    return app
