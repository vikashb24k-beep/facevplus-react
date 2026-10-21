from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.security import decode_access_token
from backend.app.schemas.auth import UserPayload

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
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user = UserPayload(
            id=int(payload["sub"]),
            username=payload.get("username"),
            name=payload.get("name", ""),
            role=payload.get("role", "student"),
        )
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


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

