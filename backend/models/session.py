from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from database import Base
from core.enums import SessionStatus

class POSSession(Base):
    __tablename__ = "pos_sessions"

    id = Column(Integer, primary_key=True, index=True)
    pos_id = Column(Integer, ForeignKey("pos.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    status = Column(SAEnum(SessionStatus), nullable=False)  # matches OPEN/CLOSED values
    opened_at = Column(DateTime, nullable=False, server_default=func.now())
    closed_at = Column(DateTime, nullable=True)

    pos = relationship("POS", back_populates="sessions")