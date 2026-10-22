import io
import base64
from collections import defaultdict
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
import segno
from backend.app.api.deps import get_current_user, require_teacher, require_student
from backend.app.core.config import settings
from backend.app.schemas.auth import UserPayload
from backend.app.schemas.subject import (
    SubjectCreate,
    SubjectResponse,
    EnrollRequest,
    JoinSubjectRequest,
    InvitationResponse,
    ShareSubjectResponse,
)
from backend.app.services import supabase_service

router = APIRouter(prefix="/subjects", tags=["Subjects"])
invitation_router = APIRouter(prefix="/invitations", tags=["Invitations"])


def _format_timestamp(timestamp: Optional[str]) -> Optional[str]:
    if not timestamp:
        return None
    try:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).isoformat()
    except ValueError:
        return timestamp


def _get_authorized_subject(subject_id: int, teacher_id: int):
    subject = supabase_service.get_teacher_subject_by_id(subject_id, teacher_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or not assigned to you.")
    return subject


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


@invitation_router.get("/{invite_code}", response_model=InvitationResponse)
def get_invitation(invite_code: str):
    subject = supabase_service.get_subject_by_code(invite_code)
    if not subject:
        raise HTTPException(status_code=404, detail="This invitation is invalid or expired.")

    teacher = supabase_service.get_teacher_by_id(subject["teacher_id"])
    return InvitationResponse(
        invite_code=subject["subject_code"],
        subject_id=subject["subject_id"],
        subject_code=subject["subject_code"],
        subject_name=subject["name"],
        section=subject.get("section", ""),
        teacher_name=teacher["name"] if teacher else "Your teacher",
    )


@router.post("/join")
def join_subject(
    req: JoinSubjectRequest,
    student: UserPayload = Depends(require_student),
):
    subject = supabase_service.get_subject_by_code(req.invite_code)
    if not subject:
        raise HTTPException(status_code=404, detail="This invitation is invalid or expired.")

    if supabase_service.is_student_enrolled(student.id, subject["subject_id"]):
        return {
            "success": True,
            "already_enrolled": True,
            "message": f"You are already enrolled in {subject['name']}.",
            "subject": subject,
        }

    try:
        supabase_service.enroll_student(student.id, subject["subject_id"])
    except ValueError:
        return {
            "success": True,
            "already_enrolled": True,
            "message": f"You are already enrolled in {subject['name']}.",
            "subject": subject,
        }

    return {
        "success": True,
        "already_enrolled": False,
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


@router.get("/{subject_id}/attendance-register")
def get_subject_attendance_register(
    subject_id: int,
    search: str = "",
    sort_by: str = Query("name", pattern="^(name|attendance_percentage|attendance_count)$"),
    sort_direction: str = Query("asc", pattern="^(asc|desc)$"),
    attendance_status: str = Query("all", pattern="^(all|present|absent)$"),
    session_timestamp: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    teacher: UserPayload = Depends(require_teacher),
):
    subject = _get_authorized_subject(subject_id, teacher.id)
    enrollments = supabase_service.get_subject_enrollment_records(subject_id)
    logs = supabase_service.get_subject_attendance_logs(subject_id)

    logs_by_student = defaultdict(list)
    logs_by_session = defaultdict(dict)
    for log in logs:
        student_id = log.get("student_id")
        timestamp = log.get("timestamp")
        if student_id is None or not timestamp:
            continue
        logs_by_student[student_id].append(log)
        logs_by_session[timestamp][student_id] = bool(log.get("is_present"))

    sessions = sorted(logs_by_session.keys(), reverse=True)
    if session_timestamp and session_timestamp not in logs_by_session:
        raise HTTPException(status_code=404, detail="Attendance session not found for this subject.")
    selected_session = session_timestamp or (sessions[0] if sessions else None)
    selected_session_logs = logs_by_session.get(selected_session, {})
    query = search.strip().lower()

    rows = []
    for enrollment in enrollments:
        student = enrollment.get("students") or {}
        student_id = enrollment.get("student_id") or student.get("student_id")
        name = student.get("name", "Unknown")
        if student_id is None:
            continue
        student_logs = logs_by_student.get(student_id, [])
        student_session_statuses = {
            log["timestamp"]: bool(log.get("is_present"))
            for log in student_logs
            if log.get("timestamp")
        }
        total_classes = len(sessions)
        attended_classes = sum(student_session_statuses.values())
        absent_classes = total_classes - attended_classes
        attendance_percentage = round(attended_classes / total_classes * 100, 1) if total_classes else 0.0
        latest_timestamp = max(student_session_statuses, default=None)
        current_status = (
            "Present" if selected_session_logs.get(student_id) else "Absent"
            if student_id in selected_session_logs else "Not recorded"
        )
        identifier = str(student_id)
        if query and query not in name.lower() and query not in identifier:
            continue
        if attendance_status != "all" and current_status.lower() != attendance_status:
            continue
        rows.append({
            "student_id": student_id,
            "name": name,
            "enrollment_status": "Enrolled",
            "total_classes": total_classes,
            "attended_classes": attended_classes,
            "absent_classes": absent_classes,
            "attendance_percentage": attendance_percentage,
            "last_attendance_date": _format_timestamp(latest_timestamp),
            "current_attendance_status": current_status,
        })

    reverse = sort_direction == "desc"
    sort_key = {
        "name": lambda row: row["name"].lower(),
        "attendance_percentage": lambda row: row["attendance_percentage"],
        "attendance_count": lambda row: row["attended_classes"],
    }[sort_by]
    rows.sort(key=lambda row: (sort_key(row), row["name"].lower()), reverse=reverse)

    total = len(rows)
    start = (page - 1) * page_size
    return {
        "subject": subject,
        "selected_session": _format_timestamp(selected_session),
        "sessions": [_format_timestamp(timestamp) for timestamp in sessions],
        "supported_attendance_statuses": ["Present", "Absent"],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "students": rows[start:start + page_size],
    }


@router.get("/{subject_id}/attendance-register/{student_id}")
def get_subject_student_attendance_history(
    subject_id: int,
    student_id: int,
    teacher: UserPayload = Depends(require_teacher),
):
    subject = _get_authorized_subject(subject_id, teacher.id)
    enrollments = supabase_service.get_subject_enrollment_records(subject_id)
    enrollment = next(
        (item for item in enrollments if item.get("student_id") == student_id),
        None,
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this subject.")

    student = enrollment.get("students") or {}
    logs = supabase_service.get_subject_attendance_logs(subject_id)
    sessions = sorted({log.get("timestamp") for log in logs if log.get("timestamp")}, reverse=True)
    status_by_session = {
        log["timestamp"]: bool(log.get("is_present"))
        for log in logs
        if log.get("student_id") == student_id and log.get("timestamp")
    }
    attended_classes = sum(status_by_session.values())
    total_classes = len(sessions)
    return {
        "subject": subject,
        "student": {
            "student_id": student_id,
            "name": student.get("name", "Unknown"),
            "enrollment_status": "Enrolled",
        },
        "summary": {
            "total_classes": total_classes,
            "attended_classes": attended_classes,
            "absent_classes": total_classes - attended_classes,
            "attendance_percentage": round(attended_classes / total_classes * 100, 1) if total_classes else 0.0,
        },
        "history": [
            {
                "timestamp": _format_timestamp(timestamp),
                "status": "Present" if status_by_session.get(timestamp) else "Absent" if timestamp in status_by_session else "Not recorded",
            }
            for timestamp in sessions
        ],
    }


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
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="You do not own this subject.")

    # Determine dynamic frontend URL
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    from urllib.parse import quote
    join_url = f"{frontend_base}/join/{quote(subject['subject_code'], safe='')}"

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
