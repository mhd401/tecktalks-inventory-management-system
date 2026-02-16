from pydantic import BaseModel

class POS(BaseModel):
    id: int
    name: str
    stock_id: int

    

class POSCreate(BaseModel):
    name: str
    stock_id: int

class POSOut(BaseModel):
    id: int
    name: str
    stock_id: int
