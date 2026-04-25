import json
from pathlib import Path

import faiss
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

STORE_DIR = Path("./rag_store")
INDEX_PATH = STORE_DIR / "faiss.index"
CHUNKS_PATH = STORE_DIR / "chunks.jsonl"

EMBED_MODEL = "intfloat/multilingual-e5-base"

_chunks = None
_index = None
_embedder = None
_bm25 = None


def tokenize(text: str):
    return text.lower().split()


def expand_query(query: str) -> str:
    q = query.strip().lower()
    expanded = query

    # Bengali legal concept expansion
    if "চুরি" in q:
        expanded += " theft definition stealing dishonest taking movable property penal code 378"
    if "খুন" in q:
        expanded += " murder homicide definition penal code"
    if "ধর্ষণ" in q:
        expanded += " rape definition penal code"
    if "চুক্তি" in q:
        expanded += " contract agreement definition"
    if "জামিন" in q:
        expanded += " bail criminal procedure"

    # English definition-style expansion
    if "what is" in q or "define" in q or "meaning" in q:
        expanded += " definition meaning interpreted"

    return expanded


def load_retriever():
    global _chunks, _index, _embedder, _bm25

    if _chunks is None:
        with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
            _chunks = [json.loads(line) for line in f]

    if _index is None:
        _index = faiss.read_index(str(INDEX_PATH))

    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL)

    if _bm25 is None:
        tokenized = [
            tokenize(
                f"{c['act_title']} {c['year']} {c['section']} {c['status']} {c['text']}"
            )
            for c in _chunks
        ]
        _bm25 = BM25Okapi(tokenized)


def dense_search(query: str, top_k: int = 10):
    load_retriever()
    q = _embedder.encode(
        [f"query: {query}"],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype("float32")

    scores, idxs = _index.search(q, top_k)
    results = []

    for score, idx in zip(scores[0], idxs[0]):
        if idx == -1:
            continue
        item = dict(_chunks[idx])
        item["dense_score"] = float(score)
        results.append(item)

    return results


def bm25_search(query: str, top_k: int = 10):
    load_retriever()
    scores = _bm25.get_scores(tokenize(query))
    top_idxs = np.argsort(scores)[::-1][:top_k]

    results = []
    for idx in top_idxs:
        item = dict(_chunks[int(idx)])
        item["bm25_score"] = float(scores[idx])
        results.append(item)

    return results


def hybrid_search(query: str, top_k: int = 3):
    query2 = expand_query(query)

    dense = dense_search(query2, top_k=12)
    lexical = bm25_search(query2, top_k=12)

    merged = {}

    for rank, item in enumerate(dense, start=1):
        key = item["id"]
        merged.setdefault(key, item)
        merged[key]["hybrid_score"] = merged[key].get("hybrid_score", 0.0) + (1.0 / (rank + 10))

    for rank, item in enumerate(lexical, start=1):
        key = item["id"]
        merged.setdefault(key, item)
        merged[key]["hybrid_score"] = merged[key].get("hybrid_score", 0.0) + (1.0 / (rank + 10))

    # Boost definition-like sections
    for item in merged.values():
        text = item.get("text", "").lower()
        title = item.get("act_title", "").lower()

        if "whoever" in text or "means" in text or "defined" in text:
            item["hybrid_score"] += 0.05

        if "penal code" in title:
            item["hybrid_score"] += 0.03

    ranked = sorted(merged.values(), key=lambda x: x.get("hybrid_score", 0.0), reverse=True)
    return ranked[:top_k]


if __name__ == "__main__":
    results = hybrid_search("চুরি কী?", top_k=3)
    print(json.dumps(results, ensure_ascii=False, indent=2))