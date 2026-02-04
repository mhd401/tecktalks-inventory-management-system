from fastapi import APIRouter, HTTPException
from typing import List
from models.product import products_db, Product
from schemas.product import ProductCreate, ProductOut

router = APIRouter()

# POST /products
@router.post("/products", response_model=ProductOut)
def create_product(product: ProductCreate):
    new_id = len(products_db) + 1
    new_product = Product(id=new_id, **product.dict())
    products_db.append(new_product)
    return new_product

# GET /stocks/{stock_id}/products
@router.get("/stocks/{stock_id}/products", response_model=List[ProductOut])
def list_products(stock_id: int):
    return [p for p in products_db if p.stock_id == stock_id]
