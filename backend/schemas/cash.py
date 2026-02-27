from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from core.enums import CashMoveType


class CashMoveCreate(BaseModel):
    move_type: CashMoveType
    amount: Decimal = Field(gt=0)
    note: str | None = None


class CashMoveRead(BaseModel):
    id: int
    session_id: int
    move_type: CashMoveType
    amount: Decimal
    note: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
