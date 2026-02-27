from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from core.enums import SessionStatus


class POSSessionRead(BaseModel):
    id: int
    pos_id: int
    status: SessionStatus
    opening_cash: Decimal = Field(default=Decimal("0.00"))
    closing_cash: Decimal | None = None
    opened_at: datetime
    closed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class POSSessionOpenCash(BaseModel):
    opening_cash: Decimal = Field(ge=0)


class POSSessionCloseCash(BaseModel):
    closing_cash: Decimal = Field(ge=0)
