from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ProductCreate(BaseModel):
    stock_id: int
    name: str
    sku: str | None = None
    price: float = Field(default=0.0, ge=0)   
    quantity: int = Field(default=0, ge=0)     

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
    price: float = Field(ge=0)                 
    quantity: int = Field(ge=0)       

class ProductQuantityAdjust(BaseModel):
    delta: int
    reason: str | None = None
    pos_id: int | None = None       