from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

Price = Annotated[Decimal, Field(ge=0, le=999999999, decimal_places=2, allow_inf_nan=False)]
Stock = Annotated[int, Field(strict=True, ge=0, le=1000000)]
Label = Annotated[str, Field(min_length=1, max_length=80)]


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=10, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class UserOut(BaseModel):
    id: int
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VehicleDetails(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    make: Label
    model: Label
    category: Label
    price: Price


class VehicleCreate(VehicleDetails):
    quantity: Stock


class VehicleOut(VehicleCreate):
    id: int


class Restock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quantity: int = Field(strict=True, gt=0, le=1000000)
