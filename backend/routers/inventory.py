from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from core.auth_deps import require_admin
from models.user import User
from database import get_db
from models.inventory import Inventory
from schemas.inventory import InventoryCreate, InventoryRead, InventoryUpdate

router = APIRouter(prefix="/inventories", tags=["Inventories"])

@router.post("/", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
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


@router.put("/{inventory_id}", response_model=InventoryRead)
def update_inventory(inventory_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Inventory name cannot be empty")

    duplicate = db.query(Inventory).filter(Inventory.name == name, Inventory.id != inventory_id).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Inventory name already exists")

    inv.name = name
    db.commit()
    db.refresh(inv)
    return inv

@router.delete("/{inventory_id}", status_code=204)
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    db.delete(inv)
    db.commit()
    return Response(status_code=204)