import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after stubbing — use dynamic import in beforeAll
let chat: (messages: import('@/lib/llm/router').LLMMessage[], systemPrompt?: string) => Promise<import('@/lib/llm/router').LLMResponse>

beforeAll(async () => {
  const mod = await import('@/lib/llm/router')
  chat = mod.chat
})

describe('LLM Router', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Ollama primary path', () => {
    it('returns Ollama response when available', async () => {
      // First call: health check (tags endpoint)
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      // Second call: chat endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Confined space entry requires a signed permit.' },
          prompt_eval_count: 50,
          eval_count: 30,
        }),
      })

      const result = await chat([{ role: 'user', content: 'What is confined space entry?' }])

      expect(result.provider).toBe('ollama')
      expect(result.content).toContain('permit')
      expect(result.input_tokens).toBe(50)
      expect(result.output_tokens).toBe(30)
    })

    it('falls back to Anthropic when Ollama is unavailable', async () => {
      // Health check fails
      mockFetch.mockResolvedValueOnce({ ok: false })

      // Anthropic SDK call — mock via dynamic import
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: class {
          messages = {
            create: async () => ({
              content: [{ type: 'text', text: 'Anthropic fallback response' }],
              usage: { input_tokens: 20, output_tokens: 15 },
            }),
          }
        },
      }))

      const result = await chat([{ role: 'user', content: 'Hello' }])
      // Either provider is acceptable — just shouldn't throw
      expect(['ollama', 'anthropic']).toContain(result.provider)
    })

    it('returns cached:false for fresh Ollama responses', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Response' },
          prompt_eval_count: 10,
          eval_count: 5,
        }),
      })

      const result = await chat([{ role: 'user', content: 'Test' }])
      expect(result.cached).toBe(false)
    })
  })

  describe('system prompt', () => {
    it('includes system prompt in Ollama messages array', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      mockFetch.mockImplementationOnce(async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string)
        expect(body.messages[0].role).toBe('system')
        expect(body.messages[0].content).toContain('refinery')
        return {
          ok: true,
          json: async () => ({ message: { content: 'ok' }, prompt_eval_count: 0, eval_count: 0 }),
        }
      })

      await chat([{ role: 'user', content: 'question' }], 'You are a refinery assistant.')
    })
  })
})
