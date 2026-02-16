from enum import Enum
from pydantic import BaseModel


class SessionStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class POSSession(BaseModel):
    id: int
    pos_id: int
    status: SessionStatus


class POSSessionResponse(BaseModel):
    message: str
    session: POSSession
