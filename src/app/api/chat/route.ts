import { NextRequest, NextResponse } from 'next/server'

// ─── Types ───────────────────────────────────────────────
type HistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

// ─── Config ──────────────────────────────────────────────
const MODEL_SERVER_URL = process.env.LOCAL_MODEL_URL ?? 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json() as {
      message: string
      history?: HistoryMessage[]
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Forward to the local Python model server
    let modelResponse: Response
    try {
      modelResponse = await fetch(`${MODEL_SERVER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          history: history ?? [],
        }),
        // Give it up to 60 seconds (local models can be slow)
        signal: AbortSignal.timeout(60_000),
      })
    } catch (fetchErr: unknown) {
      // Model server is probably not running
      const isTimeout =
        fetchErr instanceof Error && fetchErr.name === 'TimeoutError'
      return NextResponse.json(
        {
          error: isTimeout
            ? 'The AI model timed out. Please try again.'
            : 'Could not connect to the AI model server. Make sure it is running on ' +
              MODEL_SERVER_URL,
        },
        { status: 503 }
      )
    }

    if (!modelResponse.ok) {
      const errBody = await modelResponse.text().catch(() => '')
      console.error('Model server error:', modelResponse.status, errBody)
      return NextResponse.json(
        { error: `Model server returned ${modelResponse.status}` },
        { status: 502 }
      )
    }

    const data = await modelResponse.json() as { response?: string; error?: string }

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 })
    }

    return NextResponse.json({ response: data.response ?? '' })

  } catch (err: unknown) {
    console.error('Chat API error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
