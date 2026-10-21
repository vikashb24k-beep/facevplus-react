from typing import Optional, Literal
from pydantic import BaseModel, Field


class TeacherRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)


class TeacherLoginRequest(BaseModel):
    username: str
    password: str


class UserPayload(BaseModel):
    id: int
    username: Optional[str] = None
    name: str
    role: Literal["teacher", "student"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPayload

