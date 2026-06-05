'use client'
/* ============================================================
   RefinerIQ — Chat interface (wired to real API)
   ============================================================ */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, IconBtn, CiteChip, CiteText } from '../ui'
import { I } from '../icons'
import { DEPARTMENTS } from '@/lib/data'
import { useTheme } from '@/lib/theme'

// ── Types ─────────────────────────────────────────────────
interface Citation { id: number; doc: string; page: string; dept: string }
interface MessageBlock { type: 'p' | 'list' | 'step'; text?: string; items?: string[]; h?: string; b?: string }
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  blocks?: MessageBlock[]
  citations?: Citation[]
  model_used?: string
  feedback?: 'up' | 'down' | null
  _streaming?: boolean
}

interface ChatScreenProps {
  dept: string
  cardVariant: string
  sessionId?: string | null
}

const deptName = (id: string) => (DEPARTMENTS.find(d => d.id === id) || {}).name || id
const deptShort = (id: string) => (DEPARTMENTS.find(d => d.id === id) || {}).short || id

function textToBlocks(text: string): MessageBlock[] {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean).map(p => ({ type: 'p' as const, text: p }))
}

// ── Streaming typer ────────────────────────────────────────
function Typer({ text, onDone }: { text: string; onDone?: () => void }) {
  const [n, setN] = useState(0)
  useEffect(() => { setN(0) }, [text])
  useEffect(() => {
    if (n >= text.length) { onDone?.(); return }
    const t = setTimeout(() => setN(v => Math.min(text.length, v + 3)), 8)
    return () => clearTimeout(t)
  }, [n, text, onDone])
  return (
    <>
      <CiteText text={text.slice(0, n)} />
      {n < text.length && (
        <span style={{ display: 'inline-block', width: 7, height: 15, marginLeft: 1,
          background: 'var(--violet)', borderRadius: 2, transform: 'translateY(2px)',
          animation: 'caret-blink 1s steps(1) infinite' }} />
      )}
    </>
  )
}

// ── AI Card ────────────────────────────────────────────────
function AICard({ streaming, children }: { streaming?: boolean; children: React.ReactNode }) {
  return (
    <div className={'glass ai-sheen-host' + (streaming ? ' ai-streaming' : '')} style={{
      borderRadius: 'var(--r-lg)', padding: '18px 20px', background: 'var(--glass)',
      border: '1px solid ' + (streaming ? 'var(--border-ai)' : 'var(--border)'),
      boxShadow: streaming ? 'var(--glow-ai)' : 'var(--shadow-card)',
    }}>
      {children}
    </div>
  )
}

// ── Blocks renderer ────────────────────────────────────────
function BlocksBody({ blocks, streaming, onDone }: { blocks: MessageBlock[]; streaming?: boolean; onDone?: () => void }) {
  const [idx, setIdx] = useState(0)
  const advance = useCallback(() => {
    setTimeout(() => setIdx(i => {
      const next = i + 1
      if (next >= blocks.length) { onDone?.(); return i }
      return next
    }), 100)
  }, [blocks.length, onDone])

  if (!streaming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {blocks.map((b, i) => <BlockItem key={i} b={b} />)}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.slice(0, idx + 1).map((b, i) => (
        <div key={i} className={i === idx ? 'fade-up' : ''}>
          {i === idx
            ? <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-1)' }}>
                <Typer text={b.text || b.b || ''} onDone={advance} />
              </p>
            : <BlockItem b={b} />
          }
        </div>
      ))}
    </div>
  )
}

function BlockItem({ b }: { b: MessageBlock }) {
  if (b.type === 'p') return <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-1)' }}><CiteText text={b.text || ''} /></p>
  if (b.type === 'step') return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--indigo)', marginBottom: 4 }}>{b.h}</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}><CiteText text={b.b || ''} /></p>
    </div>
  )
  if (b.type === 'list') return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {b.items?.map((it, j) => (
        <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.55, color: 'var(--text-1)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ai-grad)', marginTop: 8, flex: 'none' }} />
          <CiteText text={it} />
        </li>
      ))}
    </ul>
  )
  return null
}

// ── Thinking skeleton ──────────────────────────────────────
function ThinkingRow() {
  return (
    <div className="fade-up" style={{ display: 'flex', gap: 14, maxWidth: 760, width: '100%' }}>
      <div style={{ flex: 'none', paddingTop: 2 }}><Avatar ai size={34} /></div>
      <div style={{ flex: 1, borderRadius: 'var(--r-lg)', padding: '18px 20px',
        background: 'var(--glass)', border: '1px solid var(--border-ai)',
        backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--violet)',
            animation: `typing-bounce 1.2s ease-in-out ${i*0.16}s infinite` }} />)}
          <span className="grad-text" style={{ fontSize: 13, fontWeight: 600 }}>Searching indexed documents…</span>
        </div>
        {[92, 77, 84].map((w, i) => <div key={i} className="skeleton" style={{ height: 10, width: `${w}%`, marginBottom: 8 }} />)}
      </div>
    </div>
  )
}

// ── Message actions ────────────────────────────────────────
function MsgActions({ msgId, model, feedback, content, onFeedback }:
  { msgId: string; model?: string; feedback?: 'up' | 'down' | null; content: string; onFeedback: (f: 'up' | 'down') => void }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }
  const Btn = ({ icon: Ico, label, onClick, active }: { icon: React.FC<{size?: number}>; label: string; onClick?: () => void; active?: boolean }) => (
    <button title={label} onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer',
      background: active ? 'var(--indigo-soft)' : 'transparent',
      border: '1px solid transparent',
      color: active ? 'var(--indigo)' : 'var(--text-3)',
      transition: 'all var(--dur) var(--ease)',
    }}
    onMouseEnter={e => { if (!active) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bg-hover)'; b.style.color = 'var(--text-1)' }}}
    onMouseLeave={e => { if (!active) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-3)' }}}>
      <Ico size={15} />
    </button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      {model && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px',
          borderRadius: 7, background: 'var(--glass-faint)', border: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10z"/></svg>
          {model}
        </span>
      )}
      <Btn icon={I.copy}    label={copied ? 'Copied!' : 'Copy'} onClick={copy}                       active={copied} />
      <Btn icon={I.thumbUp} label="Helpful"                     onClick={() => onFeedback('up')}     active={feedback === 'up'} />
      <Btn icon={I.refresh} label="Regenerate" />
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Verified against indexed sources</span>
    </div>
  )
}

// ── ChatScreen ─────────────────────────────────────────────
const SUGGESTIONS = [
  'What is the SOP for confined space entry?',
  'Summarize the PTO carryover policy',
  'What PPE is required at the crude unit?',
]

export default function ChatScreen({ dept, sessionId }: ChatScreenProps) {
  const { theme, toggle } = useTheme()
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'streaming'>('idle')
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null)
  const [streamingMsg, setStreamingMsg] = useState<ChatMessage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight })
  }, [])

  // Load history when sessionId provided
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/chat?session_id=${sessionId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.data) return
        setThread(json.data.map((m: { id: string; role: string; content: string; citations?: Citation[]; model_used?: string; feedback?: 'up' | 'down' | null }) => ({
          id: m.id, role: m.role as 'user' | 'assistant',
          content: m.content,
          blocks: m.role === 'assistant' ? textToBlocks(m.content) : undefined,
          citations: m.citations || [],
          model_used: m.model_used,
          feedback: m.feedback,
        })))
        setTimeout(scrollBottom, 100)
      })
  }, [sessionId, scrollBottom])

  useEffect(() => { scrollBottom() }, [thread.length, phase, scrollBottom])

  const ask = useCallback(async (q: string) => {
    if (!q.trim() || phase !== 'idle') return
    setInput('')
    setThread(t => [...t, { id: `u-${Date.now()}`, role: 'user', content: q, feedback: null }])
    setPhase('thinking')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, department_slug: dept, ...(currentSessionId ? { session_id: currentSessionId } : {}) }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setThread(t => [...t, { id: `e-${Date.now()}`, role: 'assistant',
          content: json.error || 'Failed to get a response. Please try again.',
          blocks: [{ type: 'p', text: json.error || 'Failed to get a response. Please try again.' }],
          citations: [], feedback: null }])
        setPhase('idle')
        return
      }

      const data = json.data
      if (data.session_id && !currentSessionId) setCurrentSessionId(data.session_id)

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`, role: 'assistant',
        content: data.message,
        blocks: textToBlocks(data.message),
        citations: data.citations || [],
        model_used: data.model_used,
        feedback: null, _streaming: true,
      }
      setStreamingMsg(aiMsg)
      setPhase('streaming')
    } catch {
      setThread(t => [...t, { id: `e-${Date.now()}`, role: 'assistant',
        content: 'Connection error. Is Ollama running?',
        blocks: [{ type: 'p', text: 'Connection error. Is Ollama running?' }],
        citations: [], feedback: null }])
      setPhase('idle')
    }
  }, [phase, dept, currentSessionId])

  const onStreamDone = useCallback(() => {
    if (!streamingMsg) return
    setTimeout(() => {
      setThread(t => [...t, { ...streamingMsg, _streaming: false }])
      setStreamingMsg(null)
      setPhase('idle')
    }, 280)
  }, [streamingMsg])

  const handleFeedback = useCallback(async (msgId: string, f: 'up' | 'down') => {
    setThread(t => t.map(m => m.id === msgId ? { ...m, feedback: f } : m))
    await fetch('/api/chat/feedback', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId, feedback: f }),
    })
  }, [])

  const isEmpty = thread.length === 0 && phase === 'idle' && !streamingMsg

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Header */}
      <header style={{ flex: 'none', height: 60, display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--glass)',
        backdropFilter: 'blur(12px)' }}>
        <span style={{ width: 28, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--ai-grad)' }}>
          {deptShort(dept)}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{deptName(dept)}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Knowledge assistant</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Theme toggle near bell */}
        <button onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{
          width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-3)', cursor: 'pointer', display: 'grid', placeItems: 'center',
          transition: 'all var(--dur) var(--ease)' }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border-ai)'; b.style.color = 'var(--text-1)' }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border)'; b.style.color = 'var(--text-3)' }}>
          {theme === 'dark'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
        </button>
        <IconBtn icon={I.bell} title="Notifications" />
      </header>

      {/* Thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 8 }}>

          {isEmpty && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: 300, gap: 14, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center',
                background: 'var(--indigo-soft)', border: '1px solid var(--border-ai)' }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>
                </svg>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>
                Ask anything about {deptName(dept)}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)', maxWidth: 360, lineHeight: 1.6 }}>
                Answers are grounded in your indexed documents with source citations.
              </p>
            </div>
          )}

          {thread.map(m => m.role === 'user' ? (
            <div key={m.id} className="fade-up" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: 600, padding: '12px 16px', borderRadius: '16px 16px 4px 16px',
                background: 'var(--indigo-soft)', border: '1px solid var(--border-ai)',
                color: 'var(--text-1)', fontSize: 14.5, lineHeight: 1.55 }}>
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="fade-up" style={{ display: 'flex', gap: 12, maxWidth: 760, width: '100%' }}>
              <div style={{ flex: 'none', paddingTop: 2 }}><Avatar ai size={34} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AICard>
                  {m.blocks ? <BlocksBody blocks={m.blocks} /> : (
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-1)' }}>{m.content}</p>
                  )}
                  {m.citations && m.citations.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <I.doc size={12} style={{ color: 'var(--text-3)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {m.citations.length} Source{m.citations.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {m.citations.map(c => <CiteChip key={c.id} cite={c} />)}
                      </div>
                    </div>
                  )}
                  <MsgActions msgId={m.id} model={m.model_used} feedback={m.feedback}
                    content={m.content} onFeedback={f => handleFeedback(m.id, f)} />
                </AICard>
              </div>
            </div>
          ))}

          {phase === 'thinking' && <ThinkingRow />}

          {phase === 'streaming' && streamingMsg?.blocks && (
            <div className="fade-up" style={{ display: 'flex', gap: 12, maxWidth: 760, width: '100%' }}>
              <div style={{ flex: 'none', paddingTop: 2 }}><Avatar ai size={34} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AICard streaming>
                  <BlocksBody blocks={streamingMsg.blocks} streaming onDone={onStreamDone} />
                </AICard>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div style={{ flex: 'none', padding: '8px 24px 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {isEmpty && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => ask(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px',
                  borderRadius: 999, background: 'var(--glass-faint)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                  transition: 'all var(--dur) var(--ease)',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border-ai)'; b.style.color = 'var(--text-1)' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border)'; b.style.color = 'var(--text-2)' }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10z"/></svg>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10, padding: '10px 10px 10px 16px',
            borderRadius: 18, background: 'var(--input-bg)',
            border: '1px solid ' + (focused ? 'transparent' : 'var(--border)'),
            animation: focused ? 'glow-pulse 2.6s var(--ease) infinite' : 'none',
            transition: 'border-color var(--dur) var(--ease)',
          }}>
            <textarea value={input} rows={1}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px' }}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }}
              placeholder={phase === 'idle' ? `Ask anything about ${deptName(dept)}…` : 'RefinerIQ is responding…'}
              disabled={phase !== 'idle'}
              style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-1)', fontSize: 14.5, lineHeight: 1.5, padding: '9px 0', maxHeight: 140 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => ask(input)} disabled={!input.trim() || phase !== 'idle'} style={{
                width: 40, height: 40, borderRadius: 12, border: 'none', display: 'grid', placeItems: 'center',
                background: input.trim() && phase === 'idle' ? 'var(--ai-grad)' : 'var(--glass-faint)',
                color: input.trim() && phase === 'idle' ? '#fff' : 'var(--text-4)',
                boxShadow: input.trim() && phase === 'idle' ? '0 6px 20px -6px rgba(99,102,241,0.7)' : 'none',
                cursor: input.trim() && phase === 'idle' ? 'pointer' : 'not-allowed',
                transition: 'all var(--dur) var(--ease)',
              }}>
                <I.send size={18} />
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', margin: '6px 0 0' }}>
            Answers are grounded in your indexed documents. Verify critical procedures with cited sources.
          </p>
        </div>
      </div>
    </div>
  )
}
