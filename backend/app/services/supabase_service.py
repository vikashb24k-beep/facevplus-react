from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from backend.app.core.config import settings

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Return a singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError(
                "Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_KEY are set."
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client


# ==========================================
# Teacher Operations
# ==========================================
def get_teacher_by_username(username: str) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("teachers")
        .select("teacher_id, username, password, name")
        .eq("username", username.strip())
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def get_teacher_by_id(teacher_id: int) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("teachers")
        .select("teacher_id, username, name")
        .eq("teacher_id", teacher_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def create_teacher(username: str, password_hash: str, name: str) -> Dict[str, Any]:
    client = get_supabase()
    data = {
        "username": username.strip(),
        "password": password_hash,
        "name": name.strip(),
    }
    res = client.table("teachers").insert(data).execute()
    if not res.data:
        raise RuntimeError("Failed to create teacher account.")
    return res.data[0]


# ==========================================
# Student Operations
# ==========================================
def get_all_students() -> List[Dict[str, Any]]:
    client = get_supabase()
    res = client.table("students").select("*").execute()
    return res.data or []


def get_student_by_id(student_id: int) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("students")
        .select("student_id, name, face_embedding, voice_embedding")
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def create_student(
    name: str,
    face_embedding: Optional[List[float]] = None,
    voice_embedding: Optional[List[float]] = None
) -> Dict[str, Any]:
    client = get_supabase()
    data = {
        "name": name.strip(),
        "face_embedding": face_embedding,
        "voice_embedding": voice_embedding,
    }
    res = client.table("students").insert(data).execute()
    if not res.data:
        raise RuntimeError("Failed to register student profile.")
    return res.data[0]


# ==========================================
# Subject Operations
# ==========================================
def get_subjects_by_teacher(teacher_id: int) -> List[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("subjects")
        .select("*, subject_students(count), attendance_logs(timestamp)")
        .eq("teacher_id", teacher_id)
        .execute()
    )
    subjects = res.data or []

    for sub in subjects:
        # Compute enrolled count
        sub_students = sub.get("subject_students")
        sub["total_students"] = (
            sub_students[0].get("count", 0) if sub_students and len(sub_students) > 0 else 0
        )

        # Compute unique class count — truncate to minute to group records from the same session
        attendance = sub.get("attendance_logs", [])
        unique_sessions = set()
        for log in attendance:
            ts = log.get("timestamp", "")
            if ts:
                # Truncate to minute: "2026-10-20T10:30:45.123Z" → "2026-10-20T10:30"
                unique_sessions.add(ts[:16])
        sub["total_classes"] = len(unique_sessions)

        sub.pop("subject_students", None)
        sub.pop("attendance_logs", None)

    return subjects


def get_subject_by_code(code: str) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("subjects")
        .select("subject_id, subject_code, name, section, teacher_id")
        .eq("subject_code", code.strip())
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def get_subject_by_id(subject_id: int) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("subjects")
        .select("subject_id, subject_code, name, section, teacher_id")
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def create_subject(
    subject_code: str, name: str, section: str, teacher_id: int
) -> Dict[str, Any]:
    client = get_supabase()
    data = {
        "subject_code": subject_code.strip(),
        "name": name.strip(),
        "section": section.strip(),
        "teacher_id": teacher_id,
    }
    res = client.table("subjects").insert(data).execute()
    if not res.data:
        raise RuntimeError("Failed to create subject.")
    return res.data[0]


def delete_subject(subject_id: int, teacher_id: int) -> bool:
    client = get_supabase()
    # First delete cascade associations
    client.table("attendance_logs").delete().eq("subject_id", subject_id).execute()
    client.table("subject_students").delete().eq("subject_id", subject_id).execute()
    res = (
        client.table("subjects")
        .delete()
        .eq("subject_id", subject_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return bool(res.data)


# ==========================================
# Enrollment Operations
# ==========================================
def get_enrolled_students(subject_id: int) -> List[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("subject_students")
        .select("*, students(*)")
        .eq("subject_id", subject_id)
        .execute()
    )
    students = []
    for item in (res.data or []):
        s = item.get("students")
        if s:
            students.append(s)
    return students


def get_student_subjects(student_id: int) -> List[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("subject_students")
        .select("*, subjects(*)")
        .eq("student_id", student_id)
        .execute()
    )
    return res.data or []


def is_student_enrolled(student_id: int, subject_id: int) -> bool:
    client = get_supabase()
    res = (
        client.table("subject_students")
        .select("subject_id")
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    return bool(res.data)


def enroll_student(student_id: int, subject_id: int) -> Dict[str, Any]:
    client = get_supabase()
    if is_student_enrolled(student_id, subject_id):
        raise ValueError("Student is already enrolled in this subject.")
    data = {"student_id": student_id, "subject_id": subject_id}
    res = client.table("subject_students").insert(data).execute()
    return res.data[0] if res.data else data


def unenroll_student(student_id: int, subject_id: int) -> bool:
    client = get_supabase()
    res = (
        client.table("subject_students")
        .delete()
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .execute()
    )
    return bool(res.data)


# ==========================================
# Attendance Operations
# ==========================================
def create_attendance_logs(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    client = get_supabase()
    if not logs:
        return []
    res = client.table("attendance_logs").insert(logs).execute()
    return res.data or []


def get_teacher_attendance_records(teacher_id: int) -> List[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("attendance_logs")
        .select("id, timestamp, subject_id, student_id, is_present, subjects!inner(*), students(*)")
        .eq("subjects.teacher_id", teacher_id)
        .order("timestamp", desc=True)
        .execute()
    )
    return res.data or []


def get_student_attendance_records(student_id: int) -> List[Dict[str, Any]]:
    client = get_supabase()
    res = (
        client.table("attendance_logs")
        .select("id, timestamp, subject_id, student_id, is_present, subjects(*)")
        .eq("student_id", student_id)
        .order("timestamp", desc=True)
        .execute()
    )
    return res.data or []

