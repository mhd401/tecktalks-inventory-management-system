from pydantic import BaseModel


class POS(BaseModel):
    id: int
    name: str
    stock_id: int