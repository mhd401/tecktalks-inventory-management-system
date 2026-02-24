from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import relationship

from database import Base


class Stock(Base):
    __tablename__ = "stocks"
    __table_args__ = (
        UniqueConstraint("inventory_id", "name", name="uq_stocks_inventory_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(
        Integer,
        ForeignKey("inventories.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    inventory = relationship("Inventory", back_populates="stocks")
    products = relationship("Product", back_populates="stock", cascade="all, delete-orphan")
    pos_terminals = relationship("POS", back_populates="stock", cascade="all, delete-orphan")