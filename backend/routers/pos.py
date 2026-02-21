from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.stock import Stock
from models.pos import POS
from schemas.pos import POSCreate, POSRead

router = APIRouter(prefix="/pos", tags=["POS"])

@router.post("/", response_model=POSRead, status_code=status.HTTP_201_CREATED)
def create_pos(payload: POSCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == payload.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="POS name cannot be empty")

    pos = POS(stock_id=payload.stock_id, name=name)
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos

@router.get("/", response_model=list[POSRead])
def list_pos(db: Session = Depends(get_db)):
    return db.query(POS).order_by(POS.id.asc()).all()

@router.get("/stocks/{stock_id}", response_model=list[POSRead])
def list_pos_by_stock(stock_id: int, db: Session = Depends(get_db)):
    return db.query(POS).filter(POS.stock_id == stock_id).order_by(POS.id.asc()).all()