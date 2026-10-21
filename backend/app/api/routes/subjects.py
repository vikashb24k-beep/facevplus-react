import io
import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
import segno
from backend.app.api.deps import get_current_user, require_teacher, require_student
from backend.app.core.config import settings
from backend.app.schemas.auth import UserPayload
from backend.app.schemas.subject import (
    SubjectCreate,
    SubjectResponse,
    EnrollRequest,
    ShareSubjectResponse,
)
from backend.app.services import supabase_service

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_teacher_subjects(teacher: UserPayload = Depends(require_teacher)):
    subjects = supabase_service.get_subjects_by_teacher(teacher.id)
    return subjects


@router.post("", response_model=SubjectResponse)
def create_new_subject(
    req: SubjectCreate,
    teacher: UserPayload = Depends(require_teacher),
):
    # Check if subject code already used
    existing = supabase_service.get_subject_by_code(req.subject_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject code '{req.subject_code}' is already registered.",
        )
    subject = supabase_service.create_subject(
        subject_code=req.subject_code,
        name=req.name,
        section=req.section,
        teacher_id=teacher.id,
    )
    subject["total_students"] = 0
    subject["total_classes"] = 0
    return subject


# ==========================================
# IMPORTANT: Static/named routes MUST come before /{subject_id}
# to prevent FastAPI from treating 'enroll' and 'student' as integers.
# ==========================================

@router.post("/enroll")
def enroll_student_manual(
    req: EnrollRequest,
    student: UserPayload = Depends(require_student)
):
    subject = supabase_service.get_subject_by_code(req.subject_code)
    if not subject:
        raise HTTPException(status_code=404, detail="Invalid subject code. Course not found.")

    try:
        supabase_service.enroll_student(student.id, subject["subject_id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": f"Successfully enrolled in {subject['name']} ({subject['subject_code']}).",
        "subject": subject,
    }


@router.get("/student/my-subjects")
def get_my_enrolled_subjects(student: UserPayload = Depends(require_student)):
    records = supabase_service.get_student_subjects(student.id)
    attendance_records = supabase_service.get_student_attendance_records(student.id)

    # Compute attendance per subject
    stats_map = {}
    for log in attendance_records:
        sid = log.get("subject_id")
        if sid not in stats_map:
            stats_map[sid] = {"total": 0, "attended": 0}
        stats_map[sid]["total"] += 1
        if log.get("is_present"):
            stats_map[sid]["attended"] += 1

    result = []
    for node in records:
        sub = node.get("subjects")
        if not sub:
            continue
        sid = sub["subject_id"]
        stat = stats_map.get(sid, {"total": 0, "attended": 0})
        total = stat["total"]
        attended = stat["attended"]
        rate = round((attended / total * 100), 1) if total > 0 else 0.0

        result.append({
            "subject_id": sid,
            "subject_code": sub["subject_code"],
            "name": sub["name"],
            "section": sub.get("section", ""),
            "total_classes": total,
            "attended_classes": attended,
            "attendance_rate": rate,
        })

    return result


# ==========================================
# Routes with dynamic {subject_id} — must come AFTER static routes
# ==========================================

@router.get("/{subject_id}")
def get_subject_details(
    subject_id: int,
    user: UserPayload = Depends(get_current_user)
):
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return subject


@router.delete("/{subject_id}")
def remove_subject(
    subject_id: int,
    teacher: UserPayload = Depends(require_teacher)
):
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="You do not own this subject.")

    success = supabase_service.delete_subject(subject_id, teacher.id)
    return {"success": success, "message": "Subject deleted successfully."}


@router.get("/{subject_id}/students")
def get_subject_students(
    subject_id: int,
    user: UserPayload = Depends(get_current_user)
):
    students = supabase_service.get_enrolled_students(subject_id)
    # Strip heavy embeddings for roster view
    clean_students = [
        {
            "student_id": s["student_id"],
            "name": s["name"],
            "has_voice_profile": bool(s.get("voice_embedding")),
        }
        for s in students
    ]
    return clean_students


@router.get("/{subject_id}/share", response_model=ShareSubjectResponse)
def get_subject_share_details(
    subject_id: int,
    request: Request,
    teacher: UserPayload = Depends(require_teacher)
):
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # Determine dynamic frontend URL
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    referer = request.headers.get("referer")
    if referer:
        # e.g. http://localhost:5173/teacher/dashboard
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            frontend_base = f"{parsed.scheme}://{parsed.netloc}"

    join_url = f"{frontend_base}/student/enroll?code={subject['subject_code']}"

    # Generate QR Code
    qr = segno.make(join_url)
    out = io.BytesIO()
    qr.save(out, kind="png", scale=8, border=2)
    qr_base64 = base64.b64encode(out.getvalue()).decode("utf-8")
    qr_data_url = f"data:image/png;base64,{qr_base64}"

    return ShareSubjectResponse(
        subject_id=subject["subject_id"],
        subject_code=subject["subject_code"],
        subject_name=subject["name"],
        join_url=join_url,
        qr_data_url=qr_data_url,
    )


@router.delete("/{subject_id}/enroll")
def unenroll_student(
    subject_id: int,
    student: UserPayload = Depends(require_student)
):
    success = supabase_service.unenroll_student(student.id, subject_id)
    return {"success": success, "message": "Successfully unenrolled from course."}

