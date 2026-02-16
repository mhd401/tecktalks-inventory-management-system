from pydantic import BaseModel


class Stock(BaseModel):
    id: int
    name: str
    inventory_id: int