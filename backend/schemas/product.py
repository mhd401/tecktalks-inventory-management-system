from pydantic import BaseModel

class Product(BaseModel):
    id: int
    name: str
    quantity: int
    stock_id: int



class ProductCreate(BaseModel):
    name: str
    stock_id: int
    quantity: int

class ProductOut(BaseModel):
    id: int
    name: str
    stock_id: int
    quantity: int



