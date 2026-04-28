from __future__ import annotations

import os
import re
import logging
from contextlib import asynccontextmanager
from typing import Literal

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

from retrieval import hybrid_search, load_retriever

logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(message)s")
logger = logging.getLogger("ainsathi")

torch.set_num_threads(4)

model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_PATH = os.getenv("MODEL_PATH", "./models/ainsathi_qwen_merged")


SYSTEM_PROMPT = """You are AinSathi, a bilingual legal assistant for Bangladesh legal acts.

Rules:
1. Answer ONLY from the provided legal context.
2. Do not invent facts.
3. If the context does not answer the question, reply exactly: Insufficient evidence in provided context.
4. Do not repeat the prompt or instructions.
5. Do not write headings like Question, Answer, Legal Context, or Inline Citations.
6. Summarize simply.
7. Add citations only like [C1], [C2].
"""


def is_bangla(text: str) -> bool:
    return any("\u0980" <= ch <= "\u09FF" for ch in text)


def clean_act_title(title: str) -> str:
    return re.sub(r"^\d+", "", str(title)).strip()


def is_legal_query(message: str) -> bool:
    q = message.lower()
    legal_terms = [
        "আইন", "ধারা", "অপরাধ", "শাস্তি", "মামলা", "জমি", "চুরি", "ধর্ষণ",
        "খুন", "জামিন", "চুক্তি", "শ্রমিক", "অধিকার", "penal", "code",
        "law", "act", "section", "punishment", "rights", "theft", "rape",
        "murder", "bail", "land", "labour", "worker", "dispute"
    ]
    return any(term in q for term in legal_terms)


def clean_model_reply(reply: str) -> str:
    bad_phrases = [
        "Do not add extra comments or explanations outside the provided context.",
        "This question requires answering from just one provision of the code.",
        "Provide your answer below.",
        "Question:",
        "(Provided Legal Context)",
        "Provided Legal Context",
        "Legal Context:",
        "Provide a simple summary of the supporting inline citations.",
        "Inline Citations:",
        "supporting context ID inline [Cxxx].",
        "supporting context IDs inline like [C1], [C2].",
        "Answer:",
        "assistant",
    ]

    for phrase in bad_phrases:
        reply = reply.replace(phrase, "")

    reply = re.sub(r"\n{3,}", "\n\n", reply)
    return reply.strip()


def load_model():
    global tokenizer

    logger.info(f"Loading model from: {MODEL_PATH}")
    logger.info(f"Model path exists: {os.path.exists(MODEL_PATH)}")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model folder not found: {MODEL_PATH}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    loaded_model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        dtype=dtype,
        trust_remote_code=True,
    )

    loaded_model.to(device)
    loaded_model.eval()
    return loaded_model


def normalize_citations_for_response(retrieved: list[dict]) -> list[dict]:
    citations = []

    for i, item in enumerate(retrieved, start=1):
        citations.append({
            "id": f"C{i}",
            "act_title": clean_act_title(item.get("act_title", "")),
            "year": str(item.get("year", "")).strip(),
            "section": str(item.get("section", "")).strip(),
            "status": str(item.get("status", "")).strip(),
            "text": str(item.get("text", "")).strip()[:900],
        })

    return citations


def build_context(citations: list[dict]) -> str:
    blocks = []

    for item in citations:
        header = f"{item['act_title']}, {item['year']} — Section {item['section']}"
        if item["status"]:
            header += f" [{item['status']}]"

        blocks.append(f"[{item['id']}] {header}\n{item['text']}")

    return "\n\n".join(blocks)


def build_prompt(message: str, history: list[dict], citations: list[dict]) -> str:
    context_block = build_context(citations)
    lang_instruction = "Answer in Bangla." if is_bangla(message) else "Answer in English."

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history[-2:]:
        role = turn.get("role", "user")
        content = str(turn.get("content", "")).strip()
        if content and role in ("user", "assistant"):
            messages.append({"role": role, "content": content})

    user_content = f"""Use the legal context below to answer the question.

{lang_instruction}

Question:
{message}

Legal Context:
{context_block}

Rules:
- Give only the final answer.
- Do not repeat these rules.
- Do not copy the prompt.
- Do not include headings like Question or Answer.
- Summarize simply.
- Cite sources like [C1], [C2].
- If the context does not answer the question, say exactly: Insufficient evidence in provided context.
"""

    messages.append({"role": "user", "content": user_content})

    return tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )


def extract_high_confidence_answer(citations: list[dict], user_query: str) -> str | None:
    q = user_query.strip().lower()
    bangla = is_bangla(user_query)

    if q in {"চুরি কী", "চুরি কী?", "what is theft", "what is theft?", "theft definition", "theft meaning"}:
        for item in citations:
            if item["section"].startswith("378") and "penal code" in item["act_title"].lower():
                return (
                    "চুরি হলো কোনো ব্যক্তির সম্মতি ছাড়া অসৎ উদ্দেশ্যে তার দখল থেকে অস্থাবর সম্পত্তি সরিয়ে নেওয়া। [C1]"
                    if bangla else
                    "Theft means dishonestly taking movable property out of a person's possession without consent. [C1]"
                )

    if "চুরির শাস্তি" in q or "চুরি করলে" in q or "theft punishment" in q or "punishment for theft" in q:
        for item in citations:
            if item["section"].startswith("379") and "penal code" in item["act_title"].lower():
                return (
                    "চুরি করলে সর্বোচ্চ ৩ বছর পর্যন্ত কারাদণ্ড, জরিমানা, অথবা উভয় দণ্ড হতে পারে। [C1]"
                    if bangla else
                    "The punishment for theft may be imprisonment for up to 3 years, a fine, or both. [C1]"
                )

    if q in {"ধর্ষণ কী", "ধর্ষণ কী?", "what is rape", "what is rape?", "what is rape under the penal code?"}:
        for item in citations:
            if item["section"].startswith("375") and "penal code" in item["act_title"].lower():
                return (
                    "দণ্ডবিধির ধারা ৩৭৫ অনুযায়ী, নির্দিষ্ট পরিস্থিতিতে নারীর সম্মতি ছাড়া বা আইনগতভাবে অকার্যকর সম্মতির ভিত্তিতে যৌন সহবাস ধর্ষণ হিসেবে গণ্য হয়। [C1]"
                    if bangla else
                    "Under Penal Code section 375, rape is defined by sexual intercourse in specified circumstances where consent is absent, invalid, or legally ineffective. [C1]"
                )

    if "ধর্ষণের শাস্তি" in q or "rape punishment" in q or "punishment for rape" in q:
        for item in citations:
            if item["section"].startswith("376") and "penal code" in item["act_title"].lower():
                return (
                    "ধর্ষণের শাস্তি হিসেবে যাবজ্জীবন কারাদণ্ড বা সর্বোচ্চ ১০ বছর পর্যন্ত কারাদণ্ড এবং জরিমানা হতে পারে। [C1]"
                    if bangla else
                    "The punishment for rape may be imprisonment for life or up to 10 years, and also a fine. [C1]"
                )

    return None


def generate_response(loaded_model, message: str, history: list[dict]) -> tuple[str, list[dict]]:
    if loaded_model is None or tokenizer is None:
        raise RuntimeError("Model is not loaded.")

    if not is_legal_query(message):
        return "Insufficient evidence in provided context.", []

    retrieved = hybrid_search(message, top_k=3)

    if not retrieved:
        return "Insufficient evidence in provided context.", []

    citations = normalize_citations_for_response(retrieved)

    shortcut = extract_high_confidence_answer(citations, message)
    if shortcut:
        return shortcut, citations

    prompt = build_prompt(message, history, citations)

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=900,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    prompt_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = loaded_model.generate(
            **inputs,
            max_new_tokens=180,
            do_sample=False,
            temperature=1.0,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][prompt_len:]
    reply = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
    reply = clean_model_reply(reply)

    if not reply:
        reply = "Insufficient evidence in provided context."

    return reply, citations


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []


class CitationItem(BaseModel):
    id: str
    act_title: str
    year: str
    section: str
    status: str | None = ""
    text: str


class ChatResponse(BaseModel):
    response: str
    citations: list[CitationItem] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info("🚀 Loading AI model…")
    try:
        load_retriever()
        logger.info("✅ Retriever loaded successfully.")

        model = load_model()
        logger.info("✅ Model loaded successfully.")
    except Exception as exc:
        logger.error(f"❌ Failed to load backend: {exc}")
        model = None
    yield
    logger.info("👋 Shutting down model server.")


app = FastAPI(
    title="AinSathi Model Server",
    description="Local AI inference server for the AinSathi legal chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("NEXTJS_ORIGIN", ""),
    ],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": device,
        "model_path": MODEL_PATH,
        "model_path_exists": os.path.exists(MODEL_PATH),
        "rag_enabled": True,
    }


@app.get("/debug-retrieve")
def debug_retrieve(q: str):
    try:
        retrieved = hybrid_search(q, top_k=3)
        citations = normalize_citations_for_response(retrieved)
        return {"query": q, "results": citations}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load. Check server logs.")

    history = [h.model_dump() for h in request.history]

    try:
        reply, citations = generate_response(model, request.message, history)
    except Exception as exc:
        logger.error(f"Inference error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    return ChatResponse(response=reply, citations=citations)


if __name__ == "__main__":
    port = int(os.getenv("MODEL_PORT", "8001"))
    logger.info(f"🌐 AinSathi model server starting on http://localhost:{port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        http="h11",
    )