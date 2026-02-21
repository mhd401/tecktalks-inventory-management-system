from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship

from database import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("stock_id", "sku", name="uq_products_stock_sku"),  
        CheckConstraint("price >= 0", name="ck_products_price_nonneg"),      
        CheckConstraint("quantity >= 0", name="ck_products_qty_nonneg"),     
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)  
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    stock = relationship("Stock", back_populates="products")