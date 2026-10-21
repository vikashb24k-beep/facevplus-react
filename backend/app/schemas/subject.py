from typing import Optional
from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    subject_code: str = Field(..., min_length=2, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    section: str = Field(..., min_length=1, max_length=20)


class SubjectResponse(BaseModel):
    subject_id: int
    subject_code: str
    name: str
    section: str
    teacher_id: int
    total_students: int = 0
    total_classes: int = 0


class EnrollRequest(BaseModel):
    subject_code: str = Field(..., min_length=2, max_length=20)


class ShareSubjectResponse(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    join_url: str
    qr_data_url: str

