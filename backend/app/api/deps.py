from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.security import decode_access_token, is_access_token_revoked
from backend.app.schemas.auth import UserPayload
from backend.app.services import supabase_service

security = HTTPBearer(auto_error=False)


def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security)
) -> UserPayload:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(auth.credentials)
    if not payload or is_access_token_revoked(auth.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claimed_role = payload.get("role")
    if claimed_role == "teacher":
        account = supabase_service.get_teacher_by_id(user_id)
        if not account:
            account = None
        user = UserPayload(
            id=user_id,
            username=account["username"],
            name=account["name"],
            role="teacher",
        ) if account else None
    elif claimed_role == "student":
        account = supabase_service.get_student_by_id(user_id)
        user = UserPayload(
            id=user_id,
            username=None,
            name=account["name"],
            role="student",
        ) if account else None
    else:
        user = None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account no longer exists or credentials are invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_teacher(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Teacher privileges required.",
        )
    return user


def require_student(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Student privileges required.",
        )
    return user
