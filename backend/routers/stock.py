from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.inventory import Inventory
from models.stock import Stock
from schemas.stock import StockCreate, StockRead

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.post("/", response_model=StockRead, status_code=status.HTTP_201_CREATED)
def create_stock(payload: StockCreate, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.id == payload.inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Stock name cannot be empty")

    stock = Stock(
        inventory_id=payload.inventory_id,
        name=name,
        location=(payload.location.strip() if payload.location else None),
    )
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock

@router.get("/inventories/{inventory_id}", response_model=list[StockRead])
def list_stocks_by_inventory(inventory_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Stock)
        .filter(Stock.inventory_id == inventory_id)
        .order_by(Stock.id.asc())
        .all()
    )