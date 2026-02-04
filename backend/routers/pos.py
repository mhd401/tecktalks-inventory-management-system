from fastapi import APIRouter
from typing import List
from models.pos import pos_db, POS
from schemas.pos import POSCreate, POSOut

router = APIRouter()

# POST /pos
@router.post("/pos", response_model=POSOut)
def create_pos(pos: POSCreate):
    new_id = len(pos_db) + 1
    new_pos = POS(id=new_id, **pos.dict())
    pos_db.append(new_pos)
    return new_pos

# GET /pos
@router.get("/pos", response_model=List[POSOut])
def list_pos():
    return pos_db
