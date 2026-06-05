'use client'

/* ============================================================
   RefinerIQ — Admin panel (users table + document library)
   ============================================================ */

import React, { useState } from 'react'
import { Avatar, RoleBadge, IconBtn, StatusChip } from '../ui'
import { I } from '../icons'
import { USERS, DOCUMENTS, User, Document } from '@/lib/data'

/* ---- Toggle ---- */
interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="focusable"
      style={{
        width: 38, height: 22, borderRadius: 999, border: "none", padding: 2, position: "relative",
        background: on ? "var(--ai-grad)" : "rgba(255,255,255,0.12)",
        transition: "background var(--dur) var(--ease)", cursor: "pointer",
      }}
    >
      <span style={{
        display: "block", width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transform: on ? "translateX(16px)" : "translateX(0)", transition: "transform var(--dur) var(--ease)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
      }} />
    </button>
  )
}

/* ---- UsersTable ---- */
function UsersTable() {
  const [users, setUsers] = useState<User[]>(() => USERS.map(u => ({ ...u })))
  const [q, setQ] = useState("")

  const filtered = users.filter(u =>
    (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase())
  )

  const toggle = (email: string) => setUsers(us =>
    us.map(u => u.email === email ? { ...u, status: !u.status } : u)
  )

  return (
    <div className="glass" style={{ borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 13px", flex: 1, maxWidth: 320,
          borderRadius: 10, background: "rgba(8,12,22,0.5)", border: "1px solid var(--border)"
        }}>
          <I.search size={16} style={{ color: "var(--text-3)" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search users…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 13.5 }}
          />
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 13px", borderRadius: 10,
          background: "var(--glass-faint)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13
        }}>
          <I.filter size={15} /> Role
        </button>
        <div style={{ flex: 1 }} />
        <button className="focusable" style={{
          display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10,
          background: "var(--ai-grad)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 6px 18px -8px rgba(124,109,245,0.8)"
        }}>
          <I.plus size={16} /> Invite user
        </button>
      </div>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1.4fr 0.9fr 0.6fr", gap: 16, padding: "12px 22px",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-4)",
        borderBottom: "1px solid var(--border-soft)"
      }}>
        <span>User</span><span>Role</span><span>Department</span><span>Status</span><span></span>
      </div>
      {/* Rows */}
      {filtered.map((u, i) => (
        <div
          key={u.email}
          style={{
            display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1.4fr 0.9fr 0.6fr", gap: 16,
            alignItems: "center", padding: "13px 22px",
            borderBottom: i < filtered.length - 1 ? "1px solid var(--border-soft)" : "none",
            transition: "background var(--dur) var(--ease)"
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--glass-faint)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <Avatar initials={u.init} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
            </div>
          </div>
          <div><RoleBadge role={u.role} /></div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{u.dept}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Toggle on={u.status} onChange={() => toggle(u.email)} />
            <span style={{ fontSize: 12, color: u.status ? "var(--text-2)" : "var(--text-4)" }}>
              {u.status ? "Active" : "Suspended"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <IconBtn icon={I.more} size={32} title="More" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- DocLibrary ---- */
function DocLibrary() {
  const [q, setQ] = useState("")
  const filtered = DOCUMENTS.filter(d =>
    (d.name + d.dept).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="glass" style={{ borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 13px", flex: 1, maxWidth: 320,
          borderRadius: 10, background: "rgba(8,12,22,0.5)", border: "1px solid var(--border)"
        }}>
          <I.search size={16} style={{ color: "var(--text-3)" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search documents…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 13.5 }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="focusable" style={{
          display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10,
          background: "var(--ai-grad)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 6px 18px -8px rgba(124,109,245,0.8)"
        }}>
          <I.upload size={16} /> Upload
        </button>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "2.4fr 1.4fr 0.7fr 1fr 1fr 0.5fr", gap: 16, padding: "12px 22px",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-4)",
        borderBottom: "1px solid var(--border-soft)"
      }}>
        <span>Document</span><span>Department</span><span>Version</span><span>Updated</span><span>Status</span><span></span>
      </div>
      {filtered.map((d, i) => (
        <div
          key={d.name}
          style={{
            display: "grid", gridTemplateColumns: "2.4fr 1.4fr 0.7fr 1fr 1fr 0.5fr", gap: 16,
            alignItems: "center", padding: "13px 22px",
            borderBottom: i < filtered.length - 1 ? "1px solid var(--border-soft)" : "none"
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--glass-faint)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flex: "none", display: "grid", placeItems: "center",
              background: "var(--indigo-soft)", border: "1px solid var(--border-ai)", color: "#B9A6FA"
            }}>
              <I.doc size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{d.size}</div>
            </div>
          </div>
          <div><span className="badge badge-user">{d.dept}</span></div>
          <div style={{ fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{d.v}</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>{d.date}</div>
          <div><StatusChip status={d.status} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <IconBtn icon={I.more} size={32} title="More" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Placeholder ---- */
interface PlaceholderProps {
  tab: string;
}

function Placeholder({ tab }: PlaceholderProps) {
  const map: Record<string, { icon: (p: { size?: number }) => React.ReactElement; t: string; d: string }> = {
    departments: { icon: I.layers,   t: "Departments", d: "Configure department spaces, access scopes, and per-team retrieval rules." },
    logs:        { icon: I.logs,     t: "Audit logs",  d: "Full query, access, and document-change history with export." },
    settings:    { icon: I.settings, t: "Settings",    d: "Model routing, retention, SSO, and data-residency controls." },
  }
  const p = map[tab] ?? map.settings

  return (
    <div className="glass" style={{
      borderRadius: "var(--r-lg)", padding: 60, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 360
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 18,
        background: "var(--indigo-soft)", border: "1px solid var(--border-ai)", color: "#B9A6FA"
      }}>
        <p.icon size={26} />
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>{p.t}</h3>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-3)", maxWidth: 360, lineHeight: 1.6 }}>{p.d}</p>
    </div>
  )
}

/* ---- AdminScreen ---- */
interface AdminScreenProps {
  tab: string;
}

export default function AdminScreen({ tab }: AdminScreenProps) {
  const titles: Record<string, [string, string]> = {
    users:       ["Users",            "Manage members, roles, and access"],
    documents:   ["Document library", "All indexed sources across departments"],
    departments: ["Departments",      "Team spaces & retrieval scopes"],
    logs:        ["Audit logs",       "Query & access history"],
    settings:    ["Settings",         "Platform configuration"],
  }
  const [t0, t1] = titles[tab] ?? titles.users

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
      <header style={{
        flex: "none", height: 64, display: "flex", alignItems: "center", gap: 14,
        padding: "0 30px", borderBottom: "1px solid var(--border)", background: "rgba(10,15,30,0.6)", backdropFilter: "blur(10px)"
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}>{t0}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t1}</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="badge badge-admin"><I.shield size={12} /> Admin</span>
        <IconBtn icon={I.bell} title="Notifications" />
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px 40px" }}>
        <div className="fade-in" style={{ maxWidth: 1180, margin: "0 auto" }}>
          {tab === "users" && <UsersTable />}
          {tab === "documents" && <DocLibrary />}
          {["departments", "logs", "settings"].includes(tab) && <Placeholder tab={tab} />}
        </div>
      </div>
    </div>
  )
}
