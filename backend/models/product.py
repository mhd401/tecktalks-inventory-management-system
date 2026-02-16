from typing import List
from pydantic import BaseModel

# Mock database
products_db = []

class Product(BaseModel):
    id: int
    name: str
    stock_id: int
    quantity: int
