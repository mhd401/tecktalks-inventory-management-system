from fastapi import APIRouter
from typing import List

from schemas.stock import Stock

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)

# In-memory storage
stocks: List[Stock] = []


@router.post("/", response_model=Stock)
def create_stock(stock: Stock):
    stocks.append(stock)
    return stock

@router.get("/inventories/{inventory_id}", response_model=List[Stock])
def get_stocks_by_inventory(inventory_id: int):
    return [stock for stock in stocks if stock.inventory_id == inventory_id]
