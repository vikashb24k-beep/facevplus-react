# FaceVPlus — Face & Voice Recognition Attendance System

FaceVPlus is a Python-based attendance management system built with Streamlit. It is designed to help teachers manage subjects and record student attendance using face and voice recognition.

The application provides separate teacher and student workflows, subject enrollment, classroom-photo analysis, voice-based attendance, attendance review, and database-backed records through Supabase.

> **Project status:** Under active development. Some features and setup steps may vary depending on the current implementation in your local repository.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Run the Application](#run-the-application)
- [How to Use FaceVPlus](#how-to-use-facevplus)
- [Recognition Pipeline](#recognition-pipeline)
- [Attendance Data](#attendance-data)
- [Troubleshooting](#troubleshooting)
- [Security and Privacy](#security-and-privacy)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Features

### Teacher Portal
- Teacher registration and login, depending on the configured authentication flow.
- Create and manage subjects.
- Share subject details or enrollment links.
- Enroll students in subjects.
- Capture or upload classroom photos for face-based attendance.
- Record attendance from classroom audio using voice recognition.
- Review detected attendance before confirming and saving it.
- View attendance records and reports, where implemented.

### Student Portal
- Student registration and face-based login, where enabled.
- Student enrollment in available subjects.
- View enrolled subjects and attendance information, where implemented.
- Support for voice-profile registration, where enabled.

### Recognition and Data
- Face-recognition pipeline based on the models and libraries configured in  project. 
- Voice-recognition pipeline for processing recorded audio.
- Supabase/PostgreSQL integration for application data.
- Streamlit session state for temporary UI and attendance-review data.

**Note:** Recognition accuracy depends on the quality of the enrolled face/voice samples, audio conditions, lighting, camera quality, and the matching thresholds configured in the recognition pipelines.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application logic and recognition pipelines |
| Streamlit | Web interface and dialogs |
| Supabase | Hosted PostgreSQL database and application data |
| pandas | Attendance tables and data processings |
| NumPy | Numerical operations and embeddings |
| Pillow (PIL) | Image loading and handling |
| dlib / face-recognition-models | Face detection and face embeddings, where configured |
| scikit-learn | Machine-learning classification, where configured |
| Audio-processing libraries | Audio preprocessing and voice recognition, according to `voice_pipeline.py` |

Check your project's dependency file for the exact package versions used by your current environment.

## Project Structure

The following structure is based on the repository layout and modules currently used in the project. Some files may be added or renamed as development continues.

```text
FaceVPlus/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── .streamlit/
│   └── secrets.toml              # Local secrets; do not commit
└── src/
    ├── components/
    │   ├── dialog_add_photo.py
    │   ├── dialog_attendance_result.py
    │   ├── dialog_auto_enroll.py
    │   ├── dialog_create_subject.py
    │   ├── dialog_enroll.py
    │   ├── dialog_share_subject.py
    │   ├── dialog_voice_attendance.py
    │   ├── footer.py
    │   ├── header.py
    │   └── subject_card.py
    ├── database/
    │   ├── config.py
    │   └── db.py
    ├── pipelines/
    │   ├── face_pipeline.py
    │   └── voice_pipeline.py
    ├── screens/
    │   ├── student_screen.py
    │   └── teacher_screen.py
    └── ui/
        └── base_layout.py
```

This is a representative structure, not a guarantee that every listed file or directory exists in every version. Keep the names in this README aligned with the actual files in your repository.

## Requirements

- Python version supported by all packages in your project's dependency file.
- pip.
- A Supabase project and its database credentials.
- A working camera for live image capture, if using that feature.
- A microphone or recorded audio for voice attendance.
- Windows, Linux, or macOS. Installation of native packages such as `dlib` can vary by operating system and Python version.

## Installation

### 1. Clone the repository or open your project folder

If the repository is hosted on GitHub:

```bash
git clone <YOUR_REPOSITORY_URL>
cd FaceVPlus
```

If you already have the project locally, open a terminal in the `FaceVPlus` root directory.

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation because of the execution policy, you can use Command Prompt instead:

```bat
venv\Scripts\activate.bat
```

**Linux/macOS:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

If `requirements.txt` exists:

```bash
python -m pip --version
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If the dependency file does not exist, create one from your working environment only after checking that the environment contains the packages needed by the project:

```bash
pip freeze > requirements.txt
```

Avoid generating a requirements file from an unrelated or polluted environment. Native packages such as `dlib` may require additional system dependencies or a compatible Python version.

### 4. Configure Supabase secrets

Create the local configuration directory and file:

```text
.streamlit/
└── secrets.toml
```

Add your Supabase project URL and key:

```toml
SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_KEY = "YOUR_SUPABASE_KEY"
```

Use the exact key name expected by `src/database/config.py`. If your code reads a different name, update either the configuration file or the code so the names match.

For example, Streamlit secrets are accessed using item or attribute access:

```python
import streamlit as st
from supabase import create_client

supabase_url = st.secrets["SUPABASE_URL"]
supabase_key = st.secrets["SUPABASE_KEY"]

supabase = create_client(supabase_url, supabase_key)
```

Do **not** use `st.secrets("SUPABASE_URL")`; `st.secrets` is not a function.

Never commit `.streamlit/secrets.toml`, API keys, passwords, or other credentials to Git.

## Environment Configuration

The application's database configuration should read credentials from Streamlit secrets or environment variables. Choose one approach and use it consistently.

For local Streamlit secrets, the configuration file normally lives at:

```text
.streamlit/secrets.toml
```

For deployment, add the same required values to the hosting provider's secret/environment-variable settings instead of uploading the local secrets file.

Before running the application, verify:
- The Supabase URL is correct.
- The key is valid for the intended application access.
- The table names and column names in the database match the queries in `src/database/db.py`.
- Required columns such as `username`, `student_id`, `teacher_id`, `subject_id`, and attendance fields are populated consistently with the schema actually used by the application.

## Database Setup

FaceVPlus uses Supabase as its hosted database. Create and configure the tables referenced by the queries in `src/database/db.py` and the screen/dialog modules.

The current code has referenced tables such as:

- `students` — student account details and recognition profiles.
- `teachers` — teacher account details.
- `subjects` — subjects created by teachers.
- `subject_students` — relationship between students and subjects.
- An attendance table — attendance records for a student and subject, with a timestamp and presence status.

These are logical roles; use the exact table names, foreign keys, constraints, and column names required by your current SQL queries. Do not create duplicate tables solely because a name appears in this README.

### Database checklist

- Define primary keys for the tables.
- Add appropriate foreign-key relationships.
- Ensure required columns have values before inserting records.
- Make sure the student-subject relationship prevents unintended duplicate enrollments.
- Decide how duplicate attendance records for the same student, subject, and class session should be handled.
- Configure Supabase Row Level Security (RLS) and policies before exposing the application publicly.
- Test inserts, selects, updates, and deletes using the intended application role.

**Important:** Never disable security policies on a public production database just to make an error disappear. Fix the policy or use a properly secured server-side operation.

## Run the Application

From the project root, activate the virtual environment and run:

```bash
streamlit run app.py
```

Streamlit normally opens the application in your browser. If it does not, use the local URL printed in the terminal, usually:

```text
http://localhost:8501
```

To stop the server, press `Ctrl+C` in the terminal.

## How to Use FaceVPlus

The exact buttons and navigation depend on the current UI implementation.

### Teacher workflow

1. Open the application and enter the teacher portal.
2. Register or log in.
3. Create a subject, or select an existing subject.
4. Enroll students or share the subject information using the available enrollment workflow.
5. Select the correct subject before starting attendance.
6. For face attendance, capture or upload classroom photos.
7. For voice attendance, record classroom audio and choose **Analyze Audio**.
8. Review the proposed attendance results carefully.
9. Choose **Confirm & Save** to persist the attendance, or **Discard** to cancel.
10. Open the attendance report feature, if available, to review saved records.

### Student workflow

1. Open the student portal.
2. Register or log in using the configured authentication method.
3. Complete any required face or voice profile enrollment.
4. Enroll in a subject if the workflow allows it.
5. View enrolled subjects and attendance details, where supported.

### Attendance review

Attendance should be reviewed before saving. A recognition result is a prediction, not proof of identity. Check false matches and missed students, particularly when multiple people speak at once or photos contain occluded faces.

## Recognition Pipeline

### Face recognition

The face pipeline may include these stages, depending on the implementation in `src/pipelines/face_pipeline.py`:

1. Capture or load an image.
2. Detect faces in the image.
3. Generate a numerical face embedding for each detected face.
4. Compare the embedding with enrolled student profiles or pass it to a trained classifier.
5. Associate accepted matches with student IDs.
6. Present proposed attendance for teacher review.

Performance depends on image quality, pose, lighting, occlusion, and the quality of the enrolled samples.

### Voice recognition

The voice pipeline may include these stages, depending on `src/pipelines/voice_pipeline.py`:

1. Record or upload classroom audio.
2. Preprocess the audio into the format expected by the pipeline.
3. Extract voice features or embeddings.
4. Compare the audio with enrolled voice profiles.
5. Return candidate student IDs and match scores.
6. Present proposed attendance for teacher review.

The application should use a validated matching threshold and handle uncertain matches explicitly. A score greater than zero should not automatically be treated as a reliable identity match unless the pipeline guarantees that meaning.

## Attendance Data

An attendance record generally needs to identify:

- The student.
- The subject.
- The time of the attendance event.
- Whether the student was marked present.

The precise schema must match the implementation of `create_attendance()` in `src/database/db.py`.

Before confirming attendance, the application should:
- Verify the selected subject is correct.
- Validate the generated records.
- Prevent duplicate submissions where appropriate.
- Report database errors without silently discarding them.
- Clear temporary review state only after a successful save or an intentional discard.

## Troubleshooting

### `TypeError: voice_attendance_dialog() missing 1 required positional argument: 'selected_subject_id'`

The dialog requires a subject ID:

```python
voice_attendance_dialog(selected_subject_id)
```

Make sure the subject dropdown or selection logic defines `selected_subject_id` before opening the dialog.

### `TypeError: 'Secrets' object is not callable`

Use:

```python
st.secrets["SUPABASE_URL"]
```

or:

```python
st.secrets.SUPABASE_URL
```

Do not call `st.secrets(...)` as a function.

### `KeyError: 'teacher_id'` or another missing database key

Inspect the actual returned dictionary and your Supabase table schema. Confirm that the selected row includes the expected column and that the code uses the correct key name.

### `null value in column username violates not-null constraint`

The insert operation is missing a required `username`. Collect and validate it before insertion, or adjust the schema only if a username is genuinely optional for the application.

### Attendance results do not save

- Check that `create_attendance()` uses the correct table and column names.
- Confirm that each record matches the database schema.
- Check Supabase logs and the exception returned by the database.
- Verify foreign-key values refer to existing students and subjects.
- Check Row Level Security policies.
- Avoid swallowing exceptions without displaying or logging useful details.

### Camera or microphone input is unavailable

- Grant browser permission for the camera and microphone.
- Use a supported browser.
- Check that the selected input device works.
- For remote access, use an appropriate HTTPS deployment; browser media permissions may not work on an ordinary HTTP address outside localhost.

### Streamlit duplicate element ID

Give repeated widgets distinct keys, for example:

```python
st.button("Confirm & Save", key=f"confirm_attendance_{subject_id}")
```

Keys should be stable and unique for the intended widget instance.

### Packages fail to install

- Activate the correct virtual environment first.
- Check the Python version supported by the package.
- Upgrade pip.
- Review native build requirements for `dlib` and other compiled dependencies.
- Install from the project's dependency file rather than mixing unrelated environments.

## Security and Privacy

FaceVPlus processes biometric information, which is sensitive personal data. Before using it with real students:

- Obtain appropriate consent and follow applicable laws and institutional policies.
- Explain what biometric data is collected, why it is collected, and how long it is retained.
- Restrict access to face/voice embeddings and attendance records.
- Protect credentials and never expose service-role keys in frontend code or public repositories.
- Configure database access policies and use least-privilege access.
- Use secure transport (HTTPS) for deployed applications.
- Define procedures to correct attendance errors and delete data when required.
- Do not rely exclusively on automated recognition for consequential attendance decisions; provide human review and a correction process.
- Consider a non-biometric attendance alternative for users who cannot or do not wish to use biometric recognition.

## Future Improvements

Possible next steps include:

- More robust authentication and role-based authorization.
- Teacher attendance reports with date and subject filters.
- Export attendance to CSV or Excel.
- Better handling of uncertain recognition matches.
- Session-based duplicate attendance prevention.
- Improved voice segmentation for overlapping speakers.
- Audit logs for attendance edits and confirmations.
- Automated tests for database functions and recognition pipelines.
- Deployment configuration and monitoring.
- A documented consent, retention, and deletion workflow.

## Contributing

Contributions and suggestions are welcome.

1. Create a branch for your change.
2. Make a focused change.
3. Test the affected workflow locally.
4. Keep credentials and biometric samples out of commits.
5. Submit a pull request or document the proposed change.

## License

No license has been specified here. Add a `LICENSE` file before distributing the project, and choose a license that fits your intended use.
