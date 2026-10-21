from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.api.routes import auth, subjects, attendance

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Production-ready REST API for FaceVPlus Face & Voice Recognition Attendance System",
)

# CORS Middleware
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )

