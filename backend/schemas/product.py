from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductCreate(BaseModel):
    stock_id: int
    name: str
    sku: str | None = None
    price: float = 0.0
    quantity: int = 0

class ProductRead(BaseModel):
    id: int
    stock_id: int
    name: str
    sku: str | None = None
    price: float
    quantity: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class ProductUpdate(BaseModel):
    name: str
    sku: str | None = None
    price: float
    quantity: int