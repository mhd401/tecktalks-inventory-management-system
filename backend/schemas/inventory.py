from datetime import datetime
from pydantic import BaseModel, ConfigDict

class InventoryCreate(BaseModel):
    name: str

class InventoryRead(BaseModel):
    id: int
    name: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class InventoryUpdate(BaseModel):
    name: str