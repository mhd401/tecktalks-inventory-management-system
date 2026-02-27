from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from core.enums import OrderStatus, PaymentMethod


class OrderLineIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class OrderPayRequest(BaseModel):
    # Lines sent from frontend cart when paying
    lines: list[OrderLineIn]
    payment_method: PaymentMethod = PaymentMethod.CASH


class OrderLineRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    pos_id: int
    session_id: int
    status: OrderStatus
    payment_method: PaymentMethod
    total: Decimal
    created_at: datetime
    paid_at: datetime | None = None
    lines: list[OrderLineRead] = []

    model_config = ConfigDict(from_attributes=True)


class POSDrawerSummary(BaseModel):
    pos_id: int
    session_id: int | None = None
    status: str
    opening_cash: Decimal = Decimal("0.00")
    closing_cash: Decimal | None = None
    cash_in_total: Decimal = Decimal("0.00")
    cash_out_total: Decimal = Decimal("0.00")
    sales_total: Decimal = Decimal("0.00")
    theoretical_cash: Decimal = Decimal("0.00")
