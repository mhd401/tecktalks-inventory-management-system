from datetime import datetime
from pydantic import BaseModel, ConfigDict

from core.enums import SessionStatus

class POSSessionRead(BaseModel):
    id: int
    pos_id: int
    status: SessionStatus
    opened_at: datetime
    closed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)