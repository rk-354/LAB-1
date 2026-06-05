import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ChatSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  department_slug: z.string(),
})

// GET /api/chat?session_id=xxx — get message history for a session
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ data: null, error: 'session_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, citations, model_used, provider, input_tokens, output_tokens, cached, feedback, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

// POST /api/chat — send a message, get AI response (SSE streaming)
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = ChatSchema.parse(await req.json())
    const admin = createAdminClient()

    // Get or create session
    let sessionId = body.session_id
    if (!sessionId) {
      const { data: session } = await admin
        .from('chat_sessions')
        .insert({ user_id: user.id, department_slug: body.department_slug })
        .select('id')
        .single()
      sessionId = session?.id
    }

    // Save user message
    await admin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: body.message,
    })

    // TODO: PII scan → RAG retrieval → LLM call (implemented in next phase)
    // For now: return a structured placeholder so the UI works end-to-end
    const placeholderResponse = {
      session_id: sessionId,
      message: 'RAG pipeline is being connected. Ollama + pgvector retrieval coming next.',
      citations: [],
      model_used: 'ollama/llama3.2:3b',
      provider: 'ollama',
    }

    // Save assistant message
    const { data: aiMsg } = await admin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: placeholderResponse.message,
        citations: placeholderResponse.citations,
        model_used: placeholderResponse.model_used,
        provider: placeholderResponse.provider,
      })
      .select('id')
      .single()

    // Log token usage
    await admin.from('token_usage').insert({
      user_id: user.id,
      session_id: sessionId,
      message_id: aiMsg?.id,
      model: 'llama3.2:3b',
      provider: 'ollama',
      input_tokens: 0,
      output_tokens: 0,
    })

    return NextResponse.json({ data: placeholderResponse, error: null })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}
