'use client'

/* ============================================================
   RefinerIQ — Chat interface (main screen)
   ============================================================ */

import React, { useState, useRef, useEffect } from 'react'
import { Avatar, IconBtn } from '../ui'
import { I } from '../icons'
import { Typer, AnswerBody, StreamingBody, Citations, MsgActions } from './ChatParts'
import { SEED_THREAD, DEMO_ANSWER, CURRENT_USER, deptName, deptShort, ChatMessage, MessageBlock } from '@/lib/data'

/* ---- AICard ---- */
interface AICardProps {
  variant?: string;
  streaming?: boolean;
  children: React.ReactNode;
}

function AICard({ variant, streaming, children }: AICardProps) {
  const base: React.CSSProperties = {
    position: "relative", borderRadius: "var(--r-lg)", padding: "20px 22px",
  }

  if (variant === "minimal") {
    return (
      <div
        className={"ai-sheen-host " + (streaming ? "ai-streaming" : "")}
        style={{
          ...base, paddingLeft: 22, background: "transparent",
          borderLeft: "2px solid transparent",
          backgroundImage: "linear-gradient(var(--bg-base), var(--bg-base)), var(--ai-grad)",
          backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box",
        }}
      >
        <div style={{ position: "absolute", left: -2, top: 0, bottom: 0, width: 2, background: "var(--ai-grad)", borderRadius: 2 }} />
        {children}
      </div>
    )
  }

  if (variant === "bordered") {
    return (
      <div
        className={"ai-grad-border " + (streaming ? "flowing" : "") + " ai-sheen-host " + (streaming ? "ai-streaming" : "")}
        style={{ ...base, boxShadow: streaming ? "var(--glow-ai)" : "var(--shadow-card)" }}
      >
        {children}
      </div>
    )
  }

  // glass (default)
  return (
    <div
      className={"glass ai-sheen-host " + (streaming ? "ai-streaming" : "")}
      style={{
        ...base,
        background: "var(--glass)",
        border: "1px solid " + (streaming ? "var(--border-ai)" : "var(--border)"),
        boxShadow: streaming ? "var(--glow-ai)" : "var(--shadow-card)",
      }}
    >
      {children}
    </div>
  )
}

/* ---- AIMessageRow ---- */
interface AIMessageRowProps {
  msg: ChatMessage;
  variant?: string;
  streaming?: boolean;
  onStreamDone?: () => void;
  onOpenCite?: () => void;
  animateCites?: boolean;
}

export function AIMessageRow({ msg, variant, streaming, onStreamDone, onOpenCite, animateCites }: AIMessageRowProps) {
  return (
    <div className="fade-up" style={{ display: "flex", gap: 14, maxWidth: 760, width: "100%" }}>
      <div style={{ flex: "none", paddingTop: 2 }}><Avatar ai size={34} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <AICard variant={variant} streaming={streaming}>
          {streaming && msg.blocks
            ? <StreamingBody blocks={msg.blocks} onComplete={onStreamDone} />
            : msg.blocks && <AnswerBody blocks={msg.blocks} />}
          {!streaming && msg.citations && (
            <Citations cites={msg.citations} onOpen={onOpenCite ? () => {} : undefined} animate={animateCites} />
          )}
          {!streaming && (
            <MsgActions model={msg.model} feedback={msg.feedback} onFeedback={() => {}} />
          )}
        </AICard>
      </div>
    </div>
  )
}

/* ---- UserMessageRow ---- */
interface UserMessageRowProps {
  text: string;
}

export function UserMessageRow({ text }: UserMessageRowProps) {
  return (
    <div className="fade-up" style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
      <div style={{ display: "flex", gap: 12, maxWidth: 620, alignItems: "flex-start" }}>
        <div style={{
          padding: "13px 17px", borderRadius: "16px 16px 4px 16px",
          background: "linear-gradient(150deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))",
          border: "1px solid var(--border-ai)", color: "var(--text-1)",
          fontSize: 14.5, lineHeight: 1.55,
        }}>{text}</div>
        <div style={{ flex: "none" }}><Avatar initials={CURRENT_USER.initials} size={34} /></div>
      </div>
    </div>
  )
}

/* ---- ThinkingRow ---- */
export function ThinkingRow() {
  return (
    <div className="fade-up" style={{ display: "flex", gap: 14, maxWidth: 760, width: "100%" }}>
      <div style={{ flex: "none", paddingTop: 2 }}><Avatar ai size={34} /></div>
      <div className="glass" style={{
        flex: 1, borderRadius: "var(--r-lg)", padding: "18px 22px",
        border: "1px solid var(--border-ai)", background: "var(--glass)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: "var(--violet)",
                animation: `typing-bounce 1.2s ease-in-out ${i * 0.16}s infinite`
              }} />
            ))}
          </div>
          <span className="grad-text" style={{ fontSize: 13, fontWeight: 600 }}>Searching indexed documents…</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="skeleton" style={{ height: 11, width: "92%" }} />
          <div className="skeleton" style={{ height: 11, width: "78%" }} />
          <div className="skeleton" style={{ height: 11, width: "85%" }} />
        </div>
      </div>
    </div>
  )
}

/* ---- AIMessageRowStreaming ---- */
interface AIMessageRowStreamingProps {
  msg: ChatMessage;
  variant?: string;
  onStreamDone: () => void;
}

export function AIMessageRowStreaming({ msg, variant, onStreamDone }: AIMessageRowStreamingProps) {
  const [bodyDone, setBodyDone] = useState(false)

  return (
    <div className="fade-up" style={{ display: "flex", gap: 14, maxWidth: 760, width: "100%" }}>
      <div style={{ flex: "none", paddingTop: 2 }}><Avatar ai size={34} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <AICard variant={variant} streaming={!bodyDone}>
          {msg.blocks && <StreamingBody blocks={msg.blocks} onComplete={() => setBodyDone(true)} />}
          {bodyDone && msg.citations && <Citations cites={msg.citations} animate onOpen={() => {}} />}
          {bodyDone && <MsgActions model={msg.model} feedback={null} onFeedback={() => {}} />}
          {bodyDone && <FinishSignal onFinish={onStreamDone} />}
        </AICard>
      </div>
    </div>
  )
}

/* ---- FinishSignal ---- */
interface FinishSignalProps {
  onFinish: () => void;
}

export function FinishSignal({ onFinish }: FinishSignalProps) {
  useEffect(() => {
    const t = setTimeout(onFinish, 600)
    return () => clearTimeout(t)
  }, [onFinish])
  return null
}

/* ---- Suggestions ---- */
const SUGGESTIONS = [
  "What's the procedure for a confined space entry permit?",
  "Summarize the 2026 PTO carryover policy",
  "Which PPE is required at the crude unit?",
]

/* ---- ChatScreen ---- */
interface ChatScreenProps {
  dept: string;
  cardVariant?: string;
}

export default function ChatScreen({ dept, cardVariant }: ChatScreenProps) {
  const [thread, setThread] = useState<ChatMessage[]>(() => SEED_THREAD.map(m => ({ ...m })))
  const [phase, setPhase] = useState<"idle" | "thinking" | "streaming">("idle")
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const [pending, setPending] = useState<ChatMessage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBottom = () => requestAnimationFrame(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  useEffect(() => { scrollBottom() }, [thread.length, phase])

  const ask = (q: string) => {
    if (!q.trim() || phase !== "idle") return
    setInput("")
    setThread(t => [...t, { id: "u" + Date.now(), role: "user", text: q, feedback: null }])
    setPhase("thinking")
    scrollBottom()

    setTimeout(() => {
      const a = DEMO_ANSWER
      const blocks: MessageBlock[] = [
        { type: "p", text: a.paragraphs[0] },
        ...a.steps.map(s => ({ type: "step" as const, h: s.h, b: s.b })),
        { type: "p", text: a.closing },
      ]
      setPending({ id: "a" + Date.now(), role: "ai", model: a.model, blocks, citations: a.citations, feedback: null })
      setPhase("streaming")
      scrollBottom()
    }, 1300)
  }

  const onStreamDone = () => {
    setTimeout(() => {
      if (pending) {
        setThread(t => [...t, { ...pending, _justFinished: true }])
      }
      setPending(null)
      setPhase("idle")
    }, 300)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
      {/* Top bar */}
      <header style={{
        flex: "none", height: 64, display: "flex", alignItems: "center", gap: 14,
        padding: "0 26px", borderBottom: "1px solid var(--border)", background: "var(--glass)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 30, height: 22, borderRadius: 6, display: "grid", placeItems: "center",
            fontSize: 10.5, fontWeight: 700, color: "#fff", background: "var(--ai-grad)"
          }}>{deptShort(dept)}</span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.1 }}>{deptName(dept)}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Knowledge assistant</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 13px",
          borderRadius: 10, background: "var(--glass-faint)", border: "1px solid var(--border)", color: "var(--text-3)",
          fontSize: 13, width: 230, cursor: "text"
        }}>
          <I.search size={16} /><span>Search conversations…</span>
          <span style={{
            marginLeft: "auto", fontSize: 11, color: "var(--text-4)", border: "1px solid var(--border)",
            borderRadius: 5, padding: "1px 5px"
          }}>⌘K</span>
        </div>
        <IconBtn icon={I.bell} title="Notifications" />
      </header>

      {/* Thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "28px 26px 8px", background: "var(--bg-navy)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 26, paddingBottom: 10 }}>
          {thread.length <= 2 && (
            <div className="fade-in" style={{
              display: "flex", alignItems: "center", gap: 10, alignSelf: "center",
              padding: "7px 14px", borderRadius: 999, background: "var(--glass-faint)", border: "1px solid var(--border)",
              fontSize: 12, color: "var(--text-3)", marginBottom: 4
            }}>
              <I.shield size={13} style={{ color: "var(--text-3)" }} /> Answers are grounded in your {deptName(dept).toLowerCase()} documents
            </div>
          )}
          {thread.map(m => m.role === "user"
            ? <UserMessageRow key={m.id} text={m.text ?? ""} />
            : <AIMessageRow
                key={m.id}
                msg={m}
                variant={cardVariant}
                streaming={false}
                onOpenCite={() => {}}
                animateCites={m._justFinished}
              />
          )}
          {phase === "thinking" && <ThinkingRow />}
          {phase === "streaming" && pending && (
            <AIMessageRowStreaming msg={pending} variant={cardVariant} onStreamDone={onStreamDone} />
          )}
        </div>
      </div>

      {/* Suggestions + input */}
      <div style={{ flex: "none", padding: "10px 26px 22px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {phase === "idle" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => ask(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 13px", borderRadius: 999,
                    background: "var(--glass-faint)", border: "1px solid var(--border)", color: "var(--text-2)",
                    fontSize: 12.5, transition: "all var(--dur) var(--ease)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-ai)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"
                  }}
                >
                  <I.sparkle size={12} style={{ color: "var(--violet)" }} />{s}
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 10px 10px 16px",
            borderRadius: 18, background: "var(--input-bg)",
            border: "1px solid " + (focused ? "transparent" : "var(--border)"),
            animation: focused ? "glow-pulse 2.6s var(--ease) infinite" : "none",
            transition: "border-color var(--dur) var(--ease)",
          }}>
            <IconBtn icon={I.paperclip} title="Attach file" size={38} />
            <textarea
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value)
                const el = e.target as HTMLTextAreaElement
                el.style.height = "auto"
                el.style.height = Math.min(140, el.scrollHeight) + "px"
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  ask(input)
                }
              }}
              placeholder={phase === "idle" ? `Ask anything about ${deptName(dept)}…` : "RefineIQ is responding…"}
              disabled={phase !== "idle"}
              style={{
                flex: 1, resize: "none", background: "transparent", border: "none", outline: "none",
                color: "var(--text-1)", fontSize: 14.5, lineHeight: 1.5, padding: "9px 0", maxHeight: 140,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 9px",
                borderRadius: 8, background: "var(--glass-faint)", border: "1px solid var(--border)",
                fontSize: 11, color: "var(--text-3)"
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pos)" }} /> Auto-route
              </span>
              <button
                onClick={() => ask(input)}
                disabled={!input.trim() || phase !== "idle"}
                className="focusable"
                style={{
                  width: 40, height: 40, borderRadius: 12, border: "none", display: "grid", placeItems: "center",
                  background: input.trim() && phase === "idle" ? "var(--ai-grad)" : "rgba(255,255,255,0.06)",
                  color: input.trim() && phase === "idle" ? "#fff" : "var(--text-4)",
                  boxShadow: input.trim() && phase === "idle" ? "0 6px 20px -6px rgba(124,109,245,0.8)" : "none",
                  transition: "all var(--dur) var(--ease)", cursor: input.trim() && phase === "idle" ? "pointer" : "not-allowed",
                }}
                onMouseEnter={e => {
                  if (input.trim() && phase === "idle")
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px -4px rgba(139,92,246,0.95)"
                }}
                onMouseLeave={e => {
                  if (input.trim() && phase === "idle")
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px -6px rgba(124,109,245,0.8)"
                }}
              >
                <I.send size={18} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>
            RefineIQ can make mistakes. Verify critical procedures against the cited source documents.
          </div>
        </div>
      </div>
    </div>
  )
}
