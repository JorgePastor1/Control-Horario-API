from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    clock_in = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    clock_out = Column(DateTime(timezone=True), nullable=True)
    
    total_hours = Column(Float, nullable=True)
    note = Column(String, nullable=True)

    user = relationship("User", back_populates="time_entries")