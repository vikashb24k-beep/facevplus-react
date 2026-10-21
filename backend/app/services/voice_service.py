import io
from typing import Any, Dict, List, Optional, Tuple
import librosa
import numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav
from backend.app.core.config import settings

_voice_encoder = None


def get_voice_encoder() -> VoiceEncoder:
    """Lazy-load and cache the VoiceEncoder model."""
    global _voice_encoder
    if _voice_encoder is None:
        _voice_encoder = VoiceEncoder()
    return _voice_encoder


def get_voice_embedding(audio_bytes: bytes) -> Optional[List[float]]:
    """
    Compute a 256D speaker embedding from audio bytes.
    Used for student voice profile registration.
    """
    if not audio_bytes or len(audio_bytes) < 1000:
        return None
    try:
        encoder = get_voice_encoder()
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        if len(audio) < sr * 0.5:
            # Utterance too short (less than 0.5s)
            return None
        wav = preprocess_wav(audio)
        embedding = encoder.embed_utterance(wav)
        return [float(x) for x in embedding.tolist()]
    except Exception as e:
        return None


def identify_speaker_segment(
    embedding: np.ndarray,
    candidates_dict: Dict[int, List[float]],
    threshold: float = 0.65
) -> Tuple[Optional[int], float]:
    """
    Match utterance embedding against candidate student voice profiles using cosine similarity.
    Returns (student_id, score) if score >= threshold, else (None, best_score).
    Embeddings are L2-normalized before computing cosine similarity.
    """
    best_sid = None
    best_score = -1.0

    # Normalize query embedding for true cosine similarity
    embedding_norm = embedding / (np.linalg.norm(embedding) + 1e-8)

    for sid, stored_embedding in candidates_dict.items():
        if stored_embedding and len(stored_embedding) == 256:
            cand_vec = np.array(stored_embedding, dtype=np.float32)
            cand_norm = cand_vec / (np.linalg.norm(cand_vec) + 1e-8)
            similarity = float(np.dot(embedding_norm, cand_norm))
            if similarity > best_score:
                best_score = similarity
                best_sid = sid

    if best_score >= threshold and best_sid is not None:
        return best_sid, best_score

    return None, max(best_score, 0.0)


def process_bulk_audio_attendance(
    audio_bytes: bytes,
    enrolled_students: List[Dict[str, Any]],
    threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Segment classroom audio, match each speech segment against candidate profiles,
    and return detected students with scores.
    """
    if threshold is None:
        threshold = settings.VOICE_RESEMBLANCE_THRESHOLD

    if not audio_bytes or len(audio_bytes) < 1000:
        raise ValueError("Audio recording is empty or corrupt.")

    # Filter students who have voice embeddings
    candidates_dict = {
        int(s["student_id"]): s["voice_embedding"]
        for s in enrolled_students
        if s.get("voice_embedding") and len(s["voice_embedding"]) == 256
    }

    if not candidates_dict:
        return {
            "detected_scores": {},
            "segments_processed": 0,
            "warning": "No enrolled students have registered a voice profile."
        }

    encoder = get_voice_encoder()
    audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)

    # Split audio by silence (top_db=30)
    segments = librosa.effects.split(audio, top_db=30)
    identified_results: Dict[int, float] = {}
    valid_segments_count = 0

    for start, end in segments:
        # Ignore segments shorter than 0.4 seconds
        if (end - start) < sr * 0.4:
            continue

        valid_segments_count += 1
        segment_audio = audio[start:end]
        wav = preprocess_wav(segment_audio)
        embedding = encoder.embed_utterance(wav)

        sid, score = identify_speaker_segment(embedding, candidates_dict, threshold=threshold)
        if sid is not None:
            if sid not in identified_results or score > identified_results[sid]:
                identified_results[sid] = round(score, 4)

    return {
        "detected_scores": identified_results,
        "segments_processed": valid_segments_count,
        "warning": None,
    }

