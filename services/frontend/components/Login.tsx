'use client'

/* ============================================================
   RefinerIQ — Login page (aurora background + magic link)
   ============================================================ */

import React, { useState } from 'react'
import { Logo } from './ui'
import { I } from './icons'

function Aurora() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", width: "60vw", height: "60vw", left: "-10vw", top: "-15vw",
        background: "radial-gradient(circle, rgba(99,102,241,0.40), transparent 62%)",
        filter: "blur(40px)", animation: "aurora-1 22s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "55vw", height: "55vw", right: "-12vw", top: "-8vw",
        background: "radial-gradient(circle, rgba(139,92,246,0.38), transparent 62%)",
        filter: "blur(46px)", animation: "aurora-2 26s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "50vw", height: "50vw", left: "20vw", bottom: "-22vw",
        background: "radial-gradient(circle, rgba(91,95,240,0.30), transparent 60%)",
        filter: "blur(50px)", animation: "aurora-3 30s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(6,9,18,0.7) 100%)",
      }} />
    </div>
  )
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const usePassword = password.length > 0

  const submit = async () => {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    try {
      const body = usePassword ? { email, password } : { email }
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      if (usePassword) {
        onLogin() // password login → go straight to app
      } else {
        setSent(true)
      }
    } catch {
      setError('Sign in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: "relative", height: "100%", width: "100%", background: "var(--bg-base)",
      display: "grid", placeItems: "center", overflow: "hidden"
    }}>
      <Aurora />

      <div className="fade-up" style={{ position: "relative", width: 408, maxWidth: "90vw" }}>
        <div className="glass" style={{
          borderRadius: 24, padding: "40px 38px 30px",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,109,245,0.10)",
          background: "linear-gradient(180deg, rgba(24,34,60,0.72), rgba(14,20,38,0.82))",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
            <Logo size={44} textSize={24} />
          </div>

          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center" }}>
            {sent ? "Check your inbox" : "Welcome back"}
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 13.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
            {sent
              ? <><span>We sent a magic link to </span><span style={{ color: "var(--text-2)" }}>{email}</span></>
              : "Enter your work email to receive a secure sign-in link."}
          </p>

          {!sent ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                Work email
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 14px",
                borderRadius: 13, marginBottom: 18,
                background: "rgba(8,12,22,0.6)",
                border: "1px solid " + (focused ? "transparent" : "var(--border)"),
                animation: focused ? "glow-pulse 2.4s var(--ease) infinite" : "none",
                transition: "border-color var(--dur) var(--ease)",
              }}>
                <I.mail size={18} style={{ color: focused ? "#B9A6FA" : "var(--text-3)", flex: "none" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="you@company.com"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "var(--text-1)", fontSize: 14.5, height: "100%",
                  }}
                />
              </div>

              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                Password <span style={{ color: "var(--text-4)", fontWeight: 400 }}>(optional — leave blank to use magic link)</span>
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 14px",
                borderRadius: 13, marginBottom: 18,
                background: "rgba(8,12,22,0.6)",
                border: "1px solid var(--border)",
                transition: "border-color var(--dur) var(--ease)",
              }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: "var(--text-3)", flex: "none" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="Enter password to skip magic link"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "var(--text-1)", fontSize: 14.5, height: "100%",
                  }} />
              </div>

              {error && (
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--neg)", textAlign: "center",
                  padding: "10px 14px", borderRadius: 10, background: "rgba(251,113,133,0.08)",
                  border: "1px solid rgba(251,113,133,0.25)" }}>
                  {error}
                </p>
              )}

              <button
                className="focusable"
                onClick={submit}
                disabled={!valid || loading}
                style={{
                  width: "100%", height: 50, borderRadius: 13, border: "none",
                  background: valid ? "var(--ai-grad)" : "rgba(255,255,255,0.06)",
                  color: valid ? "#fff" : "var(--text-4)",
                  fontSize: 14.5, fontWeight: 600, letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: valid ? "0 8px 26px -8px rgba(124,109,245,0.7)" : "none",
                  transition: "all var(--dur) var(--ease)", cursor: valid ? "pointer" : "not-allowed",
                }}
                onMouseEnter={e => {
                  if (valid) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 34px -6px rgba(139,92,246,0.85)"
                }}
                onMouseLeave={e => {
                  if (valid) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 26px -8px rgba(124,109,245,0.7)"
                }}
              >
                <I.sparkle size={17} /> {usePassword ? "Sign in" : "Send magic link"}
              </button>
            </>
          ) : (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "8px 0 4px" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", display: "grid", placeItems: "center",
                background: "var(--indigo-soft)", border: "1px solid var(--border-ai)",
                animation: "glow-pulse 2s var(--ease) infinite",
              }}>
                <I.mail size={26} style={{ color: "#B9A6FA" }} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: "50%", background: "var(--violet)",
                    animation: `typing-bounce 1.2s ease-in-out ${i * 0.18}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 18px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 500 }}>SECURE SSO</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["Okta", "Azure AD"].map(p => (
              <button
                key={p}
                style={{
                  flex: 1, height: 42, borderRadius: 11, background: "var(--glass-faint)",
                  border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, fontWeight: 500,
                  transition: "all var(--dur) var(--ease)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"
                  ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--glass-faint)"
                  ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22, opacity: 0.8 }}>
          <I.spark2 size={13} style={{ color: "var(--violet)" }} />
          <span style={{ fontSize: 11.5, color: "var(--text-3)", letterSpacing: "0.04em" }}>
            Powered by AI · Enterprise-grade retrieval
          </span>
        </div>
      </div>
    </div>
  )
}
