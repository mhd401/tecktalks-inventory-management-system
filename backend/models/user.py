from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy import Enum as SAEnum

from database import Base
from core.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    role = Column(
        SAEnum(UserRole, values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        nullable=False,
        server_default=UserRole.CASHIER.value,
    )
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())