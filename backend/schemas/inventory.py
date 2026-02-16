from pydantic import BaseModel

class Inventory(BaseModel):
    id: int
    name: str
    user_id: int   # owner