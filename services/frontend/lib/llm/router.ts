// LLM Router — Ollama (primary) → NVIDIA NIM (fallback)
// All LLM calls go through this file. Never call providers directly.

import { logger } from '@/lib/logger'

const OLLAMA_BASE  = process.env.OLLAMA_BASE_URL  || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL     || 'llama3.2:3b'
const NVIDIA_KEY   = process.env.NVIDIA_API_KEY   || ''
const NVIDIA_MODEL = process.env.NVIDIA_MODEL     || 'nvidia/nemotron-3-ultra-550b-a55b'
const NVIDIA_BASE  = 'https://integrate.api.nvidia.com/v1'

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: 'ollama' | 'nvidia' | 'anthropic'
  input_tokens: number
  output_tokens: number
  cached: boolean
}

// ── Ollama ─────────────────────────────────────────────────
async function callOllama(messages: LLMMessage[], systemPrompt?: string): Promise<LLMResponse> {
  const payload = {
    model: OLLAMA_MODEL,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    stream: false,
    options: { temperature: 0.1, num_predict: 1024 },
  }

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)

  const data = await res.json()
  return {
    content: data.message?.content || '',
    model: OLLAMA_MODEL,
    provider: 'ollama',
    input_tokens: data.prompt_eval_count || 0,
    output_tokens: data.eval_count || 0,
    cached: false,
  }
}

// ── NVIDIA NIM (OpenAI-compatible) ─────────────────────────
async function callNvidia(messages: LLMMessage[], systemPrompt?: string): Promise<LLMResponse> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ]

  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: allMessages,
      temperature: 0.1,
      max_tokens: 1024,
      stream: false,
    }),
    signal: AbortSignal.timeout(180000), // 3 min — 550B is a large model
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`NVIDIA NIM HTTP ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  const usage = data.usage || {}

  return {
    content,
    model: NVIDIA_MODEL,
    provider: 'nvidia',
    input_tokens: usage.prompt_tokens || 0,
    output_tokens: usage.completion_tokens || 0,
    cached: false,
  }
}

// ── Anthropic (optional third fallback) ────────────────────
async function callAnthropic(messages: LLMMessage[], systemPrompt?: string): Promise<LLMResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt || 'You are a helpful assistant for refinery operations.',
    messages: messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    content,
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cached: false,
  }
}

// ── Main router: NVIDIA → Ollama → Anthropic ───────────────
export async function chat(
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<LLMResponse> {

  // 1. Try NVIDIA NIM (primary — cloud, free tier, 550B reasoning model)
  if (NVIDIA_KEY) {
    try {
      const result = await callNvidia(messages, systemPrompt)
      logger.info('llm: NVIDIA NIM responded', { model: NVIDIA_MODEL, tokens_out: result.output_tokens })
      return result
    } catch (e) {
      logger.warn('LLM router: NVIDIA failed, trying Ollama', {
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  // 2. Try Ollama (local fallback)
  try {
    const result = await callOllama(messages, systemPrompt)
    logger.info('llm: Ollama responded', { tokens_out: result.output_tokens })
    return result
  } catch (e) {
    logger.warn('LLM router: Ollama failed', {
      error: e instanceof Error ? e.message : String(e),
    })
  }

  // 3. Try Anthropic (if key configured)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await callAnthropic(messages, systemPrompt)
      logger.info('llm: Anthropic responded', { tokens_out: result.output_tokens })
      return result
    } catch (e) {
      logger.warn('LLM router: Anthropic failed', {
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  // All failed
  return {
    content: 'No LLM available. Check NVIDIA API key or run: ollama serve',
    model: NVIDIA_MODEL,
    provider: 'nvidia',
    input_tokens: 0,
    output_tokens: 0,
    cached: false,
  }
}
