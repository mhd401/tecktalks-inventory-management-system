from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SAEnum, func, Numeric, String
from sqlalchemy.orm import relationship

from database import Base
from core.enums import CashMoveType


class CashMovement(Base):
    __tablename__ = "cash_movements"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("pos_sessions.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    move_type = Column(SAEnum(CashMoveType), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    session = relationship("POSSession", back_populates="cash_movements")
