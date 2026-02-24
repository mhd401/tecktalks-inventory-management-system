from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # NOT unique in SQL

    stocks = relationship("Stock", back_populates="inventory", cascade="all, delete-orphan")