from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from core.auth_deps import get_current_user
from models.user import User
from models.stock import Stock
from models.product import Product
from models.pos import POS
from models.session import POSSession
from core.enums import SessionStatus
from schemas.product import ProductCreate, ProductRead, ProductUpdate, ProductQuantityAdjust

router = APIRouter(tags=["Products"])

def _normalize_name(text: str) -> str:
    return " ".join((text or "").replace("-", " ").replace("_", " ").strip().lower().split())


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
def list_products_by_stock(stock_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(Product)
        .filter(Product.stock_id == stock_id)
        .order_by(Product.id.asc())
        .all()
    )


@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
def adjust_product_quantity(product_id: int, payload: ProductQuantityAdjust, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
def delete_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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



@router.post("/identify-by-image")
def identify_product_by_image(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    image: UploadFile = File(...),
    pos_id: int | None = Form(default=None),
    stock_id: int | None = Form(default=None),
):
    # must have at least one scope
    if pos_id is None and stock_id is None:
        raise HTTPException(status_code=400, detail="pos_id or stock_id is required")

    # if pos_id is provided, derive stock_id from POS
    if pos_id is not None:
        pos = db.query(POS).filter(POS.id == pos_id).first()
        if not pos:
            raise HTTPException(status_code=404, detail="POS not found")
        target_stock_id = pos.stock_id
    else:
        target_stock_id = stock_id

    # basic file validation
    if not image.filename:
        raise HTTPException(status_code=400, detail="Image filename is missing")

    # filename fallback matching (stub logic)
    # example: "coca-cola.jpg" -> "coca cola"
    filename_no_ext = image.filename.rsplit(".", 1)[0]
    needle = _normalize_name(filename_no_ext)

    # query products in same stock
    products = (
        db.query(Product)
        .filter(Product.stock_id == target_stock_id)
        .all()
    )

    # exact normalized match first
    for p in products:
        if _normalize_name(p.name) == needle:
            return {
                "found": True,
                "match_type": "exact_filename",
                "product": {
                    "id": p.id,
                    "name": p.name,
                    "stock_id": p.stock_id,
                    "quantity": p.quantity,
                    # include if your model has price:
                    # "price": float(p.price) if p.price is not None else None,
                },
                "suggested": None,
            }

    # contains match second
    for p in products:
        pname = _normalize_name(p.name)
        if needle in pname or pname in needle:
            return {
                "found": True,
                "match_type": "partial_filename",
                "product": {
                    "id": p.id,
                    "name": p.name,
                    "stock_id": p.stock_id,
                    "quantity": p.quantity,
                },
                "suggested": None,
            }

    # not found -> suggest data for create form
    # (simple placeholder pricing logic; replace later with ML/AI pricing)
    suggested_price = 1.0
    if "cola" in needle or "pepsi" in needle:
        suggested_price = 1.5
    elif "water" in needle:
        suggested_price = 0.5

    return {
        "found": False,
        "match_type": None,
        "product": None,
        "suggested": {
            "name": filename_no_ext.replace("-", " ").replace("_", " ").strip(),
            "suggested_price": suggested_price,
            "confidence": 0.2,
        },
    }