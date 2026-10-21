import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np
from backend.app.main import app
from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from backend.app.services import supabase_service

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "FaceVPlus API"


def test_security_password_hashing():
    pwd = "secret_password_123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_jwt_token_creation_and_decoding():
    payload = {"sub": "42", "username": "prof_test", "role": "teacher"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["username"] == "prof_test"
    assert decoded["role"] == "teacher"


def test_teacher_login_invalid_credentials():
    response = client.post(
        "/api/auth/teacher/login",
        json={"username": "non_existent_teacher_9999", "password": "random_password"}
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_protected_routes_require_auth():
    # Attempt to fetch subjects without token
    res = client.get("/api/subjects")
    assert res.status_code == 401


def test_student_routes_not_mistaken_for_subject_id():
    """
    Regression test: /api/subjects/student/my-subjects must NOT match /{subject_id}
    where 'student' would be treated as a non-integer and cause a 422 validation error.
    """
    student_token = create_access_token({"sub": "7", "name": "testStudent", "role": "student"})
    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get("/api/subjects/student/my-subjects", headers=headers)
    # Must be 200 (list) — NOT 422 Unprocessable Entity
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_enroll_endpoint_not_mistaken_for_subject_id():
    """
    Regression test: POST /api/subjects/enroll must NOT match /{subject_id}
    causing a 422 error when 'enroll' is treated as a non-integer path param.
    """
    student_token = create_access_token({"sub": "7", "name": "testStudent", "role": "student"})
    headers = {"Authorization": f"Bearer {student_token}"}
    # Use a non-existent code — we just need a 404 (not found), NOT a 422 (validation error)
    res = client.post(
        "/api/subjects/enroll",
        json={"subject_code": "NONEXISTENT_XYZ999"},
        headers=headers,
    )
    assert res.status_code == 404  # "Course not found" — not a route-matching error


def test_teacher_subject_endpoints():
    # Authenticate as test teacher using JWT
    teacher_token = create_access_token({"sub": "3", "username": "prof_test", "role": "teacher"})
    headers = {"Authorization": f"Bearer {teacher_token}"}

    # Fetch teacher subjects
    res = client.get("/api/subjects", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Share details endpoint
    if len(res.json()) > 0:
        first_sub_id = res.json()[0]["subject_id"]
        share_res = client.get(f"/api/subjects/{first_sub_id}/share", headers=headers)
        assert share_res.status_code == 200
        share_data = share_res.json()
        assert "join_url" in share_data
        assert "qr_data_url" in share_data
        assert share_data["qr_data_url"].startswith("data:image/png;base64,")


def test_attendance_session_confirm():
    teacher_token = create_access_token({"sub": "3", "username": "prof_test", "role": "teacher"})
    headers = {"Authorization": f"Bearer {teacher_token}"}

    # Confirm session with subject 3
    payload = {
        "subject_id": 3,
        "logs": [
            {"student_id": 7, "is_present": True}
        ]
    }
    res = client.post("/api/attendance/sessions/confirm", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "Attendance session confirmed" in data["message"]
    assert data["count"] >= 1


def test_attendance_confirm_rejects_unenrolled_student():
    """
    Security test: confirm endpoint must reject student IDs not enrolled in the subject.
    """
    teacher_token = create_access_token({"sub": "3", "username": "prof_test", "role": "teacher"})
    headers = {"Authorization": f"Bearer {teacher_token}"}

    payload = {
        "subject_id": 3,
        "logs": [
            {"student_id": 99999, "is_present": True}  # non-existent / unenrolled student
        ]
    }
    res = client.post("/api/attendance/sessions/confirm", json=payload, headers=headers)
    assert res.status_code == 400  # Must reject unenrolled student ID


def test_teacher_attendance_history():
    teacher_token = create_access_token({"sub": "3", "username": "prof_test", "role": "teacher"})
    headers = {"Authorization": f"Bearer {teacher_token}"}

    res = client.get("/api/attendance/teacher", headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)


def test_student_routes():
    student_token = create_access_token({"sub": "7", "name": "vikash", "role": "student"})
    headers = {"Authorization": f"Bearer {student_token}"}

    # Fetch enrolled courses
    res = client.get("/api/subjects/student/my-subjects", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Fetch student attendance
    res2 = client.get("/api/attendance/students/me", headers=headers)
    assert res2.status_code == 200
    assert isinstance(res2.json(), list)


def test_teacher_cannot_access_other_teachers_subject():
    """
    Authorization test: a teacher must not be able to delete another teacher's subject.
    """
    # Teacher ID 999 tries to delete subject owned by teacher 3
    teacher_token = create_access_token({"sub": "999", "username": "fake_teacher", "role": "teacher"})
    headers = {"Authorization": f"Bearer {teacher_token}"}

    res = client.delete("/api/subjects/3", headers=headers)
    # Subject exists but is owned by teacher 3, not 999 — should be 403 or 404
    assert res.status_code in (403, 404)


def test_student_cannot_access_teacher_endpoints():
    """
    Role-based access: students must not be able to access teacher-only endpoints.
    """
    student_token = create_access_token({"sub": "7", "name": "student", "role": "student"})
    headers = {"Authorization": f"Bearer {student_token}"}

    # Try to get teacher subjects list
    res = client.get("/api/subjects", headers=headers)
    assert res.status_code == 403

    # Try to confirm attendance
    res2 = client.post(
        "/api/attendance/sessions/confirm",
        json={"subject_id": 3, "logs": []},
        headers=headers,
    )
    assert res2.status_code == 403

