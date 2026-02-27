from __future__ import annotations

from datetime import datetime
from contextlib import contextmanager
from decimal import Decimal
from typing import Optional

import uuid
from pathlib import Path
from fastapi import Form
from schemas.product import ProductRead

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, InvalidRequestError
from sqlalchemy import func

from database import get_db
from core.auth_deps import get_current_user
from core.enums import SessionStatus, CashMoveType, OrderStatus, PaymentMethod
from models.user import User
from models.pos import POS
from models.session import POSSession
from models.product import Product
from models.cash_movement import CashMovement
from models.order import POSOrder
from models.order_line import POSOrderLine
from schemas.session import POSSessionOpenCash, POSSessionCloseCash, POSSessionRead
from schemas.cash import CashMoveCreate, CashMoveRead
from schemas.order import OrderPayRequest, OrderRead, POSDrawerSummary

router = APIRouter(prefix="/pos", tags=["POS Workflow"])

@contextmanager
def safe_begin(db: Session) -> Generator:
    """
    Prevents 'transaction already begun' error.
    Uses nested transaction if one is already active.
    """
    if db.in_transaction():
        with db.begin_nested():
            yield
    else:
        with db.begin():
            yield

def _get_open_session_for_update(db: Session, pos_id: int) -> POSSession:
    open_session = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
        .order_by(POSSession.id.desc())
        .with_for_update()
        .first()
    )
    if not open_session:
        raise HTTPException(status_code=400, detail="No open session found")
    return open_session


def _drawer_summary(db: Session, pos_id: int) -> POSDrawerSummary:
    latest = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id)
        .order_by(POSSession.id.desc())
        .first()
    )
    if not latest:
        return POSDrawerSummary(
            pos_id=pos_id,
            session_id=None,
            status="NO_SESSION",
        )

    # Totals are only meaningful for OPEN (or last session if CLOSED)
    cash_in_total = (
        db.query(func.coalesce(func.sum(CashMovement.amount), 0))
        .filter(CashMovement.session_id == latest.id, CashMovement.move_type == CashMoveType.IN)
        .scalar()
    )
    cash_out_total = (
        db.query(func.coalesce(func.sum(CashMovement.amount), 0))
        .filter(CashMovement.session_id == latest.id, CashMovement.move_type == CashMoveType.OUT)
        .scalar()
    )
    sales_total = (
        db.query(func.coalesce(func.sum(POSOrder.total), 0))
        .filter(POSOrder.session_id == latest.id, POSOrder.status == OrderStatus.PAID, POSOrder.payment_method == PaymentMethod.CASH)
        .scalar()
    )

    opening_cash = Decimal(str(latest.opening_cash or 0))
    cash_in_total = Decimal(str(cash_in_total or 0))
    cash_out_total = Decimal(str(cash_out_total or 0))
    sales_total = Decimal(str(sales_total or 0))
    theoretical = opening_cash + sales_total + cash_in_total - cash_out_total

    return POSDrawerSummary(
        pos_id=pos_id,
        session_id=latest.id,
        status=latest.status.value if hasattr(latest.status, "value") else str(latest.status),
        opening_cash=opening_cash,
        closing_cash=Decimal(str(latest.closing_cash)) if latest.closing_cash is not None else None,
        cash_in_total=cash_in_total,
        cash_out_total=cash_out_total,
        sales_total=sales_total,
        theoretical_cash=theoretical,
    )


@router.get("/{pos_id}/drawer/expected-opening-cash")
def expected_opening_cash(
    pos_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Expected opening cash = last CLOSED session closing_cash, else 0
    last_closed = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.CLOSED)
        .order_by(POSSession.id.desc())
        .first()
    )
    expected = Decimal(str(last_closed.closing_cash)) if (last_closed and last_closed.closing_cash is not None) else Decimal("0.00")
    return {"pos_id": pos_id, "expected_opening_cash": expected}


@router.get("/{pos_id}/drawer/summary", response_model=POSDrawerSummary)
def drawer_summary(
    pos_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")
    return _drawer_summary(db, pos_id)


@router.post("/{pos_id}/session/open-with-cash", response_model=POSSessionRead)
def open_session_with_cash(
    pos_id: int,
    payload: POSSessionOpenCash,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    created_session_id: Optional[int] = None

    try:
        with safe_begin(db):
            pos = db.query(POS).filter(POS.id == pos_id).with_for_update().first()
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            open_session = (
                db.query(POSSession)
                .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
                .with_for_update()
                .first()
            )
            if open_session:
                raise HTTPException(status_code=400, detail="POS session is already open")

            session = POSSession(
                pos_id=pos_id,
                status=SessionStatus.OPEN,
                opened_at=datetime.now(),
                opening_cash=payload.opening_cash,
            )
            db.add(session)
            db.flush()
            created_session_id = session.id

        created = db.query(POSSession).filter(POSSession.id == created_session_id).first()
        return created

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to open POS session")


@router.post("/{pos_id}/session/close-with-cash", response_model=POSDrawerSummary)
def close_session_with_cash(
    pos_id: int,
    payload: POSSessionCloseCash,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        with safe_begin(db):
            pos = db.query(POS).filter(POS.id == pos_id).with_for_update().first()
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            open_session = _get_open_session_for_update(db, pos_id)

            open_session.status = SessionStatus.CLOSED
            open_session.closed_at = datetime.now()
            open_session.closing_cash = payload.closing_cash
            db.flush()

        # return full drawer summary for the now-closed session
        return _drawer_summary(db, pos_id)

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to close POS session")


@router.post("/{pos_id}/cash-move", response_model=CashMoveRead)
def cash_move(
    pos_id: int,
    payload: CashMoveCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        with safe_begin(db):
            pos = db.query(POS).filter(POS.id == pos_id).with_for_update().first()
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            session = _get_open_session_for_update(db, pos_id)

            movement = CashMovement(
                session_id=session.id,
                move_type=payload.move_type,
                amount=payload.amount,
                note=(payload.note.strip() if payload.note else None),
            )
            db.add(movement)
            db.flush()
            created_id = movement.id

        created = db.query(CashMovement).filter(CashMovement.id == created_id).first()
        return created

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Cash movement failed")


@router.get("/{pos_id}/products")
def list_products_for_pos(
    pos_id: int,
    q: str | None = Query(default=None, description="Search by name / sku / barcode (MVP: name+sku only)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    query = db.query(Product).filter(Product.stock_id == pos.stock_id)
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter((Product.name.ilike(needle)) | (Product.sku.ilike(needle)))
    return query.order_by(Product.id.asc()).all()


@router.post("/{pos_id}/products", response_model=ProductRead, status_code=201)
def create_product_for_pos(
    pos_id: int,
    name: str = Form(...),
    price: float = Form(0.0),
    cost: float = Form(0.0),
    sku: str | None = Form(None),
    quantity: int = Form(0),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # POS must exist
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    # Require open session (matches your workflow)
    _get_open_session_for_update(db, pos_id)

    clean_name = name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")

    if price < 0 or cost < 0:
        raise HTTPException(status_code=400, detail="Price/cost cannot be negative")
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    clean_sku = sku.strip() if sku and sku.strip() else None

    # SKU must be unique within this POS stock (you already have uq constraint)
    if clean_sku:
        dup = (
            db.query(Product)
            .filter(Product.stock_id == pos.stock_id, Product.sku == clean_sku)
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="SKU already exists in this stock")

    image_url = None

    # Save image if provided
    if image is not None and image.filename:
        ext = image.filename.rsplit(".", 1)[-1].lower()
        if ext not in ("png", "jpg", "jpeg", "webp"):
            raise HTTPException(status_code=400, detail="Unsupported image type")

        filename = f"{uuid.uuid4().hex}.{ext}"

        products_dir = Path(__file__).resolve().parent.parent / "static" / "products"
        products_dir.mkdir(parents=True, exist_ok=True)

        file_path = products_dir / filename
        with open(file_path, "wb") as f:
            f.write(image.file.read())

        image_url = f"/static/products/{filename}"

    try:
        with safe_begin(db):
            product = Product(
                stock_id=pos.stock_id,
                name=clean_name,
                sku=clean_sku,
                price=price,
                cost=cost,
                quantity=quantity,
                image_url=image_url,
            )
            db.add(product)
            db.flush()
            created_id = product.id

        created = db.query(Product).filter(Product.id == created_id).first()
        return created

    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to create product")
    
    
@router.post("/{pos_id}/orders/pay", response_model=OrderRead)
def pay_order(
    pos_id: int,
    payload: OrderPayRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not payload.lines:
        raise HTTPException(status_code=400, detail="Order must contain at least one line")

    created_order_id: Optional[int] = None

    try:
        with safe_begin(db):
            pos = db.query(POS).filter(POS.id == pos_id).with_for_update().first()
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            session = _get_open_session_for_update(db, pos_id)

            # Create paid order
            order = POSOrder(
                pos_id=pos_id,
                session_id=session.id,
                status=OrderStatus.PAID,
                payment_method=payload.payment_method,
                paid_at=datetime.now(),
            )
            db.add(order)
            db.flush()

            total = Decimal("0.00")

            # Lock & validate products, then decrement stock quantities (sale)
            for ln in payload.lines:
                product = (
                    db.query(Product)
                    .filter(Product.id == ln.product_id)
                    .with_for_update()
                    .first()
                )
                if not product:
                    raise HTTPException(status_code=404, detail=f"Product {ln.product_id} not found")
                if product.stock_id != pos.stock_id:
                    raise HTTPException(status_code=400, detail="Product does not belong to POS stock")

                new_qty = int(product.quantity) - int(ln.quantity)
                if new_qty < 0:
                    raise HTTPException(status_code=400, detail=f"Insufficient quantity for product {product.id}")

                product.quantity = new_qty

                line_total = Decimal(str(ln.unit_price)) * Decimal(int(ln.quantity))
                total += line_total

                db.add(
                    POSOrderLine(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=int(ln.quantity),
                        unit_price=ln.unit_price,
                    )
                )

            order.total = total
            db.flush()
            created_order_id = order.id

        created = db.query(POSOrder).filter(POSOrder.id == created_order_id).first()
        return created

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to pay order")


@router.post("/{pos_id}/products/search-by-image")
def search_product_by_image(
    pos_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    image: UploadFile = File(...),
):
    # basic file validation
    if not image.filename:
        raise HTTPException(status_code=400, detail="Image filename is missing")

    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    filename_no_ext = image.filename.rsplit(".", 1)[0]
    needle = " ".join(filename_no_ext.replace("-", " ").replace("_", " ").strip().lower().split())

    products = db.query(Product).filter(Product.stock_id == pos.stock_id).all()

    def norm(s: str) -> str:
        return " ".join((s or "").replace("-", " ").replace("_", " ").strip().lower().split())

    for p in products:
        if norm(p.name) == needle:
            return {"found": True, "confidence": 0.95, "product": {"id": p.id, "name": p.name, "price": float(p.price), "quantity": p.quantity}}

    for p in products:
        pname = norm(p.name)
        if needle in pname or pname in needle:
            return {"found": True, "confidence": 0.75, "product": {"id": p.id, "name": p.name, "price": float(p.price), "quantity": p.quantity}}

    return {"found": False, "confidence": 0.0, "product": None}
