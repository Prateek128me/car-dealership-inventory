from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import Database
from .auth import AuthService
from .schemas import Credentials, TokenOut, UserOut


def create_app(db_path: str, secret: str) -> FastAPI:
    app = FastAPI(title="Car Dealership API", version="1.0.0")
    database = Database(db_path)
    auth = AuthService(database, secret)
    bearer = HTTPBearer(auto_error=False)

    def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials is None:
            raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Bearer"})
        return auth.authenticate(credentials.credentials)

    @app.post("/api/auth/register", status_code=201, response_model=TokenOut)
    def register(credentials: Credentials):
        return auth.register(credentials)

    @app.post("/api/auth/login", response_model=TokenOut)
    def login(credentials: Credentials):
        return auth.login(credentials)

    @app.get("/api/auth/me", response_model=UserOut)
    def me(user=Depends(current_user)):
        return user

    return app
