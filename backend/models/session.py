from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SAEnum, func, Numeric
from sqlalchemy.orm import relationship

from database import Base
from core.enums import SessionStatus


class POSSession(Base):
    __tablename__ = "pos_sessions"

    id = Column(Integer, primary_key=True, index=True)
    pos_id = Column(
        Integer,
        ForeignKey("pos.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(SAEnum(SessionStatus), nullable=False)

    # Cash drawer reconciliation (cash-only MVP)
    opening_cash = Column(Numeric(12, 2), nullable=False, server_default="0.00")
    closing_cash = Column(Numeric(12, 2), nullable=True)

    opened_at = Column(DateTime, nullable=False, server_default=func.now())
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    pos = relationship("POS", back_populates="sessions")
    cash_movements = relationship("CashMovement", back_populates="session", cascade="all, delete-orphan")
    orders = relationship("POSOrder", back_populates="session", cascade="all, delete-orphan")
