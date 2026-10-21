# FaceVPlus-v2 — Streamlit to React & FastAPI Migration Plan

## 1. Executive Summary

This document details the migration of **FaceVPlus-v2** from a Streamlit monolithic application into a modern, decoupled full-stack architecture:
- **Frontend**: React 18+, Vite, Tailwind CSS, React Router v6, Lucide React, Axios, QRCode.react.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Uvicorn, PyJWT, bcrypt.
- **Biometric Pipelines**: Dlib & face-recognition (128D embeddings), Resemblyzer & Librosa (256D voice embeddings).
- **Database**: Existing hosted Supabase PostgreSQL database (`teachers`, `students`, `subjects`, `subject_students`, `attendance_logs`).

The objective is to eliminate Streamlit's rerun and state-retention limitations, improve security (HttpOnly/JWT tokens instead of client-state impersonation), provide a responsive UI/UX, and preserve 100% of the biometric and database workflows.

---

## 2. Feature Mapping Matrix

| Streamlit Component / Screen | Streamlit File | Target React Route / Component | Target FastAPI Endpoint | DB / Pipeline Operation |
|---|---|---|---|---|
| Landing Portal | `home_screen.py` | `/` (`HomePage.jsx`) | N/A | Static landing navigation |
| Teacher Login | `teacher_screen.py` (`teacher_screen_login`) | `/teacher/login` (`TeacherLogin.jsx`) | `POST /api/auth/teacher/login` | `teachers` select + `bcrypt.checkpw` |
| Teacher Registration | `teacher_screen.py` (`teacher_screen_register`) | `/teacher/register` (`TeacherRegister.jsx`) | `POST /api/auth/teacher/register` | `teachers` insert + `bcrypt.hashpw` |
| Teacher Dashboard | `teacher_screen.py` (`teacher_dashboard`) | `/teacher/dashboard` (`TeacherDashboard.jsx`) | `GET /api/subjects`, `GET /api/attendance/summary` | Query teacher subjects & class counts |
| Subject Management | `teacher_screen.py` (`teacher_tab_manage_subjects`) | `/teacher/dashboard` (`SubjectsPage.jsx`, `SubjectCard.jsx`) | `GET /api/subjects`, `DELETE /api/subjects/{id}` | Query & manage teacher's courses |
| Subject Creation Dialog | `dialog_create_subject.py` | `CreateSubjectModal.jsx` | `POST /api/subjects` | Insert `subjects` |
| Share Subject / QR Dialog | `dialog_share_subject.py` | `ShareSubjectModal.jsx` | `GET /api/subjects/{id}/share` | Generate QR code (data URL/Segno) & deep link |
| Add Photos Dialog | `dialog_add_photo.py` | `AddPhotosModal.jsx` (Webcam & Dropzone) | N/A (Frontend photo buffer) | Local photo capture & batching |
| Face Attendance Trigger | `teacher_screen.py` (`teacher_tab_take_attendance`) | `TeacherDashboard.jsx` | `POST /api/attendance/face/recognize` | `face_pipeline.predict_attendance` |
| Voice Attendance Dialog | `dialog_voice_attendance.py` | `VoiceAttendanceModal.jsx` (MediaRecorder) | `POST /api/attendance/voice/process` | `voice_pipeline.process_bulk_audio` |
| Attendance Review Dialog | `dialog_attendance_result.py` | `AttendanceReviewModal.jsx` (Interactive table) | `POST /api/attendance/sessions/confirm` | Batch insert into `attendance_logs` |
| Attendance Records Tab | `teacher_screen.py` (`teacher_tab_attendance_records`) | `TeacherDashboard.jsx` (Filters & CSV Export) | `GET /api/attendance/teacher` | Grouped historical attendance query |
| Student Face Login | `student_screen.py` (`student_screen`) | `/student/login` (`StudentLogin.jsx` Webcam) | `POST /api/auth/student/face-login` | Capture face -> embedding -> match student |
| Student Registration | `student_screen.py` (registration container) | `/student/register` (`StudentRegister.jsx` Webcam + Audio) | `POST /api/auth/student/register` | Extract 128D face + 256D voice embeddings -> insert `students` |
| Student Dashboard | `student_screen.py` (`student_dashboard`) | `/student/dashboard` (`StudentDashboard.jsx`) | `GET /api/subjects/student/my-subjects`, `GET /api/attendance/students/me` | Query enrolled subjects & attendance ratios |
| Student Manual Enroll | `dialog_enroll.py` | `EnrollModal.jsx` | `POST /api/subjects/enroll` | Verify `subject_code` -> insert `subject_students` |
| Student Auto-Enroll (?join-code=...) | `dialog_auto_enroll.py` + `app.py` | `/student/enroll?code=...` (`StudentAutoEnroll.jsx`) | `POST /api/subjects/enroll` | Verify join code -> check duplicate -> insert |
| Student Unenroll | `student_screen.py` (`unenroll_button`) | `SubjectCard.jsx` unenroll action | `DELETE /api/subjects/{id}/enroll` | Delete from `subject_students` |

---

## 3. Session State Variable Mapping

| Streamlit Session State Key | Lifecycle & Role | React / FastAPI State Replacement |
|---|---|---|
| `login_type` (`"teacher"` \| `"student"` \| `None`) | Active portal view | React Router URL routes (`/teacher/*`, `/student/*`, `/`) |
| `is_logged_in` (`True` \| `False`) | Auth gate | `AuthContext` state (`isAuthenticated`, `token`) |
| `user_role` (`"teacher"` \| `"student"`) | User authorization role | `AuthContext` (`user.role`) verified by backend JWT |
| `teacher_data` (`dict`) | Cached teacher profile | React `AuthContext.user` + backend JWT claims |
| `student_data` (`dict`) | Cached student profile | React `AuthContext.user` + backend JWT claims |
| `teacher_login_type` (`"login"` \| `"register"`) | Teacher auth tab toggle | Dedicated routes `/teacher/login` & `/teacher/register` |
| `current_teacher_tab` (`"take_attendance"` \| ...) | Teacher dashboard tab | React tab state in `TeacherDashboard.jsx` |
| `attendance_images` (`list[PIL.Image]`) | Photos pending face recognition | React component state (`attendancePhotos: File[]`) |
| `voice_attendance_results` (`tuple`) | Temporary detected voice attendance | React modal state (`reviewCandidates`) |
| `photo_tab` (`"camera"` \| `"upload"`) | Photo input mode | Tab state in `AddPhotosModal.jsx` |

---

## 4. API Specification & Contracts

### 4.1 Authentication (`/api/auth`)
- `POST /api/auth/teacher/register`: Body `{ username, password, name }` &rarr; `{ access_token, user: { id, username, name, role: 'teacher' } }`
- `POST /api/auth/teacher/login`: Body `{ username, password }` &rarr; `{ access_token, user: { id, username, name, role: 'teacher' } }`
- `POST /api/auth/student/face-login`: Form-data `file` (image) &rarr; `{ access_token, user: { id, name, role: 'student' } }`
- `POST /api/auth/student/register`: Form-data `name`, `face_file`, optional `voice_file` &rarr; `{ access_token, user: { id, name, role: 'student' } }`
- `GET /api/auth/me`: Headers `Authorization: Bearer <token>` &rarr; Current user profile and role.

### 4.2 Subjects (`/api/subjects`)
- `GET /api/subjects`: Returns list of subjects for logged-in teacher (with `total_students`, `total_classes`).
- `POST /api/subjects`: Body `{ subject_code, name, section }` &rarr; Creates new subject.
- `DELETE /api/subjects/{subject_id}`: Deletes subject (if owned by teacher).
- `GET /api/subjects/{subject_id}/students`: Returns roster of enrolled students.
- `GET /api/subjects/{subject_id}/share`: Returns share link and QR code (Base64 PNG).
- `POST /api/subjects/enroll`: Student body `{ subject_code }` &rarr; Enrolls student.
- `DELETE /api/subjects/{subject_id}/enroll`: Student un-enrolls from subject.
- `GET /api/subjects/student/my-subjects`: Student enrolled subjects with individual attendance statistics.

### 4.3 Attendance (`/api/attendance`)
- `POST /api/attendance/face/recognize`: Form-data `subject_id`, `files` (multiple classroom images) &rarr; Returns detected students, photo sources, match status.
- `POST /api/attendance/voice/process`: Form-data `subject_id`, `audio_file` &rarr; Splits audio, matches candidate voice profiles, returns proposed attendance.
- `POST /api/attendance/sessions/confirm`: Body `{ subject_id, timestamp, logs: [{ student_id, is_present }] }` &rarr; Persists to `attendance_logs`.
- `GET /api/attendance/teacher`: Returns aggregated historical attendance records with student breakdown.
- `GET /api/attendance/students/me`: Returns attendance history for authenticated student.

---

## 5. Migration Execution Checklist

- [x] **Stage 1: Inspection & Migration Plan Creation**
  - [x] Inspect existing Streamlit codebase, database, and pipelines.
  - [x] Map all screens, components, session state, and queries.
  - [x] Create `MIGRATION_PLAN.md` with full specifications.

- [x] **Stage 2: Foundation & Project Scaffolding**
  - [x] Initialize React + Vite + Tailwind CSS frontend with standard structure.
  - [x] Initialize FastAPI backend structure (`app/core`, `app/api`, `app/schemas`, `app/services`).
  - [x] Configure environment variables (`.env.example` for frontend & backend).
  - [x] Configure CORS, error handlers, and `/api/health` check.

- [x] **Stage 3: Authentication & Supabase Integration**
  - [x] Implement JWT token generation, password hashing (`bcrypt`), and token verification dependencies.
  - [x] Implement teacher registration & login endpoints.
  - [x] Implement student face-ID registration & login endpoints.
  - [x] Implement React `AuthContext`, protected route wrappers, and token storage.

- [x] **Stage 4: Core Navigation & Shared UI Components**
  - [x] Build landing page (`HomePage.jsx`) with clean education technology visual identity and Lucide icons.
  - [x] Build layout components: navigation bar, container, footer, theme support.
  - [x] Build reusable UI primitives: Button, Input, Modal, Badge, LoadingSpinner, SubjectCard.
  - [x] Build Teacher and Student dashboard skeletons.

- [x] **Stage 5: Subject Management & Enrollment (QR & Deep Links)**
  - [x] Implement subject creation modal and API.
  - [x] Implement subject cards with student and class count metrics.
  - [x] Implement QR code and invite link sharing modal with copy-to-clipboard.
  - [x] Implement manual student enrollment and `?join-code=` deep linking auto-enrollment (`StudentAutoEnroll.jsx`).
  - [x] Implement student un-enrollment flow.

- [x] **Stage 6: Face Recognition Attendance Pipeline Integration**
  - [x] Wrap Dlib model loading and face descriptor extraction into FastAPI service (`face_service.py`).
  - [x] Implement multi-photo upload and client webcam capture in React (`AddPhotosModal.jsx`).
  - [x] Connect `POST /api/attendance/face/recognize` and return student presence predictions.

- [x] **Stage 7: Voice Recognition Attendance Pipeline Integration**
  - [x] Wrap Resemblyzer and Librosa into FastAPI voice service (`voice_service.py`).
  - [x] Implement in-browser audio recording (MediaRecorder) and audio file upload in React (`VoiceAttendanceModal.jsx`).
  - [x] Connect `POST /api/attendance/voice/process` with candidate filtering.

- [x] **Stage 8: Attendance Review, Records, & Analytics**
  - [x] Build interactive attendance review modal allowing teachers to adjust presence before confirming (`AttendanceReviewModal.jsx`).
  - [x] Implement batch insertion into `attendance_logs`.
  - [x] Build Attendance Records tab with date/session grouping and CSV export.
  - [x] Build Student attendance dashboard with attendance percentage stats.

- [x] **Stage 9: Verification, Testing & Documentation**
  - [x] Add backend unit/integration tests with `pytest` (`9 passed in 12.42s`).
  - [x] Add frontend build verification (`npm run build` completed in 2.93s).
  - [x] Update `README.md` with complete installation and execution guide.

