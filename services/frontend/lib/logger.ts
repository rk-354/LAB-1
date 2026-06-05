// Structured JSON logger — works in Next.js server, API routes, and edge middleware
// All production code uses this. Never use console.log directly.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function log(level: LogLevel, message: string, ctx: LogContext = {}) {
  if (process.env.NODE_ENV === 'test') return

  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: message,
    env: process.env.NODE_ENV ?? 'development',
    ...ctx,
  })

  if (level === 'error' || level === 'warn') {
    process.stderr.write(entry + '\n')
  } else {
    process.stdout.write(entry + '\n')
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: LogContext) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),

  // Convenience: log an LLM call with standard fields
  llm: (ctx: {
    provider: string; model: string; input_tokens: number
    output_tokens: number; latency_ms?: number; cached?: boolean
    user_id?: string; session_id?: string
  }) => log('info', 'llm_call', ctx),

  // Convenience: log an API request
  request: (ctx: {
    method: string; path: string; status: number
    latency_ms: number; user_id?: string
  }) => log('info', 'api_request', ctx),

  // Convenience: log a RAG retrieval
  retrieval: (ctx: {
    query_len: number; dept: string; chunks_found: number
    semantic_hits: number; keyword_hits: number; latency_ms?: number
  }) => log('info', 'rag_retrieval', ctx),
}
