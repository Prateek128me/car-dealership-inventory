from fastapi import FastAPI


def create_app(db_path: str, secret: str) -> FastAPI:
    return FastAPI(title="Car Dealership API")
