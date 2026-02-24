from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from core.auth_deps import require_admin
from models.user import User
from database import get_db
from models.inventory import Inventory
from models.stock import Stock
from schemas.stock import StockCreate, StockRead, StockUpdate

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.post("/", response_model=StockRead, status_code=status.HTTP_201_CREATED)
def create_stock(
    payload: StockCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    inventory = db.query(Inventory).filter(Inventory.id == payload.inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Stock name cannot be empty")

    category = payload.category.strip() if payload.category and payload.category.strip() else None
    location = payload.location.strip() if payload.location and payload.location.strip() else None

    stock = Stock(
        inventory_id=payload.inventory_id,
        name=name,
        category=category,  
        location=location,
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

@router.put("/{stock_id}", response_model=StockRead)
def update_stock(stock_id: int, payload: StockUpdate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Stock name cannot be empty")

    stock.name = name
    stock.category = payload.category.strip() if payload.category and payload.category.strip() else None  # ✅ NEW
    stock.location = payload.location.strip() if payload.location and payload.location.strip() else None
    db.commit()
    db.refresh(stock)
    return stock

@router.delete("/{stock_id}", status_code=204)
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    db.delete(stock)
    db.commit()
    return Response(status_code=204)