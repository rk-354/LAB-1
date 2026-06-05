// LLM Router — Ollama only (local)
// Anthropic fallback only used if ANTHROPIC_API_KEY is set

import { logger } from '@/lib/logger'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: 'ollama' | 'anthropic'
  input_tokens: number
  output_tokens: number
  cached: boolean
}

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
    signal: AbortSignal.timeout(120000), // 2 min — generous for local model
  })

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)

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

async function callAnthropic(messages: LLMMessage[], systemPrompt?: string): Promise<LLMResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt || 'You are a helpful assistant for refinery operations.',
    messages: messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content })),
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

// Main router — Ollama primary, Anthropic only if key is set
export async function chat(
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<LLMResponse> {
  // Try Ollama first (always — it's local)
  try {
    return await callOllama(messages, systemPrompt)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.warn('LLM router: Ollama failed', { error: msg })

    // Only fall back to Anthropic if key is configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        logger.info('LLM router: falling back to Anthropic')
        return await callAnthropic(messages, systemPrompt)
      } catch (ae) {
        logger.warn('LLM router: Anthropic also failed', { error: ae instanceof Error ? ae.message : String(ae) })
      }
    }

    // Both failed — return a clear error message
    return {
      content: 'Ollama is not responding. Make sure Ollama is running with: ollama serve',
      model: OLLAMA_MODEL,
      provider: 'ollama',
      input_tokens: 0,
      output_tokens: 0,
      cached: false,
    }
  }
}
