from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from database import Base

class POS(Base):
    __tablename__ = "pos"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    stock = relationship("Stock", back_populates="pos_terminals")
    sessions = relationship("POSSession", back_populates="pos", cascade="all, delete-orphan")