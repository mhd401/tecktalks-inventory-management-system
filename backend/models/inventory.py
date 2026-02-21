from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from database import Base

class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())

    stocks = relationship("Stock", back_populates="inventory", cascade="all, delete")