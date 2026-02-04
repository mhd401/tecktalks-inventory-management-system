from fastapi import APIRouter
from typing import List

from schemas.inventory import Inventory

router = APIRouter(
    prefix="/inventories",
    tags=["Inventories"]
)

# In-memory storage
inventories: List[Inventory] = []


@router.post("/", response_model=Inventory)
def create_inventory(inventory: Inventory):
    inventories.append(inventory)
    return inventory


@router.get("/", response_model=List[Inventory])
def get_inventories():
    return inventories
