from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SAEnum, func, Numeric
from sqlalchemy.orm import relationship

from database import Base
from core.enums import OrderStatus, PaymentMethod


class POSOrder(Base):
    __tablename__ = "pos_orders"

    id = Column(Integer, primary_key=True, index=True)
    pos_id = Column(
        Integer,
        ForeignKey("pos.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id = Column(
        Integer,
        ForeignKey("pos_sessions.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(SAEnum(OrderStatus), nullable=False, index=True, server_default=OrderStatus.OPEN.value)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False, server_default=PaymentMethod.CASH.value)
    total = Column(Numeric(12, 2), nullable=False, server_default="0.00")

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    paid_at = Column(DateTime, nullable=True)

    session = relationship("POSSession", back_populates="orders")
    lines = relationship("POSOrderLine", back_populates="order", cascade="all, delete-orphan")
