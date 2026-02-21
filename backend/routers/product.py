from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.stock import Stock
from models.product import Product
from schemas.product import ProductCreate, ProductRead

from schemas.product import ProductCreate, ProductRead, ProductUpdate
from fastapi import Response

router = APIRouter(tags=["Products"])

@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == payload.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")

    if payload.sku:
        existing_sku = db.query(Product).filter(Product.sku == payload.sku.strip()).first()
        if existing_sku:
            raise HTTPException(status_code=400, detail="SKU already exists")

    product = Product(
        stock_id=payload.stock_id,
        name=name,
        sku=payload.sku.strip() if payload.sku else None,
        price=payload.price,
        quantity=payload.quantity,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/stocks/{stock_id}/products", response_model=list[ProductRead])
def list_products_by_stock(stock_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Product)
        .filter(Product.stock_id == stock_id)
        .order_by(Product.id.asc())
        .all()
    )

@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")

    if payload.sku:
        dup = db.query(Product).filter(Product.sku == payload.sku.strip(), Product.id != product_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="SKU already exists")
        product.sku = payload.sku.strip()
    else:
        product.sku = None

    product.name = name
    product.price = payload.price
    product.quantity = payload.quantity

    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return Response(status_code=204)