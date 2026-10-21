from typing import List, Optional, Any
from pydantic import BaseModel


class AttendanceCandidateResult(BaseModel):
    student_id: int
    name: str
    status: str  # "Present" or "Absent"
    source: str  # e.g. "Photo 1, Photo 2" or "Score: 0.82" or "-"
    is_present: bool
    has_voice_profile: Optional[bool] = None


class FaceRecognitionResponse(BaseModel):
    subject_id: int
    total_enrolled: int
    total_faces_found: int
    candidates: List[AttendanceCandidateResult]


class VoiceRecognitionResponse(BaseModel):
    subject_id: int
    total_enrolled: int
    segments_processed: int
    warning: Optional[str] = None
    candidates: List[AttendanceCandidateResult]


class AttendanceLogItem(BaseModel):
    student_id: int
    is_present: bool


class AttendanceConfirmRequest(BaseModel):
    subject_id: int
    timestamp: Optional[str] = None
    logs: List[AttendanceLogItem]


class AttendanceConfirmResponse(BaseModel):
    message: str
    count: int
    session_timestamp: str

