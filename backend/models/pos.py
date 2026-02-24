from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class POS(Base):
    __tablename__ = "pos"
    __table_args__ = (
        UniqueConstraint("stock_id", "name", name="uq_pos_stock_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)

    stock = relationship("Stock", back_populates="pos_terminals")
    sessions = relationship("POSSession", back_populates="pos", cascade="all, delete-orphan")