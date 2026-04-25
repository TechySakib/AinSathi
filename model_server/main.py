from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager
from typing import Literal

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(message)s")
logger = logging.getLogger("ainsathi")

model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_PATH = os.getenv("MODEL_PATH", "./models/ainsathi_qwen_merged")

SYSTEM_PROMPT = """You are AinSathi, a bilingual legal assistant for Bangladesh legal acts.
Answer carefully and helpfully.
Rules:
1. Do not invent legal facts.
2. If the answer is not supported, say: "Insufficient evidence in provided context."
3. Match the user's language when possible.
4. Be concise and clear.
"""

def load_model():
    global tokenizer

    logger.info(f"Loading model from: {MODEL_PATH}")
    logger.info(f"Model path exists: {os.path.exists(MODEL_PATH)}")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model folder not found: {MODEL_PATH}")

    logger.info(f"Model files: {os.listdir(MODEL_PATH)}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    loaded_model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=dtype,
        trust_remote_code=True,
    )

    loaded_model.to(device)
    loaded_model.eval()
    return loaded_model


def build_prompt(message: str, history: list[dict]) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history[-6:]:
        role = turn.get("role", "user")
        content = str(turn.get("content", "")).strip()
        if not content:
            continue
        if role not in ("user", "assistant"):
            role = "user"
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    return prompt


def generate_response(loaded_model, message: str, history: list[dict]) -> str:
    if loaded_model is None or tokenizer is None:
        raise RuntimeError("Model is not loaded.")

    prompt = build_prompt(message, history)

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    prompt_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = loaded_model.generate(
            **inputs,
            max_new_tokens=220,
            do_sample=False,
            temperature=1.0,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][prompt_len:]
    reply = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    if not reply:
        reply = "Insufficient evidence in provided context."

    return reply


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []


class ChatResponse(BaseModel):
    response: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info("🚀 Loading AI model…")
    try:
        model = load_model()
        logger.info("✅ Model loaded successfully.")
    except Exception as exc:
        logger.error(f"❌ Failed to load model: {exc}")
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
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load. Check server logs.")

    history = [h.model_dump() for h in request.history]

    try:
        reply = generate_response(model, request.message, history)
    except Exception as exc:
        logger.error(f"Inference error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    return ChatResponse(response=reply)


if __name__ == "__main__":
    port = int(os.getenv("MODEL_PORT", "8000"))
    logger.info(f"🌐 AinSathi model server starting on http://localhost:{port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        http="h11"
    )