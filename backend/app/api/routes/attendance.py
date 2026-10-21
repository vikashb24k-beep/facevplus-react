from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from backend.app.api.deps import require_teacher, require_student
from backend.app.schemas.auth import UserPayload
from backend.app.schemas.attendance import (
    FaceRecognitionResponse,
    VoiceRecognitionResponse,
    AttendanceCandidateResult,
    AttendanceConfirmRequest,
    AttendanceConfirmResponse,
)
from backend.app.services import supabase_service, face_service, voice_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/face/recognize", response_model=FaceRecognitionResponse)
async def recognize_face_attendance(
    subject_id: int = Form(...),
    files: List[UploadFile] = File(...),
    teacher: UserPayload = Depends(require_teacher),
):
    if not files:
        raise HTTPException(status_code=400, detail="No classroom photos uploaded.")

    # 1. Fetch subject and enrolled students
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized for this subject.")

    enrolled_students = supabase_service.get_enrolled_students(subject_id)
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students are enrolled in this subject.")

    # 2. Read images bytes
    images_bytes_list = []
    for f in files:
        b = await f.read()
        if b and len(b) > 100:
            images_bytes_list.append(b)

    if not images_bytes_list:
        raise HTTPException(status_code=400, detail="Uploaded images were empty or corrupted.")

    # 3. Run face recognition pipeline
    rec_result = face_service.recognize_faces_in_images(
        images_bytes_list, enrolled_students
    )

    detected_map = rec_result["detected_student_ids"]
    candidates: List[AttendanceCandidateResult] = []

    for s in enrolled_students:
        sid = s["student_id"]
        sources = detected_map.get(sid, [])
        is_present = len(sources) > 0

        candidates.append(
            AttendanceCandidateResult(
                student_id=sid,
                name=s["name"],
                status="Present" if is_present else "Absent",
                source=", ".join(sources) if is_present else "-",
                is_present=is_present,
            )
        )

    # Sort: present first, then alphabetically
    candidates.sort(key=lambda x: (not x.is_present, x.name.lower()))

    return FaceRecognitionResponse(
        subject_id=subject_id,
        total_enrolled=len(enrolled_students),
        total_faces_found=rec_result["total_faces_found"],
        candidates=candidates,
    )


@router.post("/voice/process", response_model=VoiceRecognitionResponse)
async def process_voice_attendance(
    subject_id: int = Form(...),
    audio_file: UploadFile = File(...),
    teacher: UserPayload = Depends(require_teacher),
):
    # 1. Verify subject
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized for this subject.")

    enrolled_students = supabase_service.get_enrolled_students(subject_id)
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students are enrolled in this subject.")

    # 2. Read audio bytes
    audio_bytes = await audio_file.read()
    if not audio_bytes or len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio recording is empty or too short.")

    # 3. Process bulk audio
    try:
        rec_result = voice_service.process_bulk_audio_attendance(
            audio_bytes, enrolled_students
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio: {e}")

    detected_scores = rec_result["detected_scores"]
    candidates: List[AttendanceCandidateResult] = []

    for s in enrolled_students:
        sid = s["student_id"]
        has_voice = bool(s.get("voice_embedding") and len(s["voice_embedding"]) == 256)
        score = detected_scores.get(sid, 0.0)
        is_present = score > 0.0

        if not has_voice:
            source_label = "No voice profile"
        elif is_present:
            source_label = f"Match score: {score:.2f}"
        else:
            source_label = "-"

        candidates.append(
            AttendanceCandidateResult(
                student_id=sid,
                name=s["name"],
                status="Present" if is_present else "Absent",
                source=source_label,
                is_present=is_present,
                has_voice_profile=has_voice,
            )
        )

    candidates.sort(key=lambda x: (not x.is_present, x.name.lower()))

    return VoiceRecognitionResponse(
        subject_id=subject_id,
        total_enrolled=len(enrolled_students),
        segments_processed=rec_result["segments_processed"],
        warning=rec_result["warning"],
        candidates=candidates,
    )


@router.post("/sessions/confirm", response_model=AttendanceConfirmResponse)
def confirm_attendance_session(
    req: AttendanceConfirmRequest,
    teacher: UserPayload = Depends(require_teacher),
):
    subject = supabase_service.get_subject_by_id(req.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized for this subject.")

    if not req.logs:
        raise HTTPException(status_code=400, detail="No attendance logs provided.")

    # Validate that all student IDs in the request are actually enrolled in this subject
    enrolled_students = supabase_service.get_enrolled_students(req.subject_id)
    enrolled_ids = {s["student_id"] for s in enrolled_students}
    for item in req.logs:
        if item.student_id not in enrolled_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Student {item.student_id} is not enrolled in this subject.",
            )

    session_ts = req.timestamp or datetime.now(timezone.utc).isoformat()

    logs_to_insert = [
        {
            "subject_id": req.subject_id,
            "student_id": item.student_id,
            "timestamp": session_ts,
            "is_present": item.is_present,
        }
        for item in req.logs
    ]

    inserted = supabase_service.create_attendance_logs(logs_to_insert)

    return AttendanceConfirmResponse(
        message="Attendance session confirmed and saved successfully.",
        count=len(inserted),
        session_timestamp=session_ts,
    )


@router.get("/teacher")
def get_teacher_attendance_history(
    teacher: UserPayload = Depends(require_teacher)
):
    raw_logs = supabase_service.get_teacher_attendance_records(teacher.id)

    # Group by (subject_id, session_timestamp)
    sessions_map = {}
    for log in raw_logs:
        ts = log.get("timestamp")
        sub = log.get("subjects", {})
        stud = log.get("students", {})
        sub_id = log.get("subject_id")

        if not ts or not sub_id:
            continue

        # Group key by ISO minute/second
        ts_clean = ts.split(".")[0]
        group_key = f"{sub_id}_{ts_clean}"

        if group_key not in sessions_map:
            sessions_map[group_key] = {
                "session_id": group_key,
                "timestamp": ts,
                "subject_id": sub_id,
                "subject_name": sub.get("name", "Unknown"),
                "subject_code": sub.get("subject_code", ""),
                "section": sub.get("section", ""),
                "present_count": 0,
                "total_count": 0,
                "students": [],
            }

        sessions_map[group_key]["total_count"] += 1
        if log.get("is_present"):
            sessions_map[group_key]["present_count"] += 1

        sessions_map[group_key]["students"].append({
            "student_id": log.get("student_id"),
            "student_name": stud.get("name", "Unknown"),
            "is_present": bool(log.get("is_present")),
        })

    # Convert to list and compute attendance percentage
    sessions = list(sessions_map.values())
    for s in sessions:
        total = s["total_count"]
        present = s["present_count"]
        s["rate"] = round((present / total * 100), 1) if total > 0 else 0.0

    return sessions


@router.get("/students/me")
def get_my_attendance_history(
    student: UserPayload = Depends(require_student)
):
    logs = supabase_service.get_student_attendance_records(student.id)
    result = []
    for log in logs:
        sub = log.get("subjects") or {}
        result.append({
            "id": log["id"],
            "timestamp": log["timestamp"],
            "subject_id": log["subject_id"],
            "subject_name": sub.get("name", "Unknown"),
            "subject_code": sub.get("subject_code", ""),
            "section": sub.get("section", ""),
            "is_present": log.get("is_present", False),
        })
    return result

