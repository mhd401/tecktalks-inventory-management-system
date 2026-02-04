from typing import List
from pydantic import BaseModel

# Mock database
pos_db = []

class POS(BaseModel):
    id: int
    name: str
    stock_id: int
