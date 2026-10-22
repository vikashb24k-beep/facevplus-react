from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from backend.app.core.security import hash_password, verify_password, create_access_token, revoke_access_token
from backend.app.schemas.auth import (
    TeacherRegisterRequest,
    TeacherLoginRequest,
    TokenResponse,
    UserPayload,
)
from backend.app.services import supabase_service, face_service, voice_service
from backend.app.api.deps import get_current_user, security

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/teacher/register", response_model=TokenResponse)
def register_teacher(req: TeacherRegisterRequest):
    existing = supabase_service.get_teacher_by_username(req.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )
    password_hash = hash_password(req.password)
    teacher = supabase_service.create_teacher(req.username, password_hash, req.name)

    user_payload = UserPayload(
        id=teacher["teacher_id"],
        username=teacher["username"],
        name=teacher["name"],
        role="teacher",
    )
    token = create_access_token(
        data={"sub": str(user_payload.id), "username": user_payload.username, "name": user_payload.name, "role": "teacher"}
    )
    return TokenResponse(access_token=token, user=user_payload)


@router.post("/teacher/login", response_model=TokenResponse)
def login_teacher(req: TeacherLoginRequest):
    teacher = supabase_service.get_teacher_by_username(req.username)
    if not teacher or not verify_password(req.password, teacher.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    user_payload = UserPayload(
        id=teacher["teacher_id"],
        username=teacher["username"],
        name=teacher["name"],
        role="teacher",
    )
    token = create_access_token(
        data={"sub": str(user_payload.id), "username": user_payload.username, "name": user_payload.name, "role": "teacher"}
    )
    return TokenResponse(access_token=token, user=user_payload)


@router.post("/student/face-login", response_model=TokenResponse)
async def login_student_face(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image uploaded.")

    all_students = supabase_service.get_all_students()
    student, num_faces, msg = face_service.identify_student_for_login(contents, all_students)

    if num_faces == 0:
        raise HTTPException(status_code=400, detail="No face detected. Please face the camera.")
    if num_faces > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please be alone in frame.")
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Face not recognized. You may need to create an account first.",
        )

    user_payload = UserPayload(
        id=student["student_id"],
        username=None,
        name=student["name"],
        role="student",
    )
    token = create_access_token(
        data={"sub": str(user_payload.id), "name": user_payload.name, "role": "student"}
    )
    return TokenResponse(access_token=token, user=user_payload)


@router.post("/student/register", response_model=TokenResponse)
async def register_student(
    student_id: int = Form(...),
    name: str = Form(...),
    face_file: UploadFile = File(...),
    voice_file: Optional[UploadFile] = File(None),
):
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Student name is required.")
    if student_id <= 0:
        raise HTTPException(status_code=400, detail="Registration number must be a positive whole number.")
    if supabase_service.get_student_by_id(student_id):
        raise HTTPException(status_code=400, detail="This registration number is already registered.")

    face_bytes = await face_file.read()
    if not face_bytes:
        raise HTTPException(status_code=400, detail="Face image is required.")

    try:
        img_np = face_service.image_bytes_to_numpy(face_bytes)
        encodings = face_service.extract_face_embeddings(img_np)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process face image: {e}")

    if len(encodings) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face found in registration image. Please position your face clearly.",
        )
    if len(encodings) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces found in registration image. Only one person should be in frame.",
        )

    face_embedding = [float(x) for x in encodings[0].tolist()]

    voice_embedding = None
    if voice_file:
        voice_bytes = await voice_file.read()
        if voice_bytes and len(voice_bytes) > 1000:
            voice_embedding = voice_service.get_voice_embedding(voice_bytes)

    student = supabase_service.create_student(
        student_id=student_id,
        name=name,
        face_embedding=face_embedding,
        voice_embedding=voice_embedding,
    )

    user_payload = UserPayload(
        id=student["student_id"],
        username=None,
        name=student["name"],
        role="student",
    )
    token = create_access_token(
        data={"sub": str(user_payload.id), "name": user_payload.name, "role": "student"}
    )
    return TokenResponse(access_token=token, user=user_payload)


@router.get("/me", response_model=UserPayload)
def get_me(current_user: UserPayload = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _current_user: UserPayload = Depends(get_current_user),
):
    if credentials:
        revoke_access_token(credentials.credentials)
    return {"message": "Logged out successfully."}
