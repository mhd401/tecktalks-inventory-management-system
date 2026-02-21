from datetime import datetime
from pydantic import BaseModel, ConfigDict

class POSCreate(BaseModel):
    stock_id: int
    name: str

class POSRead(BaseModel):
    id: int
    stock_id: int
    name: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class POSUpdate(BaseModel):
    name: str
    stock_id: int