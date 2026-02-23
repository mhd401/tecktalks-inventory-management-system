from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventories.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True) 
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    inventory = relationship("Inventory", back_populates="stocks")
    products = relationship("Product", back_populates="stock", cascade="all, delete-orphan")
    pos_terminals = relationship("POS", back_populates="stock", cascade="all, delete-orphan")