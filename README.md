# FaceVPlus — Face & Voice Recognition Attendance System (v2.0 Full-Stack)

FaceVPlus is a multi-modal attendance management system engineered for modern classrooms. It provides automated student attendance tracking using face recognition (Dlib 128D descriptors) and voice recognition (Resemblyzer acoustic embeddings), backed by a hosted Supabase PostgreSQL database.

This repository features a modern full-stack decoupled architecture:
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide React, Axios, QRCode.react.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn, PyJWT, bcrypt.
- **Biometrics**: Dlib facial landmark recognition & Resemblyzer voice embeddings.
- **Database**: Supabase PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup & Run](#backend-setup--run)
- [Frontend Setup & Run](#frontend-setup--run)
- [Environment Configuration](#environment-configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [License](#license)

---

## Features

### Teacher Portal
- **Teacher Authentication**: Secure registration and password login with bcrypt and JWT tokens.
- **Subject Management**: Create, view, and delete subjects with real-time enrolled student counts.
- **Dynamic QR & Invite Links**: Generate printable QR codes and shareable deep links (`/student/enroll?code=CS101`) for instant student enrollment.
- **Batch Face Attendance**: Capture live classroom photos with a webcam or upload high-resolution multi-file images. Dlib analyzes all faces simultaneously and matches them against enrolled student embeddings.
- **Acoustic Voice Attendance**: Record live classroom roll call audio or upload recordings. Resemblyzer segments speech and identifies matching student voiceprints.
- **Interactive Attendance Review**: Review detected attendance before saving. Teachers can toggle any student's status between Present and Absent with one click.
- **Historical Attendance Records**: Grouped session history with class timestamps, attendance ratios, and **Export to CSV**.

### Student Portal
- **Face-ID Authentication**: Live camera face login that matches 128D facial descriptors against registered student profiles.
- **Biometric Enrollment**: One-time registration capturing face snapshots and voice utterances (`"I am present, my name is..."`).
- **Course Enrollment**: Enter subject codes or scan classroom QR codes for instant auto-enrollment.
- **Attendance Tracking**: View enrolled courses, total sessions held, classes attended, and live attendance percentage.
- **Course Management**: Ability to unenroll from courses at any time.

---

## Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│   Tailwind CSS • Lucide React • React Router • Axios   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / FormData)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                       │
│    Uvicorn • Pydantic v2 • PyJWT • Bcrypt Security     │
├───────────────────────────┬────────────────────────────┤
│     Biometric Pipelines   │     Data Access Layer      │
│  • Dlib 128D Face Embed   │  • Supabase Python Client  │
│  • Resemblyzer 256D Voice │  • PostgreSQL Relational   │
└───────────────────────────┴────────────────────────────┘
```

---

## Project Structure

```text
facevplus-v2/
├── backend/                       # FastAPI Backend
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint, CORS, routes
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic BaseSettings & env variables
│   │   │   └── security.py        # Bcrypt hashing & PyJWT token handling
│   │   ├── api/
│   │   │   ├── deps.py            # Auth dependencies (teacher/student guards)
│   │   │   └── routes/
│   │   │       ├── auth.py        # /api/auth (login, register, me)
│   │   │       ├── subjects.py    # /api/subjects (CRUD, share, enroll)
│   │   │       └── attendance.py  # /api/attendance (face, voice, confirm)
│   │   ├── schemas/               # Pydantic request & response models
│   │   └── services/
│   │       ├── supabase_service.py# Database CRUD operations
│   │       ├── face_service.py    # Dlib face detection & matching
│   │       └── voice_service.py   # Resemblyzer speech segmentation
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Backend environment template
│   └── .env                       # Local secrets (git-ignored)
├── frontend/                      # React Frontend
│   ├── package.json
│   ├── vite.config.js             # Vite config with Tailwind & /api proxy
│   ├── .env.example               # Frontend environment template
│   ├── src/
│   │   ├── App.jsx                # Router & protected route wrappers
│   │   ├── context/AuthContext.jsx# React Context for auth state & JWT
│   │   ├── services/              # Axios API service clients
│   │   ├── components/            # Reusable components & modals
│   │   │   ├── common/            # Navbar, Footer, Button, Input, Modal, Badge
│   │   │   ├── dialogs/           # AddPhotos, VoiceAttendance, AttendanceReview
│   │   │   └── subjects/          # SubjectCard
│   │   └── pages/
│   │       ├── HomePage.jsx       # Landing portal
│   │       ├── teacher/           # TeacherLogin, TeacherRegister, TeacherDashboard
│   │       └── student/           # StudentLogin, StudentRegister, StudentDashboard
├── tests/                         # Backend integration & unit tests
├── pytest.ini
├── MIGRATION_PLAN.md              # Detailed migration plan & checklist
└── README.md
```

---

## Prerequisites

- **Python**: 3.10, 3.11, or 3.12 (with Dlib installed).
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **Supabase Account**: A Supabase project with PostgreSQL credentials.
- **Webcam & Microphone**: For live biometric capture.

---

## Backend Setup & Run

1. **Activate virtual environment**:
   ```bash
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   source venv/bin/activate
   ```

2. **Install backend dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure environment variables**:
   Copy `backend/.env.example` to `backend/.env` and provide your credentials:
   ```ini
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key
   JWT_SECRET=your-random-32-char-secret-key
   ```

4. **Run the FastAPI server**:
   ```bash
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend interactive Swagger docs are available at `http://127.0.0.1:8000/docs`.

---

## Frontend Setup & Run

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## Database Schema

FaceVPlus uses the following relational tables in Supabase:

- **`teachers`**: `teacher_id` (PK), `username`, `password` (bcrypt hash), `name`.
- **`students`**: `student_id` (PK), `name`, `face_embedding` (128D float array), `voice_embedding` (256D float array).
- **`subjects`**: `subject_id` (PK), `subject_code`, `name`, `section`, `teacher_id` (FK &rarr; `teachers`).
- **`subject_students`**: `subject_id` (FK), `student_id` (FK).
- **`attendance_logs`**: `id` (PK), `timestamp`, `subject_id` (FK), `student_id` (FK), `is_present` (bool).

---

## API Documentation

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Backend status & readiness check | No |
| `POST` | `/api/auth/teacher/register` | Register teacher account | No |
| `POST` | `/api/auth/teacher/login` | Teacher username & password login | No |
| `POST` | `/api/auth/student/face-login` | Student webcam snapshot Face-ID login | No |
| `POST` | `/api/auth/student/register` | Student biometric profile registration | No |
| `GET` | `/api/auth/me` | Current authenticated user payload | Bearer Token |
| `GET` | `/api/subjects` | List teacher's courses with metrics | Teacher |
| `POST` | `/api/subjects` | Create a new course | Teacher |
| `DELETE` | `/api/subjects/{id}` | Delete a course | Teacher |
| `GET` | `/api/subjects/{id}/share` | Get QR code & deep link | Teacher |
| `POST` | `/api/subjects/enroll` | Student enrolls using code | Student |
| `DELETE` | `/api/subjects/{id}/enroll` | Student unenrolls from course | Student |
| `GET` | `/api/subjects/student/my-subjects` | List enrolled courses with attendance % | Student |
| `POST` | `/api/attendance/face/recognize` | Batch face analysis on classroom images | Teacher |
| `POST` | `/api/attendance/voice/process` | Acoustic voiceprint speaker matching | Teacher |
| `POST` | `/api/attendance/sessions/confirm` | Batch insert confirmed attendance logs | Teacher |
| `GET` | `/api/attendance/teacher` | Historical attendance sessions & roster | Teacher |
| `GET` | `/api/attendance/students/me` | Student personal attendance history | Student |

---

## Testing

Run the automated backend test suite using pytest:

```bash
pytest tests/test_backend.py -v
```

All 9 integration and unit tests cover:
- Health check & readiness
- Password hashing & verification
- JWT token encode / decode roundtrip
- Invalid credential rejection
- Protected route authorization gates
- Subject creation and dynamic QR code generation
- Attendance session confirmation
- Teacher and student record queries

---

## Troubleshooting & FAQ

### 1. `Microphone access denied` or `Camera not found`
Modern browsers require secure contexts (`https://` or `http://localhost`) for `navigator.mediaDevices.getUserMedia`. Ensure browser permissions are enabled for camera and audio.

### 2. Dlib model location warning
The warning `pkg_resources is deprecated as an API` from `face_recognition_models` is an upstream informational warning and does not affect facial landmark computation.

### 3. Face not recognized on first attempt
Ensure adequate lighting and position your face in the oval guide on the screen. Registration requires exactly one face in the frame.

---

## License

All rights reserved &copy; 2026 FaceVPlus.
