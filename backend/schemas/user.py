from datetime import datetime
from pydantic import BaseModel, ConfigDict

from core.enums import UserRole


class UserBase(BaseModel):
    email: str
    role: UserRole = UserRole.CASHIER


class UserCreate(UserBase):
    hashed_password: str


class UserRead(BaseModel):
    id: int
    email: str
    role: UserRole
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    email: str | None = None
    role: UserRole | None = None
    hashed_password: str | None = None