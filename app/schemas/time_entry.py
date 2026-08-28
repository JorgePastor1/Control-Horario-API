from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TimeEntryBase(BaseModel):
    note: Optional[str] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryResponse(TimeEntryBase):
    id: int
    user_id: int
    clock_in: datetime
    clock_out: Optional[datetime] = None
    total_hours: Optional[float] = None

    class Config:
        from_attributes = True


class ClockStatusResponse(BaseModel):
    is_clocked_in: bool
    current_entry: Optional[TimeEntryResponse] = None