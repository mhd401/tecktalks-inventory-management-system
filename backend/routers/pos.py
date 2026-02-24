from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from core.auth_deps import require_admin
from models.user import User
from database import get_db
from models.stock import Stock
from models.pos import POS
from schemas.pos import POSCreate, POSRead, POSUpdate

router = APIRouter(prefix="/pos", tags=["POS"])

@router.post("/", response_model=POSRead, status_code=status.HTTP_201_CREATED)
def create_pos(
    payload: POSCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
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

@router.put("/{pos_id}", response_model=POSRead)
def update_pos(pos_id: int, payload: POSUpdate, db: Session = Depends(get_db)):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    stock = db.query(Stock).filter(Stock.id == payload.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="POS name cannot be empty")

    pos.name = name
    pos.stock_id = payload.stock_id
    db.commit()
    db.refresh(pos)
    return pos

@router.delete("/{pos_id}", status_code=204)
def delete_pos(pos_id: int, db: Session = Depends(get_db)):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    db.delete(pos)
    db.commit()
    return Response(status_code=204)