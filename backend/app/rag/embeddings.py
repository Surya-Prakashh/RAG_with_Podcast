import json
import math
import hashlib
from typing import List
import numpy as np

# Global sentence transformer model cache
_embedding_model = None
_sentence_transformers_failed = False

def get_text_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional normalized vector for text.
    First attempts SentenceTransformer("all-MiniLM-L6-v2").
    Falls back gracefully to high-performance feature hash vector representation.
    """
    global _embedding_model, _sentence_transformers_failed

    if not _sentence_transformers_failed and _embedding_model is None:
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                from sentence_transformers import SentenceTransformer
                _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception:
            _sentence_transformers_failed = True

    if _embedding_model is not None and not _sentence_transformers_failed:
        try:
            vec = _embedding_model.encode(text, convert_to_numpy=True)
            return vec.tolist()
        except Exception:
            _sentence_transformers_failed = True

    # High-Performance 384-dim Hashing Vectorizer Fallback
    dim = 384
    vec = np.zeros(dim, dtype=np.float32)
    words = text.lower().split()
    if not words:
        return vec.tolist()

    for w in words:
        # MD5 hash mapping to 384 dimensions
        h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h % 2 == 0) else -1.0
        vec[idx] += sign

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
