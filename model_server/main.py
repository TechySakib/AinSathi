"""
AinSathi — Local AI Model Server
=================================
This FastAPI server exposes your trained chatbot model via a simple HTTP API.
The Next.js frontend will call POST /chat on this server.

HOW TO USE:
  1. Place your saved model file (e.g. model.pt, model.h5, model.pkl, weights.json)
     inside this folder or anywhere you prefer.
  2. Fill in the two sections marked with  ──► TODO ◄──  below:
       a) Load your model in  load_model()
       b) Generate a response in  generate_response()
  3. Start the server:
       pip install -r requirements.txt
       python main.py
     It will listen on http://localhost:8000

The Next.js app expects:
  POST /chat
  Body:  { "message": "user text", "history": [{"role":"user","content":"..."}, ...] }
  Reply: { "response": "AI reply text" }
"""

from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager
from typing import Literal

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(message)s")
logger = logging.getLogger("ainsathi")

# ─── Global model holder ─────────────────────────────────────────────────────
# After load_model() runs, store whatever object you need here.
model = None  # e.g. your PyTorch model / Keras model / tokenizer / pipeline


# ════════════════════════════════════════════════════════════════════════════
#  ──► TODO 1 ◄──  Load your model here
# ════════════════════════════════════════════════════════════════════════════
def load_model():
    """
    Load your trained model from disk and return it.
    This runs ONCE at server startup for efficiency.

    Examples (uncomment the one that matches your setup):

    ── PyTorch (.pt / .pth) ──────────────────────────────
    import torch
    from your_model_module import YourModelClass
    m = YourModelClass()
    m.load_state_dict(torch.load("model.pt", map_location="cpu"))
    m.eval()
    return m

    ── TensorFlow / Keras (.h5 or SavedModel) ────────────
    import tensorflow as tf
    return tf.keras.models.load_model("model.h5")

    ── scikit-learn / pickle (.pkl) ──────────────────────
    import pickle
    with open("model.pkl", "rb") as f:
        return pickle.load(f)

    ── JSON weights + NumPy ──────────────────────────────
    import json, numpy as np
    with open("weights.json") as f:
        weights = json.load(f)
    # build your model and load the weights manually
    return weights

    ── Ollama / llama.cpp (subprocess) ───────────────────
    # No file loading needed; just return a config dict
    return {"model_name": "my-legal-model", "host": "http://localhost:11434"}
    """
    # ─── Replace this placeholder ───────────────────────
    logger.warning("⚠  load_model() is not implemented yet — using echo mode.")
    return None  # ← replace with your actual loading code


# ════════════════════════════════════════════════════════════════════════════
#  ──► TODO 2 ◄──  Generate a response from your model
# ════════════════════════════════════════════════════════════════════════════
def generate_response(loaded_model, message: str, history: list[dict]) -> str:
    """
    Given the loaded model, the new user message, and the conversation history,
    return the model's text response.

    `history` is a list of dicts: [{"role": "user"|"assistant", "content": "..."}]

    Examples (uncomment the one that matches your setup):

    ── Simple seq2seq / encoder-decoder ──────────────────
    input_ids = tokenizer.encode(message, return_tensors="pt")
    output_ids = loaded_model.generate(input_ids, max_new_tokens=200)
    return tokenizer.decode(output_ids[0], skip_special_tokens=True)

    ── Template-based with history ───────────────────────
    prompt = ""
    for turn in history[-6:]:   # keep last 6 turns as context
        role = "User" if turn["role"] == "user" else "Assistant"
        prompt += f"{role}: {turn['content']}\\n"
    prompt += f"User: {message}\\nAssistant:"
    return my_inference_function(loaded_model, prompt)

    ── Ollama ────────────────────────────────────────────
    import requests
    r = requests.post("http://localhost:11434/api/chat", json={
        "model": loaded_model["model_name"],
        "messages": history + [{"role": "user", "content": message}],
        "stream": False,
    })
    return r.json()["message"]["content"]
    """
    # ─── Placeholder echo (replace this) ────────────────
    if loaded_model is None:
        return (
            f"⚠ The model server is running in placeholder mode. "
            f"Please implement generate_response() in model_server/main.py. "
            f"You said: \"{message}\""
        )
    # ← replace with your actual inference code
    return f"Model response to: {message}"


# ─── Pydantic schemas ─────────────────────────────────────────────────────────
class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []


class ChatResponse(BaseModel):
    response: str


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────
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


# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="AinSathi Model Server",
    description="Local AI inference server for the AinSathi legal chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow requests from the Next.js dev server (and production)
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


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    """Quick check — the Next.js app uses this to show model status."""
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Main inference endpoint called by Next.js."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    history = [h.model_dump() for h in request.history]

    try:
        reply = generate_response(model, request.message, history)
    except Exception as exc:
        logger.error(f"Inference error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    return ChatResponse(response=reply)


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("MODEL_PORT", "8000"))
    logger.info(f"🌐 AinSathi model server starting on http://localhost:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
