'use client'

/* ============================================================
   RefinerIQ — Chat message rendering + streaming engine
   ============================================================ */

import React, { useState, useEffect } from 'react'
import { CiteText, CiteChip } from '../ui'
import { I } from '../icons'
import { MessageBlock, Citation } from '@/lib/data'

/* ---- Typer ---- */
interface TyperProps {
  text: string;
  speed?: number;
  chunk?: number;
  onDone?: () => void;
}

export function Typer({ text, speed = 9, chunk = 2, onDone }: TyperProps) {
  const [n, setN] = useState(0)

  useEffect(() => { setN(0) }, [text])

  useEffect(() => {
    if (n >= text.length) { onDone && onDone(); return }
    const t = setTimeout(() => setN(v => Math.min(text.length, v + chunk)), speed)
    return () => clearTimeout(t)
  }, [n, text, speed, chunk, onDone])

  const done = n >= text.length
  return (
    <>
      <CiteText text={text.slice(0, n)} />
      {!done && (
        <span style={{
          display: "inline-block", width: 7, height: 15, marginLeft: 1,
          background: "var(--violet)", borderRadius: 2, transform: "translateY(2px)",
          animation: "caret-blink 1s steps(1) infinite"
        }} />
      )}
    </>
  )
}

/* ---- AnswerBody ---- */
interface AnswerBodyProps {
  blocks: MessageBlock[];
}

export function AnswerBody({ blocks }: AnswerBodyProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {blocks.map((b, i) => {
        if (b.type === "p" && b.text != null)
          return (
            <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "var(--text-1)" }}>
              <CiteText text={b.text} />
            </p>
          )
        if (b.type === "list" && b.items != null)
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: 2, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ display: "flex", gap: 10, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-1)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ai-grad)", marginTop: 8, flex: "none" }} />
                  <span><CiteText text={it} /></span>
                </li>
              ))}
            </ul>
          )
        if (b.type === "step" && b.h != null && b.b != null)
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#C6BDFB", letterSpacing: "0.01em" }}>{b.h}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}><CiteText text={b.b} /></div>
            </div>
          )
        return null
      })}
    </div>
  )
}

/* ---- StreamingBody ---- */
interface StreamingBodyProps {
  blocks: MessageBlock[];
  onComplete?: () => void;
}

export function StreamingBody({ blocks, onComplete }: StreamingBodyProps) {
  const [idx, setIdx] = useState(0)

  const advance = () => setTimeout(() => setIdx(i => {
    const next = i + 1
    if (next > blocks.length) return i
    if (next === blocks.length) onComplete && onComplete()
    return next
  }), 140)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {blocks.slice(0, idx + 1).map((b, i) => {
        const isCurrent = i === idx
        const content = (txt: string) => isCurrent
          ? <Typer text={txt} onDone={advance} />
          : <CiteText text={txt} />
        const cls = i === idx ? "fade-up" : ""

        if (b.type === "p" && b.text != null)
          return (
            <p key={i} className={cls} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "var(--text-1)" }}>
              {content(b.text)}
            </p>
          )
        if (b.type === "step" && b.h != null && b.b != null)
          return (
            <div key={i} className={cls} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#C6BDFB" }}>{b.h}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}>{content(b.b)}</div>
            </div>
          )
        return null
      })}
    </div>
  )
}

/* ---- Citations ---- */
interface CitationsProps {
  cites: Citation[];
  onOpen?: (cite: Citation) => void;
  animate?: boolean;
}

export function Citations({ cites, onOpen, animate }: CitationsProps) {
  return (
    <div className={animate ? "fade-up" : ""} style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <I.doc size={13} style={{ color: "var(--text-3)" }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {cites.length} Sources
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {cites.map(c => <CiteChip key={c.id} cite={c} onClick={onOpen} />)}
      </div>
    </div>
  )
}

/* ---- MsgActions ---- */
interface MsgActionsProps {
  model?: string;
  feedback: null | 'up' | 'down';
  onFeedback?: (v: 'up' | 'down') => void;
}

export function MsgActions({ model, feedback, onFeedback }: MsgActionsProps) {
  interface BtnProps {
    icon: (p: { size?: number }) => React.ReactElement;
    label: string;
    onClick?: () => void;
    active?: boolean;
  }

  const Btn = ({ icon: Ico, label, onClick, active }: BtnProps) => (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
        background: active ? "var(--indigo-soft)" : "transparent", border: "1px solid transparent",
        color: active ? "#B9A6FA" : "var(--text-3)", transition: "all var(--dur) var(--ease)",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"
          ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent"
          ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"
        }
      }}
    >
      <Ico size={15} />
    </button>
  )

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, marginTop: 14,
      paddingTop: 13, borderTop: "1px solid var(--border-soft)"
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px",
        borderRadius: 7, background: "var(--glass-faint)", border: "1px solid var(--border)",
        fontSize: 11.5, color: "var(--text-2)", marginRight: 6
      }}>
        <I.spark2 size={12} style={{ color: "var(--violet)" }} /> {model}
      </span>
      <Btn icon={I.copy} label="Copy" />
      <Btn icon={I.thumbUp} label="Helpful" active={feedback === "up"} onClick={() => onFeedback && onFeedback("up")} />
      <Btn icon={I.refresh} label="Regenerate" />
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: "var(--text-4)" }}>Verified against indexed sources</span>
    </div>
  )
}
