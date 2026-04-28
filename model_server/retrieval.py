import json
from pathlib import Path

import faiss
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

STORE_DIR = Path("rag_store")
INDEX_PATH = STORE_DIR / "faiss.index"
CHUNKS_PATH = STORE_DIR / "chunks.jsonl"

EMBED_MODEL = "intfloat/multilingual-e5-base"

_chunks = None
_index = None
_embedder = None
_bm25 = None


def tokenize(text: str):
    return str(text).lower().split()


def expand_query(query: str) -> str:
    q = query.strip().lower()
    expanded = query

    if "চুরি" in q:
        expanded += " theft definition stealing dishonest taking movable property penal code 378"
    if "theft" in q:
        expanded += " চুরি dishonest taking movable property penal code 378"
    if "শাস্তি" in q or "punishment" in q:
        expanded += " punishment imprisonment fine penal code"
    if "ধর্ষণ" in q:
        expanded += " rape definition penal code 375 punishment 376"
    if "rape" in q:
        expanded += " ধর্ষণ definition penal code 375 punishment 376"
    if "খুন" in q:
        expanded += " murder homicide definition penal code"
    if "জামিন" in q:
        expanded += " bail criminal procedure"
    if "চুক্তি" in q:
        expanded += " contract agreement definition"
    if "labour" in q or "worker" in q or "শ্রমিক" in q:
        expanded += " Bangladesh Labour Act 2006 শ্রম আইন শ্রমিক অধিকার employment wages safety leave compensation"
    if "land" in q or "জমি" in q:
        expanded += " land dispute land registration property mutation possession Bangladesh law"

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
            tokenize(f"{c['act_title']} {c['year']} {c['section']} {c['status']} {c['text']}")
            for c in _chunks
        ]
        _bm25 = BM25Okapi(tokenized)


def force_include_key_sections(query: str):
    load_retriever()
    q = query.lower()
    results = []

    for c in _chunks:
        title = str(c.get("act_title", "")).lower()
        section = str(c.get("section", "")).strip()

        if "penal code" not in title:
            continue

        should_add = False

        if ("চুরি" in q or "theft" in q) and section.startswith("378"):
            should_add = True

        if ("চুরির শাস্তি" in q or "theft punishment" in q or "punishment for theft" in q) and section.startswith("379"):
            should_add = True

        if ("ধর্ষণ কী" in q or "what is rape" in q or "rape under the penal code" in q) and section.startswith("375"):
            should_add = True

        if ("ধর্ষণের শাস্তি" in q or "rape punishment" in q or "punishment for rape" in q) and section.startswith("376"):
            should_add = True

        if should_add:
            item = dict(c)
            item["hybrid_score"] = 999.0
            results.append(item)

    return results


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
        item = dict(_chunks[int(idx)])
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
        item["bm25_score"] = float(scores[int(idx)])
        results.append(item)

    return results


def hybrid_search(query: str, top_k: int = 3):
    query2 = expand_query(query)
    q_lower = query.lower()

    dense = dense_search(query2, top_k=50)
    lexical = bm25_search(query2, top_k=50)

    merged = {}

    for item in force_include_key_sections(query):
        merged[item["id"]] = item

    for rank, item in enumerate(dense, start=1):
        key = item["id"]
        merged.setdefault(key, item)
        merged[key]["hybrid_score"] = merged[key].get("hybrid_score", 0.0) + (1.0 / (rank + 10))

    for rank, item in enumerate(lexical, start=1):
        key = item["id"]
        merged.setdefault(key, item)
        merged[key]["hybrid_score"] = merged[key].get("hybrid_score", 0.0) + (1.0 / (rank + 10))

    for item in merged.values():
        text = str(item.get("text", "")).lower()
        title = str(item.get("act_title", "")).lower()
        section = str(item.get("section", "")).strip()

        if "whoever" in text or "means" in text or "is said to commit" in text or "defined" in text:
            item["hybrid_score"] += 0.08

        if "penal code" in title:
            item["hybrid_score"] += 0.05

        if ("চুরি" in q_lower or "theft" in q_lower) and "penal code" in title and section.startswith("378"):
            item["hybrid_score"] += 0.35

        if ("শাস্তি" in q_lower or "punishment" in q_lower) and "penal code" in title and section.startswith("379"):
            item["hybrid_score"] += 0.35

        if ("ধর্ষণ কী" in q_lower or "what is rape" in q_lower) and "penal code" in title and section.startswith("375"):
            item["hybrid_score"] += 0.35

        if ("ধর্ষণের শাস্তি" in q_lower or "rape punishment" in q_lower) and "penal code" in title and section.startswith("376"):
            item["hybrid_score"] += 0.35

        if ("labour" in q_lower or "worker" in q_lower or "শ্রমিক" in q_lower) and (
            "labour act" in title or "শ্রম আইন" in title
        ):
            item["hybrid_score"] += 0.5

    ranked = sorted(merged.values(), key=lambda x: x.get("hybrid_score", 0.0), reverse=True)
    return ranked[:top_k]


if __name__ == "__main__":
    results = hybrid_search("চুরি কী", top_k=3)
    print(json.dumps(results, ensure_ascii=False, indent=2))