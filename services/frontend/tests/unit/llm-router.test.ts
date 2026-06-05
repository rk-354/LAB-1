import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let chat: (messages: import('@/lib/llm/router').LLMMessage[], systemPrompt?: string) => Promise<import('@/lib/llm/router').LLMResponse>

beforeAll(async () => {
  const mod = await import('@/lib/llm/router')
  chat = mod.chat
})

describe('LLM Router', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubEnv('NODE_ENV', 'test')
    vi.unstubAllEnvs()
    // No Anthropic key by default — Ollama-only mode
    vi.stubEnv('ANTHROPIC_API_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('NVIDIA primary path', () => {
    it('calls NVIDIA NIM first and returns response when key is set', async () => {
      vi.stubEnv('NVIDIA_API_KEY', 'nvapi-test-key')
      // NVIDIA uses OpenAI-compatible response format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Confined space entry requires a signed permit.' } }],
          usage: { prompt_tokens: 50, completion_tokens: 30 },
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
        }),
      })

      const result = await chat([{ role: 'user', content: 'What is confined space entry?' }])

      expect(result.provider).toBe('nvidia')
      expect(result.content).toContain('permit')
      expect(result.input_tokens).toBe(50)
      expect(result.output_tokens).toBe(30)
      expect(result.cached).toBe(false)
    })

    it('falls back to Ollama when NVIDIA fails', async () => {
      vi.stubEnv('NVIDIA_API_KEY', 'nvapi-test-key')
      // NVIDIA fails
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'error' })
      // Ollama succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Ollama fallback response' },
          prompt_eval_count: 20,
          eval_count: 10,
        }),
      })

      const result = await chat([{ role: 'user', content: 'test' }])
      expect(result.provider).toBe('ollama')
      expect(result.content).toContain('Ollama fallback')
    })

    it('returns error message when all LLMs fail', async () => {
      // NVIDIA key not set → skipped; Ollama fails
      vi.stubEnv('NVIDIA_API_KEY', '')
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await chat([{ role: 'user', content: 'Hello' }])

      // Returns a graceful error message, not a thrown exception
      expect(result.content).toBeTruthy()
      expect(result.content.toLowerCase()).toMatch(/ollama|nvidia|available/)
    })

    it('returns cached:false for all Ollama responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Response text' },
          prompt_eval_count: 10,
          eval_count: 5,
        }),
      })

      const result = await chat([{ role: 'user', content: 'Test' }])
      expect(result.cached).toBe(false)
    })

    it('handles Ollama HTTP error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const result = await chat([{ role: 'user', content: 'Test' }])
      // Should return error message, not throw
      expect(result.content).toBeTruthy()
    })
  })

  describe('System prompt', () => {
    it('prepends system prompt to messages array', async () => {
      mockFetch.mockImplementationOnce(async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string)
        expect(body.messages[0].role).toBe('system')
        expect(body.messages[0].content).toContain('refinery')
        expect(body.messages[1].role).toBe('user')
        return {
          ok: true,
          json: async () => ({ message: { content: 'ok' }, prompt_eval_count: 0, eval_count: 0 }),
        }
      })

      await chat([{ role: 'user', content: 'question' }], 'You are a refinery assistant.')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('sends messages without system prompt when none provided', async () => {
      mockFetch.mockImplementationOnce(async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string)
        expect(body.messages[0].role).toBe('user')
        return {
          ok: true,
          json: async () => ({ message: { content: 'ok' }, prompt_eval_count: 0, eval_count: 0 }),
        }
      })

      await chat([{ role: 'user', content: 'question' }])
    })
  })

  describe('Response shape', () => {
    it('always returns all required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'test' }, prompt_eval_count: 5, eval_count: 10 }),
      })

      const result = await chat([{ role: 'user', content: 'hi' }])
      expect(result).toMatchObject({
        content: expect.any(String),
        model: expect.any(String),
        provider: expect.stringMatching(/ollama|anthropic/),
        input_tokens: expect.any(Number),
        output_tokens: expect.any(Number),
        cached: expect.any(Boolean),
      })
    })
  })
})
