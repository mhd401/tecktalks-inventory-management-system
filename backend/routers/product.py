from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models.stock import Stock
from models.product import Product
from models.pos import POS
from models.session import POSSession
from core.enums import SessionStatus
from schemas.product import ProductCreate, ProductRead, ProductUpdate, ProductQuantityAdjust

router = APIRouter(tags=["Products"])


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == payload.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")

    if payload.price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    if payload.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    sku = payload.sku.strip() if payload.sku and payload.sku.strip() else None

    if sku:
        existing_sku = (
            db.query(Product)
            .filter(Product.stock_id == payload.stock_id, Product.sku == sku)
            .first()
        )
        if existing_sku:
            raise HTTPException(status_code=400, detail="SKU already exists in this stock")

    product = Product(
        stock_id=payload.stock_id,
        name=name,
        sku=sku,
        price=payload.price,
        quantity=payload.quantity,
    )
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to create product due to DB constraint")
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

    if payload.price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    if payload.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    sku = payload.sku.strip() if payload.sku and payload.sku.strip() else None

    if sku:
        dup = (
            db.query(Product)
            .filter(
                Product.stock_id == product.stock_id,
                Product.sku == sku,
                Product.id != product_id
            )
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="SKU already exists in this stock")

    product.name = name
    product.sku = sku
    product.price = payload.price
    product.quantity = payload.quantity

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to update product due to DB constraint")
    return product


@router.post("/products/{product_id}/adjust-quantity", response_model=ProductRead)
def adjust_product_quantity(product_id: int, payload: ProductQuantityAdjust, db: Session = Depends(get_db)):
    if payload.delta == 0:
        raise HTTPException(status_code=400, detail="Delta cannot be zero")

    product_id_to_refresh: int | None = None

    try:
        with db.begin():
            # Lock product row
            product = (
                db.query(Product)
                .filter(Product.id == product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")

            # Lock POS row (pos_id is now mandatory)
            pos = (
                db.query(POS)
                .filter(POS.id == payload.pos_id)
                .with_for_update()
                .first()
            )
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            # Product must belong to the same stock as the POS
            if pos.stock_id != product.stock_id:
                raise HTTPException(status_code=400, detail="Product does not belong to POS stock")

            # POS must have an OPEN session
            open_session = (
                db.query(POSSession)
                .filter(
                    POSSession.pos_id == payload.pos_id,
                    POSSession.status == SessionStatus.OPEN,
                )
                .with_for_update()
                .first()
            )
            if not open_session:
                raise HTTPException(status_code=403, detail="Open POS session required")

            new_qty = int(product.quantity) + int(payload.delta)
            if new_qty < 0:
                raise HTTPException(status_code=400, detail="Insufficient quantity")

            product.quantity = new_qty
            db.flush()
            product_id_to_refresh = product.id

        updated = db.query(Product).filter(Product.id == product_id_to_refresh).first()
        return updated

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Quantity update failed due to DB constraint")

@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to delete product due to DB constraint")

    return Response(status_code=204)