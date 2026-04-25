import json
from pathlib import Path

import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer

DATA_PATH = Path("data/legal_sections.csv")
OUT_DIR = Path("rag_store")
OUT_DIR.mkdir(parents=True, exist_ok=True)

EMBED_MODEL = "intfloat/multilingual-e5-base"


def make_embed_text(row):
    act = str(row.get("act_title", "")).strip()
    year = str(row.get("year", "")).strip()
    section = str(row.get("section", "")).strip()
    status = str(row.get("status", "")).strip()
    text = str(row.get("text", "")).strip()

    return f"passage: {act} ({year}) Section {section} [{status}]\n{text}"


def main():
    df = pd.read_csv(DATA_PATH).fillna("")
    records = []

    for _, row in df.iterrows():
        rec = {
            "id": str(row["id"]).strip(),
            "act_title": str(row["act_title"]).strip(),
            "year": str(row["year"]).strip(),
            "section": str(row["section"]).strip(),
            "status": str(row["status"]).strip(),
            "text": str(row["text"]).strip(),
        }
        rec["embed_text"] = make_embed_text(rec)
        records.append(rec)

    model = SentenceTransformer(EMBED_MODEL)

    embeddings = model.encode(
        [r["embed_text"] for r in records],
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=True,
    ).astype("float32")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, str(OUT_DIR / "faiss.index"))

    with open(OUT_DIR / "chunks.jsonl", "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    with open(OUT_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "embed_model": EMBED_MODEL,
                "count": len(records),
                "dim": int(embeddings.shape[1]),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("Index built successfully.")


if __name__ == "__main__":
    main()