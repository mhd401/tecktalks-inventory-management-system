from datetime import datetime
from pydantic import BaseModel, ConfigDict

class StockCreate(BaseModel):
    inventory_id: int
    name: str
    category: str | None = None   
    location: str | None = None

class StockRead(BaseModel):
    id: int
    inventory_id: int
    name: str
    category: str | None = None   
    location: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class StockUpdate(BaseModel):
    name: str
    category: str | None = None   
    location: str | None = None