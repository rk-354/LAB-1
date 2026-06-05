'use client'

/* ============================================================
   RefinerIQ — Admin panel (users table + document library)
   ============================================================ */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Avatar, RoleBadge, IconBtn, StatusChip } from '../ui'
import { I } from '../icons'
import { USERS, User } from '@/lib/data'

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

/* ---- Upload Modal ---- */
interface UploadModalProps {
  file: File
  onConfirm: (dept: string) => void
  onCancel: () => void
  uploading: boolean
}
function UploadModal({ file, onConfirm, onCancel, uploading }: UploadModalProps) {
  const [dept, setDept] = useState("hr")
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center",
      background: "rgba(6,9,18,0.75)", backdropFilter: "blur(6px)"
    }}>
      <div className="glass" style={{
        borderRadius: 20, padding: 32, width: 420, maxWidth: "90vw",
        background: "linear-gradient(180deg, rgba(24,34,60,0.9), rgba(14,20,38,0.95))",
        boxShadow: "0 24px 64px -16px rgba(0,0,0,0.7)"
      }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700 }}>Upload document</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-3)" }}>
          {file.name} · {(file.size / 1024).toFixed(0)} KB
        </p>

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
          Department
        </label>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[{ id: "hr", label: "HR" }, { id: "operations", label: "Operations" }].map(d => (
            <button key={d.id} onClick={() => setDept(d.id)} style={{
              flex: 1, height: 40, borderRadius: 10, border: "1px solid",
              borderColor: dept === d.id ? "var(--border-ai)" : "var(--border)",
              background: dept === d.id ? "var(--indigo-soft)" : "var(--glass-faint)",
              color: dept === d.id ? "#B9A6FA" : "var(--text-2)",
              fontSize: 13.5, fontWeight: dept === d.id ? 600 : 500,
              cursor: "pointer", transition: "all var(--dur) var(--ease)"
            }}>{d.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={uploading} style={{
            flex: 1, height: 42, borderRadius: 11, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-2)", fontSize: 14, cursor: "pointer"
          }}>Cancel</button>
          <button onClick={() => onConfirm(dept)} disabled={uploading} style={{
            flex: 2, height: 42, borderRadius: 11, border: "none",
            background: "var(--ai-grad)", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: uploading ? "wait" : "pointer",
            boxShadow: "0 6px 18px -8px rgba(124,109,245,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            {uploading ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                Uploading…
              </>
            ) : (
              <><I.upload size={15} /> Upload &amp; Index</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- DocLibrary ---- */
interface ApiDoc {
  id: string
  title: string
  department_slug: string
  doc_type: string
  current_version: number
  updated_at: string
  document_versions?: { file_size: number; indexing_status: string }[]
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DocLibrary() {
  const [q, setQ] = useState("")
  const [docs, setDocs] = useState<ApiDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents')
      const json = await res.json()
      if (json.data) setDocs(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ""
  }

  const handleUpload = async (dept: string) => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", pendingFile)
      form.append("department_slug", dept)
      form.append("doc_type", "general")

      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const json = await res.json()

      if (json.error) {
        setToast({ msg: json.error, ok: false })
      } else {
        setToast({ msg: `"${pendingFile.name}" uploaded — indexing started`, ok: true })
        await fetchDocs()
      }
    } catch {
      setToast({ msg: "Upload failed. Try again.", ok: false })
    } finally {
      setUploading(false)
      setPendingFile(null)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const filtered = docs.filter(d =>
    (d.title + d.department_slug).toLowerCase().includes(q.toLowerCase())
  )

  const statusOf = (doc: ApiDoc): 'Indexed' | 'Processing' | 'Review' => {
    const s = doc.document_versions?.[0]?.indexing_status
    if (s === 'ready') return 'Indexed'
    if (s === 'processing' || s === 'pending') return 'Processing'
    return 'Review'
  }

  return (
    <>
      {pendingFile && (
        <UploadModal
          file={pendingFile}
          onConfirm={handleUpload}
          onCancel={() => setPendingFile(null)}
          uploading={uploading}
        />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          padding: "13px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 500,
          background: toast.ok ? "rgba(110,231,183,0.12)" : "rgba(251,113,133,0.12)",
          border: `1px solid ${toast.ok ? "rgba(110,231,183,0.35)" : "rgba(251,113,133,0.35)"}`,
          color: toast.ok ? "var(--pos)" : "var(--neg)",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
        }}>{toast.msg}</div>
      )}

      <input ref={fileRef} type="file" style={{ display: "none" }}
        accept=".pdf,.docx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
        onChange={handleFileSelect} />

      <div className="glass" style={{ borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 13px", flex: 1, maxWidth: 320,
            borderRadius: 10, background: "rgba(8,12,22,0.5)", border: "1px solid var(--border)"
          }}>
            <I.search size={16} style={{ color: "var(--text-3)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search documents…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 13.5 }} />
          </div>
          <div style={{ flex: 1 }} />
          <button className="focusable" onClick={() => fileRef.current?.click()} style={{
            display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10,
            background: "var(--ai-grad)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600,
            boxShadow: "0 6px 18px -8px rgba(124,109,245,0.8)", cursor: "pointer"
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

        {loading ? (
          <div style={{ padding: "32px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 22px", textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
            No documents yet. Click <strong style={{ color: "var(--text-2)" }}>Upload</strong> to add your first document.
          </div>
        ) : filtered.map((d, i) => (
          <div key={d.id}
            style={{
              display: "grid", gridTemplateColumns: "2.4fr 1.4fr 0.7fr 1fr 1fr 0.5fr", gap: 16,
              alignItems: "center", padding: "13px 22px",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--border-soft)" : "none",
              transition: "background var(--dur) var(--ease)"
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--glass-faint)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flex: "none", display: "grid", placeItems: "center",
                background: "var(--indigo-soft)", border: "1px solid var(--border-ai)", color: "#B9A6FA" }}>
                <I.doc size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{formatBytes(d.document_versions?.[0]?.file_size ?? 0)}</div>
              </div>
            </div>
            <div><span className="badge badge-user">{d.department_slug}</span></div>
            <div style={{ fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>v{d.current_version}</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>{formatDate(d.updated_at)}</div>
            <div><StatusChip status={statusOf(d)} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <IconBtn icon={I.more} size={32} title="More" />
            </div>
          </div>
        ))}
      </div>
    </>
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
