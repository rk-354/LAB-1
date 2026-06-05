'use client'

/* ============================================================
   RefinerIQ — Shared UI atoms (TypeScript)
   ============================================================ */

import React, { CSSProperties } from 'react'
import { I } from './icons'
import { Citation } from '@/lib/data'

/* ---- Logo ---- */
interface LogoProps {
  size?: number;
  withText?: boolean;
  textSize?: number;
}

export const Logo = ({ size = 30, withText = true, textSize = 18 }: LogoProps) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, position: "relative",
      background: "var(--ai-grad)", display: "grid", placeItems: "center",
      boxShadow: "0 4px 18px -4px rgba(124,109,245,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
      flex: "none",
    }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none"
           stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6z" />
      </svg>
    </div>
    {withText && (
      <span style={{ fontSize: textSize, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
        Refine<span className="grad-text">IQ</span>
      </span>
    )}
  </div>
)

/* ---- RoleBadge ---- */
const ROLE_CLASS: Record<string, string> = {
  Admin: "badge-admin",
  Manager: "badge-manager",
  "End User": "badge-user",
}

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => (
  <span className={`badge ${ROLE_CLASS[role] ?? "badge-user"}`}>{role}</span>
)

/* ---- Avatar ---- */
interface AvatarProps {
  initials?: string;
  size?: number;
  ai?: boolean;
}

export const Avatar = ({ initials, size = 34, ai = false }: AvatarProps) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flex: "none",
    display: "grid", placeItems: "center",
    fontSize: size * 0.38, fontWeight: 700, letterSpacing: "0.02em",
    color: ai ? "#fff" : "var(--text-1)",
    background: ai ? "var(--ai-grad)" : "var(--bg-elevated)",
    border: "1px solid " + (ai ? "transparent" : "var(--border-strong)"),
    boxShadow: ai ? "0 3px 14px -4px rgba(124,109,245,0.7)" : "none",
  }}>
    {ai ? <I.sparkle size={size * 0.5} /> : initials}
  </div>
)

/* ---- IconBtn ---- */
interface IconBtnProps {
  icon: (p: { size?: number }) => React.ReactElement;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  size?: number;
}

export const IconBtn = ({ icon: Ico, onClick, title, active, size = 36 }: IconBtnProps) => (
  <button
    className="focusable"
    title={title}
    onClick={onClick}
    style={{
      width: size, height: size, borderRadius: 10, flex: "none",
      display: "grid", placeItems: "center",
      background: active ? "var(--indigo-soft)" : "transparent",
      border: "1px solid " + (active ? "var(--border-ai)" : "var(--border-soft)"),
      color: active ? "#B9A6FA" : "var(--text-2)",
      transition: "all var(--dur) var(--ease)",
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
        ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"
      }
    }}
  >
    <Ico size={18} />
  </button>
)

/* ---- CiteChip ---- */
interface CiteChipProps {
  cite: Citation;
  onClick?: (cite: Citation) => void;
}

export const CiteChip = ({ cite, onClick }: CiteChipProps) => (
  <button
    className="focusable"
    onClick={() => onClick && onClick(cite)}
    style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      height: 28, padding: "0 11px 0 9px", borderRadius: 8,
      background: "var(--glass-faint)", border: "1px solid var(--border)",
      color: "var(--text-2)", fontSize: 12, fontWeight: 500,
      transition: "all var(--dur) var(--ease)", maxWidth: 280,
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLButtonElement
      el.style.borderColor = "var(--border-ai)"
      el.style.color = "var(--text-1)"
      el.style.background = "var(--indigo-soft)"
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLButtonElement
      el.style.borderColor = "var(--border)"
      el.style.color = "var(--text-2)"
      el.style.background = "var(--glass-faint)"
    }}
  >
    <span style={{
      width: 17, height: 17, borderRadius: 5, flex: "none", fontSize: 10.5, fontWeight: 700,
      display: "grid", placeItems: "center", color: "#fff", background: "var(--ai-grad)",
    }}>{cite.id}</span>
    <I.doc size={13} style={{ flex: "none", opacity: 0.7 }} />
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cite.doc}</span>
    <span style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums", flex: "none" }}>{cite.page}</span>
  </button>
)

/* ---- CiteText ---- */
interface CiteTextProps {
  text: string;
}

export const CiteText = ({ text }: CiteTextProps) => {
  const parts = String(text).split(/(\[\d+\])/g)
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[(\d+)\]$/)
        if (m) return (
          <sup key={i} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 16, height: 16, padding: "0 3px", margin: "0 1px", borderRadius: 5,
            fontSize: 10, fontWeight: 700, verticalAlign: "super", lineHeight: 1,
            color: "#B9A6FA", background: "var(--indigo-soft)", border: "1px solid var(--border-ai)",
            transform: "translateY(-1px)",
          }}>{m[1]}</sup>
        )
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

/* ---- StatusChip ---- */
interface StatusChipProps {
  status: 'Indexed' | 'Processing' | 'Review' | 'Error';
}

export const StatusChip = ({ status }: StatusChipProps) => {
  const map: Record<string, { c: string; bg: string; bd: string }> = {
    Indexed:    { c: "var(--pos)",           bg: "rgba(110,231,183,0.12)", bd: "rgba(110,231,183,0.28)" },
    Processing: { c: "var(--warn)",          bg: "rgba(252,211,77,0.12)",  bd: "rgba(252,211,77,0.28)" },
    Error:      { c: "var(--neg)",           bg: "rgba(251,113,133,0.12)", bd: "rgba(251,113,133,0.28)" },
    Review:     { c: "rgba(148,163,184,1)",  bg: "rgba(148,163,184,0.08)", bd: "rgba(148,163,184,0.22)" },
  }
  const s = map[status] ?? map.Review
  return (
    <span className="badge" style={{ background: s.bg, color: s.c, border: `1px solid ${s.bd}` }}>
      <span className="dot" style={{ background: s.c, boxShadow: `0 0 7px ${s.c}` }} />
      {status}
    </span>
  )
}
