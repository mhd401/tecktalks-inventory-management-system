from pydantic import BaseModel, ConfigDict

from core.enums import UserRole


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.CASHIER


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    email: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)