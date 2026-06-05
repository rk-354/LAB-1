import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { scanAndMask } from '@/lib/llm/pii'
import { retrieveChunks, buildRAGPrompt } from '@/lib/rag/retrieval'
import { chat } from '@/lib/llm/router'

const ChatSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  department_slug: z.string(),
})

// GET /api/chat?session_id=xxx
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

// POST /api/chat — real RAG pipeline
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = ChatSchema.parse(await req.json())
    const admin = createAdminClient()

    // 1. PII scan
    const piiResult = scanAndMask(body.message)
    const safeQuery = piiResult.masked

    // Get or create session
    let sessionId = body.session_id
    if (!sessionId) {
      const { data: session } = await admin
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          department_slug: body.department_slug,
          title: body.message.slice(0, 80),
        })
        .select('id')
        .single()
      sessionId = session?.id
    }

    // Save user message
    const { data: userMsg } = await admin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: body.message,
      has_pii: piiResult.hasPII,
      pii_masked: piiResult.hasPII,
    }).select('id').single()

    // Log PII detection
    if (piiResult.hasPII && userMsg) {
      await admin.from('pii_detections').insert({
        message_id: userMsg.id,
        user_id: user.id,
        pii_types: piiResult.types,
        masked: true,
      })
    }

    // 2. Retrieve relevant chunks
    const chunks = await retrieveChunks(safeQuery, body.department_slug, 5, 0.3)

    // 3. Build prompt and call LLM
    let responseContent: string
    let citations: { id: number; doc: string; page: string; dept: string }[] = []
    let llmMeta: { model: string; provider: 'ollama' | 'anthropic'; input_tokens: number; output_tokens: number } = { model: 'llama3.2:3b', provider: 'ollama', input_tokens: 0, output_tokens: 0 }

    if (chunks.length > 0) {
      const systemPrompt = buildRAGPrompt(safeQuery, chunks, body.department_slug)
      const llmResponse = await chat([{ role: 'user', content: safeQuery }], systemPrompt)

      responseContent = llmResponse.content
      llmMeta = {
        model: llmResponse.model,
        provider: llmResponse.provider,
        input_tokens: llmResponse.input_tokens,
        output_tokens: llmResponse.output_tokens,
      }

      citations = chunks.map((c, i) => ({
        id: i + 1,
        doc: c.metadata.filename || 'Unknown',
        page: c.metadata.page ? `p.${c.metadata.page}` : '',
        dept: c.metadata.department || body.department_slug,
      }))
    } else {
      // No relevant chunks found
      const llmResponse = await chat(
        [{ role: 'user', content: safeQuery }],
        `You are a helpful assistant for a refinery's ${body.department_slug} department. No specific documents were found for this query. Provide general guidance and suggest the user upload relevant documents.`
      )
      responseContent = llmResponse.content
      llmMeta = {
        model: llmResponse.model,
        provider: llmResponse.provider,
        input_tokens: llmResponse.input_tokens,
        output_tokens: llmResponse.output_tokens,
      }
    }

    // 4. Save AI response
    const { data: aiMsg } = await admin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: responseContent,
      citations: citations,
      model_used: llmMeta.model,
      provider: llmMeta.provider,
      input_tokens: llmMeta.input_tokens,
      output_tokens: llmMeta.output_tokens,
    }).select('id').single()

    // 5. Log token usage
    await admin.from('token_usage').insert({
      user_id: user.id,
      session_id: sessionId,
      message_id: aiMsg?.id,
      model: llmMeta.model,
      provider: llmMeta.provider,
      input_tokens: llmMeta.input_tokens,
      output_tokens: llmMeta.output_tokens,
    })

    return NextResponse.json({
      data: {
        session_id: sessionId,
        message: responseContent,
        citations,
        model_used: llmMeta.model,
        provider: llmMeta.provider,
        chunks_used: chunks.length,
      },
      error: null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Chat failed'
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }
}
