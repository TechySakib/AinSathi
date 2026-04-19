# AinSathi Model Server

This folder contains the local Python AI model server that powers the AinSathi chatbot.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Edit main.py — fill in your model-specific code in:
#    - load_model()         ← load your weights file
#    - generate_response()  ← run inference and return a string

# 3. Start the server
python main.py
# → Listening on http://localhost:8000
```

## API Contract

The Next.js frontend calls:

```
POST http://localhost:8000/chat
Content-Type: application/json

{
  "message": "What is Section 302?",
  "history": [
    { "role": "user",      "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}
```

Expected response:
```json
{ "response": "Your answer here..." }
```

Health check: `GET http://localhost:8000/health`

## Supported Model Formats

The `load_model()` / `generate_response()` functions in `main.py` include
commented-out examples for:

| Framework     | File format              |
|---------------|--------------------------|
| PyTorch       | `.pt` / `.pth`           |
| TensorFlow    | `.h5` / SavedModel dir   |
| scikit-learn  | `.pkl`                   |
| JSON weights  | `.json` + any loader     |
| Ollama        | no file needed           |
| llama.cpp     | `.gguf` via subprocess   |

## Environment Variables

| Variable      | Default              | Description                    |
|---------------|----------------------|--------------------------------|
| `MODEL_PORT`  | `8000`               | Port to listen on              |
| `NEXTJS_ORIGIN` | (empty)            | Add your production domain for CORS |

## Project Integration

Set in `.env.local` of the Next.js project:

```env
LOCAL_MODEL_URL=http://localhost:8000
```
