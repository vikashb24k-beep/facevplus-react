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

