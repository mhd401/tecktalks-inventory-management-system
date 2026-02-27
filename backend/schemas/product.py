from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ProductCreate(BaseModel):
    stock_id: int
    name: str
    sku: str | None = None
    price: float = Field(default=0.0, ge=0) 
    cost: float = Field(default=0.0, ge=0)    
    quantity: int = Field(default=0, ge=0)     

class ProductRead(BaseModel):
    id: int
    stock_id: int
    name: str
    sku: str | None = None
    price: float
    cost: float                                 
    quantity: int
    image_url: str | None = None                 
    created_at: datetime | None = None


    model_config = ConfigDict(from_attributes=True)

class ProductUpdate(BaseModel):
    name: str
    sku: str | None = None
    price: float = Field(ge=0)   
    cost: float = Field(default=0.0, ge=0)                 
    quantity: int = Field(ge=0)       

class ProductQuantityAdjust(BaseModel):
    delta: int
    reason: str | None = None
    pos_id: int     