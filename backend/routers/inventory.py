from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.inventory import Inventory
from schemas.inventory import InventoryCreate, InventoryRead

router = APIRouter(prefix="/inventories", tags=["Inventories"])

@router.post("/", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Inventory name cannot be empty")

    existing = db.query(Inventory).filter(Inventory.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory name already exists")

    inventory = Inventory(name=name)
    db.add(inventory)
    db.commit()
    db.refresh(inventory)
    return inventory

@router.get("/", response_model=list[InventoryRead])
def list_inventories(db: Session = Depends(get_db)):
    return db.query(Inventory).order_by(Inventory.id.asc()).all()