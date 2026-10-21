import io
from typing import Any, Dict, List, Optional, Tuple
import dlib
import face_recognition_models
import numpy as np
from PIL import Image
from sklearn.svm import SVC
from backend.app.core.config import settings

_detector = None
_shape_predictor = None
_face_rec_model = None


def get_dlib_models():
    """Lazy-load and cache dlib models."""
    global _detector, _shape_predictor, _face_rec_model
    if _detector is None or _shape_predictor is None or _face_rec_model is None:
        _detector = dlib.get_frontal_face_detector()
        _shape_predictor = dlib.shape_predictor(
            face_recognition_models.pose_predictor_model_location()
        )
        _face_rec_model = dlib.face_recognition_model_v1(
            face_recognition_models.face_recognition_model_location()
        )
    return _detector, _shape_predictor, _face_rec_model


def extract_face_embeddings(image_np: np.ndarray) -> List[np.ndarray]:
    """Extract 128D facial descriptors for all faces in image."""
    detector, shape_predictor, face_rec_model = get_dlib_models()
    faces = detector(image_np, 1)
    encodings = []
    for face in faces:
        shape = shape_predictor(image_np, face)
        descriptor = face_rec_model.compute_face_descriptor(image_np, shape, 1)
        encodings.append(np.array(descriptor, dtype=np.float64))
    return encodings


def image_bytes_to_numpy(image_bytes: bytes) -> np.ndarray:
    """Safely decode image bytes into RGB numpy array."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        return np.array(image)
    except Exception as e:
        raise ValueError(f"Invalid image format or corrupt file: {e}")


def match_embedding_to_candidates(
    encoding: np.ndarray,
    candidates: List[Dict[str, Any]],
    threshold: float = 0.55
) -> Optional[Tuple[int, float]]:
    """
    Match a 128D face descriptor to candidate student profiles.
    Returns (student_id, distance) if distance <= threshold, else None.
    """
    best_student_id = None
    min_distance = float("inf")

    # If 2 or more candidates exist, train/check SVM as secondary classifier
    clf = None
    X_train, y_train = [], []
    for c in candidates:
        emb = c.get("face_embedding")
        if emb:
            X_train.append(np.array(emb, dtype=np.float64))
            y_train.append(int(c["student_id"]))

    if len(set(y_train)) >= 2:
        try:
            clf = SVC(kernel="linear", class_weight="balanced")
            clf.fit(X_train, y_train)
        except Exception:
            clf = None

    # Compute Euclidean distance across all candidate embeddings
    for c in candidates:
        emb = c.get("face_embedding")
        if not emb:
            continue
        candidate_vec = np.array(emb, dtype=np.float64)
        dist = float(np.linalg.norm(candidate_vec - encoding))
        if dist < min_distance:
            min_distance = dist
            best_student_id = int(c["student_id"])

    # If SVM is available and predicts a valid class, verify agreement
    if clf is not None and best_student_id is not None:
        try:
            predicted_svm = int(clf.predict([encoding])[0])
            # If SVM prediction matches or has acceptable distance, accept
            if predicted_svm in y_train:
                svm_idx = y_train.index(predicted_svm)
                svm_dist = float(np.linalg.norm(X_train[svm_idx] - encoding))
                if svm_dist <= threshold and svm_dist < min_distance * 1.05:
                    min_distance = svm_dist
                    best_student_id = predicted_svm
        except Exception:
            pass

    if min_distance <= threshold and best_student_id is not None:
        return best_student_id, min_distance
    return None


def recognize_faces_in_images(
    images_bytes_list: List[bytes],
    enrolled_students: List[Dict[str, Any]],
    threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Process classroom photos and return detected student IDs and sources.
    """
    if threshold is None:
        threshold = settings.FACE_RESEMBLANCE_THRESHOLD

    all_detected_ids: Dict[int, List[str]] = {}
    total_faces_found = 0

    candidates = [
        s for s in enrolled_students
        if s.get("face_embedding") and len(s["face_embedding"]) == 128
    ]

    for idx, img_bytes in enumerate(images_bytes_list):
        photo_label = f"Photo {idx + 1}"
        try:
            img_np = image_bytes_to_numpy(img_bytes)
            encodings = extract_face_embeddings(img_np)
            total_faces_found += len(encodings)

            for enc in encodings:
                match = match_embedding_to_candidates(enc, candidates, threshold=threshold)
                if match:
                    sid, _ = match
                    all_detected_ids.setdefault(sid, []).append(photo_label)
        except Exception as e:
            # Continue processing remaining photos
            continue

    return {
        "detected_student_ids": all_detected_ids,
        "total_faces_found": total_faces_found,
    }


def identify_student_for_login(
    image_bytes: bytes,
    all_students: List[Dict[str, Any]],
    threshold: Optional[float] = None
) -> Tuple[Optional[Dict[str, Any]], int, str]:
    """
    Single-face authentication for student login.
    Returns (student_or_none, num_faces, message).
    """
    if threshold is None:
        threshold = settings.FACE_RESEMBLANCE_THRESHOLD

    img_np = image_bytes_to_numpy(image_bytes)
    encodings = extract_face_embeddings(img_np)

    num_faces = len(encodings)
    if num_faces == 0:
        return None, 0, "No face detected in the frame. Please look directly at the camera."
    if num_faces > 1:
        return None, num_faces, "Multiple faces detected. Please ensure only you are visible."

    candidates = [
        s for s in all_students
        if s.get("face_embedding") and len(s["face_embedding"]) == 128
    ]

    match = match_embedding_to_candidates(encodings[0], candidates, threshold=threshold)
    if match:
        sid, _ = match
        student = next((s for s in all_students if s["student_id"] == sid), None)
        return student, 1, "Face recognized successfully."

    return None, 1, "Face not recognized. You may need to create an account."

