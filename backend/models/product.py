from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, UniqueConstraint, DateTime, func
from sqlalchemy.orm import relationship

from database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("stock_id", "sku", name="uq_products_stock_sku"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(
        Integer,
        ForeignKey("stocks.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    sku = Column(String(255), nullable=True)
    price = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    cost = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    image_url = Column(String(1024), nullable=True)
    quantity = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    stock = relationship("Stock", back_populates="products")