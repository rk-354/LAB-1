'use client'

/* ============================================================
   RefinerIQ — Admin panel
   ============================================================ */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Avatar, RoleBadge, IconBtn, StatusChip } from '../ui'
import { I } from '../icons'
import { USERS, User } from '@/lib/data'
import { useTheme } from '@/lib/theme'

// ── Shared helpers ─────────────────────────────────────────
function formatBytes(b: number) {
  if (!b) return '—'
  return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Toggle ─────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="focusable" style={{
      width: 38, height: 22, borderRadius: 999, border: 'none', padding: 2, position: 'relative',
      background: on ? 'var(--ai-grad)' : 'rgba(148,163,184,0.2)', cursor: 'pointer',
      transition: 'background var(--dur) var(--ease)',
    }}>
      <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)', transition: 'transform var(--dur) var(--ease)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

// ── Invite Modal ───────────────────────────────────────────
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', full_name: '', role_id: 3, department: 'hr' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!form.email || !form.full_name) { setErr('Email and name are required'); return }
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) { setErr(json.error); return }
      setDone(true)
      onSuccess()
      setTimeout(onClose, 1600)
    } catch { setErr('Request failed') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 13px', borderRadius: 10, boxSizing: 'border-box',
    background: 'var(--input-bg)', border: '1px solid var(--border)',
    color: 'var(--text-1)', fontSize: 13.5, outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center',
      background: 'rgba(6,9,18,0.7)', backdropFilter: 'blur(6px)' }}>
      <div style={{ borderRadius: 20, padding: 28, width: 420, maxWidth: '90vw',
        background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Add user</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)' }}>They'll receive a magic link to join.</p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--pos)', fontSize: 14, fontWeight: 600 }}>
            ✓ Invitation sent!
          </div>
        ) : (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Full name</label>
            <input style={{ ...inp, marginBottom: 14 }} placeholder="Jane Smith" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Work email</label>
            <input style={{ ...inp, marginBottom: 14 }} type="email" placeholder="jane@refinery.io" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Role</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.role_id}
                  onChange={e => setForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                  <option value={3}>End User</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Department</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="hr">Human Resources</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
            </div>
            {err && <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--neg)', padding: '10px 13px',
              borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>{err}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 11, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={loading} style={{ flex: 2, height: 42, borderRadius: 11, border: 'none',
                background: 'var(--ai-grad)', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Users Table ────────────────────────────────────────────
function UsersTable() {
  const [users, setUsers] = useState<User[]>(() => USERS.map(u => ({ ...u })))
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInvite, setShowInvite] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const filtered = users.filter(u => {
    const matchQ = (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role.toLowerCase().replace(' ', '_') === roleFilter
    return matchQ && matchRole
  })

  const toggleStatus = (email: string) => setUsers(us => us.map(u => u.email === email ? { ...u, status: !u.status } : u))

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return
    const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json()
    if (json.error) { showToast(json.error, false); return }
    setUsers(us => us.filter(u => u.name !== name))
    showToast(`${name} deactivated`, true)
  }

  return (
    <>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={() => showToast('Invitation sent!', true)} />}
      {toast && (
        <div className="toast-enter" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 500,
          background: toast.ok ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.ok ? 'var(--pos)' : 'var(--neg)', boxShadow: 'var(--shadow-elevated)' }}>
          {toast.msg}
        </div>
      )}
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', flex: 1, minWidth: 200, maxWidth: 300,
            borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
            <I.search size={15} style={{ color: 'var(--text-3)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 13 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{
            height: 38, padding: '0 10px', borderRadius: 10, cursor: 'pointer',
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13 }}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="end_user">End User</option>
          </select>
          <div style={{ flex: 1 }} />
          <button className="focusable" onClick={() => setShowInvite(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 10,
            background: 'var(--ai-grad)', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 600,
            boxShadow: '0 4px 14px -6px rgba(99,102,241,0.7)', cursor: 'pointer' }}>
            <I.plus size={15} /> Add user
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 0.9fr 80px', gap: 12, padding: '10px 18px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-4)',
          borderBottom: '1px solid var(--border-soft)' }}>
          <span>User</span><span>Role</span><span>Department</span><span>Status</span><span></span>
        </div>
        {filtered.map((u, i) => (
          <div key={u.email} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 0.9fr 80px', gap: 12,
            alignItems: 'center', padding: '12px 18px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border-soft)' : 'none',
            transition: 'background var(--dur) var(--ease)' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar initials={u.init} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
            </div>
            <div><RoleBadge role={u.role} /></div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{u.dept}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Toggle on={u.status} onChange={() => toggleStatus(u.email)} />
              <span style={{ fontSize: 11.5, color: u.status ? 'var(--pos)' : 'var(--text-4)' }}>
                {u.status ? 'Active' : 'Off'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button title="Delete user" onClick={() => deleteUser(u.email, u.name)} style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid transparent', background: 'transparent',
                color: 'var(--text-4)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                transition: 'all var(--dur) var(--ease)' }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(248,113,113,0.1)'; b.style.color = 'var(--neg)'; b.style.borderColor = 'rgba(248,113,113,0.3)' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-4)'; b.style.borderColor = 'transparent' }}>
                <I.x size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>No users found.</div>
        )}
      </div>
    </>
  )
}

// ── Upload Modal ───────────────────────────────────────────
interface UploadModalProps { file: File; onConfirm: (dept: string) => void; onCancel: () => void; uploading: boolean }
function UploadModal({ file, onConfirm, onCancel, uploading }: UploadModalProps) {
  const [dept, setDept] = useState('hr')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center',
      background: 'rgba(6,9,18,0.72)', backdropFilter: 'blur(6px)' }}>
      <div style={{ borderRadius: 20, padding: 28, width: 400, maxWidth: '90vw',
        background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Upload document</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)' }}>
          {file.name} · {formatBytes(file.size)}
        </p>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Department</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {[{ id: 'hr', label: 'Human Resources' }, { id: 'operations', label: 'Operations' }].map(d => (
            <button key={d.id} onClick={() => setDept(d.id)} style={{
              flex: 1, height: 40, borderRadius: 10, border: '1px solid',
              borderColor: dept === d.id ? 'var(--border-ai)' : 'var(--border)',
              background: dept === d.id ? 'var(--indigo-soft)' : 'transparent',
              color: dept === d.id ? 'var(--indigo)' : 'var(--text-2)',
              fontSize: 13.5, fontWeight: dept === d.id ? 600 : 400, cursor: 'pointer',
              transition: 'all var(--dur) var(--ease)' }}>{d.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={uploading} style={{ flex: 1, height: 42, borderRadius: 11,
            border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(dept)} disabled={uploading} style={{ flex: 2, height: 42, borderRadius: 11,
            border: 'none', background: 'var(--ai-grad)', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {uploading
              ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />Uploading…</>
              : <><I.upload size={15} /> Upload & Index</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Doc Library ────────────────────────────────────────────
interface ApiDoc {
  id: string; title: string; department_slug: string; doc_type: string
  current_version: number; updated_at: string
  document_versions?: { file_size: number; indexing_status: string }[]
}

function statusOf(doc: ApiDoc): 'Indexed' | 'Processing' | 'Review' {
  const s = doc.document_versions?.[0]?.indexing_status
  if (s === 'ready') return 'Indexed'
  if (s === 'processing' || s === 'pending') return 'Processing'
  return 'Review'
}

interface DocLibraryProps { docs: ApiDoc[]; setDocs: React.Dispatch<React.SetStateAction<ApiDoc[]>>; loading: boolean; reload: () => void }
function DocLibrary({ docs, setDocs, loading, reload }: DocLibraryProps) {
  const [q, setQ] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const uploadId = 'doc-upload-input'

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 5000) }

  const filtered = docs.filter(d => (d.title + d.department_slug).toLowerCase().includes(q.toLowerCase()))

  // Poll every 3s until no docs are still in processing/pending state
  useEffect(() => {
    const hasProcessing = docs.some(d => {
      const s = d.document_versions?.[0]?.indexing_status
      return s === 'processing' || s === 'pending'
    })
    if (!hasProcessing) return
    const timer = setTimeout(reload, 3000)
    return () => clearTimeout(timer)
  }, [docs, reload])

  const handleUpload = async (dept: string) => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
      form.append('department_slug', dept)
      form.append('doc_type', 'general')
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form, credentials: 'include' })
      let json: { data?: { document_id?: string; indexing_status?: string; chunks_indexed?: number }; error?: string }
      try { json = await res.json() } catch { json = { error: `Server error ${res.status}` } }
      if (!res.ok || json.error) { showToast(json.error || `HTTP ${res.status}`, false); return }

      // Use real indexing_status from response (ingestion runs inline, so it may already be 'ready')
      const realStatus = json.data?.indexing_status || 'pending'
      const chunksMsg = json.data?.chunks_indexed ? ` · ${json.data.chunks_indexed} chunks indexed` : ''

      const optimistic: ApiDoc = {
        id: json.data?.document_id || `tmp-${Date.now()}`,
        title: pendingFile.name.replace(/\.[^.]+$/, ''),
        department_slug: dept, doc_type: 'general',
        current_version: 1, updated_at: new Date().toISOString(),
        document_versions: [{ file_size: pendingFile.size, indexing_status: realStatus }],
      }
      setDocs(prev => [optimistic, ...prev])
      showToast(
        realStatus === 'ready'
          ? `"${pendingFile.name}" indexed${chunksMsg}`
          : `"${pendingFile.name}" uploaded — indexing in progress`,
        true
      )
      // Reload from DB to get the canonical record
      setTimeout(reload, 1500)
    } catch (e) { showToast(e instanceof Error ? e.message : 'Upload failed', false) }
    finally { setUploading(false); setPendingFile(null) }
  }

  const deleteDoc = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json()
    if (json.error) { showToast(json.error, false); return }
    setDocs(prev => prev.filter(d => d.id !== id))
    showToast(`"${title}" deleted`, true)
  }

  return (
    <>
      {pendingFile && <UploadModal file={pendingFile} onConfirm={handleUpload} onCancel={() => setPendingFile(null)} uploading={uploading} />}
      {toast && (
        <div className="toast-enter" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 500,
          background: toast.ok ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.ok ? 'var(--pos)' : 'var(--neg)', boxShadow: 'var(--shadow-elevated)' }}>
          {toast.msg}
        </div>
      )}
      <input id={uploadId} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = '' }}
        accept=".pdf,.docx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, zIndex: -1 }} />

      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', flex: 1, maxWidth: 300,
            borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
            <I.search size={15} style={{ color: 'var(--text-3)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search documents…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }} />
          <label htmlFor={uploadId} style={{
            display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 10,
            background: 'var(--ai-grad)', color: '#fff', fontSize: 13.5, fontWeight: 600,
            boxShadow: '0 4px 14px -6px rgba(99,102,241,0.7)', cursor: 'pointer', userSelect: 'none' }}>
            <I.upload size={15} /> Upload
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.2fr 0.6fr 1fr 1fr 70px', gap: 10, padding: '10px 18px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-4)',
          borderBottom: '1px solid var(--border-soft)' }}>
          <span>Document</span><span>Department</span><span>Ver</span><span>Updated</span><span>Status</span><span></span>
        </div>
        {loading ? (
          <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
            No documents yet. Click <strong style={{ color: 'var(--text-1)' }}>Upload</strong> to add your first document.
          </div>
        ) : filtered.map((d, i) => (
          <div key={d.id} style={{
            display: 'grid', gridTemplateColumns: '2.2fr 1.2fr 0.6fr 1fr 1fr 70px', gap: 10,
            alignItems: 'center', padding: '12px 18px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border-soft)' : 'none',
            transition: 'background var(--dur) var(--ease)' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flex: 'none', display: 'grid', placeItems: 'center',
                background: 'var(--indigo-soft)', border: '1px solid var(--border-ai)', color: 'var(--indigo)' }}>
                <I.doc size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{formatBytes(d.document_versions?.[0]?.file_size ?? 0)}</div>
              </div>
            </div>
            <span className="badge badge-user" style={{ fontSize: 11 }}>{d.department_slug}</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>v{d.current_version}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{formatDate(d.updated_at)}</span>
            <StatusChip status={statusOf(d)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button title="Delete document" onClick={() => deleteDoc(d.id, d.title)} style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid transparent', background: 'transparent',
                color: 'var(--text-4)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                transition: 'all var(--dur) var(--ease)' }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(248,113,113,0.1)'; b.style.color = 'var(--neg)'; b.style.borderColor = 'rgba(248,113,113,0.3)' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-4)'; b.style.borderColor = 'transparent' }}>
                <I.x size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Audit Logs ─────────────────────────────────────────────
interface LogEntry { id: string; action: string; resource: string | null; department_slug: string | null; metadata: Record<string, unknown>; created_at: string }

function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/logs', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setLogs(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const ACTION_COLORS: Record<string, string> = {
    upload_doc: 'var(--indigo)', index_doc: 'var(--pos)', delete_doc: 'var(--neg)',
    invite_user: 'var(--violet)', deactivate_user: 'var(--warn)', query: 'var(--text-2)',
  }

  return (
    <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Audit Log</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Last 50 actions — append-only</div>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/admin/logs', { credentials: 'include' }).then(r => r.json()).then(j => { if (j.data) setLogs(j.data) }).finally(() => setLoading(false)) }}
          style={{ height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.7fr 1fr', gap: 10, padding: '10px 18px',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-4)',
        borderBottom: '1px solid var(--border-soft)' }}>
        <span>Action</span><span>Resource</span><span>Department</span><span>Time</span>
      </div>
      {loading ? (
        <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '40px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>No audit logs yet.</div>
      ) : logs.map((l, i) => (
        <div key={l.id} style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.7fr 1fr', gap: 10,
          alignItems: 'center', padding: '11px 18px',
          borderBottom: i < logs.length - 1 ? '1px solid var(--border-soft)' : 'none',
          transition: 'background var(--dur) var(--ease)' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
          <span style={{ fontSize: 13, fontWeight: 600, color: ACTION_COLORS[l.action] || 'var(--text-1)' }}>
            {l.action.replace(/_/g, ' ')}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {l.resource || '—'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{l.department_slug?.toUpperCase() || '—'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{formatTime(l.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Settings ───────────────────────────────────────────────
function Settings() {
  const { theme, toggle } = useTheme()
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
      borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Appearance</div>
        <Row label="Theme" desc="Switch between dark and light mode">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <Toggle on={theme === 'light'} onChange={toggle} />
          </div>
        </Row>
      </div>

      <div style={{ borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Platform</div>
        <Row label="Ollama endpoint" desc="Local LLM base URL">
          <input defaultValue="http://localhost:11434" style={{ height: 36, padding: '0 12px', borderRadius: 9, fontSize: 13,
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-1)', outline: 'none', width: 220 }} />
        </Row>
        <Row label="Default model" desc="Primary LLM for chat responses">
          <select defaultValue="llama3.2:3b" style={{ height: 36, padding: '0 10px', borderRadius: 9, fontSize: 13, cursor: 'pointer',
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
            <option value="llama3.2:3b">llama3.2:3b</option>
            <option value="gemma4:latest">gemma4</option>
            <option value="qwen3.5:9b">qwen3.5:9b</option>
            <option value="deepseek-r1:7b">deepseek-r1:7b</option>
          </select>
        </Row>
        <Row label="Fallback LLM" desc="Used when Ollama is unavailable">
          <select defaultValue="anthropic" style={{ height: 36, padding: '0 10px', borderRadius: 9, fontSize: 13, cursor: 'pointer',
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
            <option value="anthropic">Anthropic Claude</option>
            <option value="none">None (offline only)</option>
          </select>
        </Row>
      </div>

      <div style={{ borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>RAG</div>
        <Row label="Max retrieved chunks" desc="Chunks sent to LLM per query">
          <input type="number" defaultValue={5} min={1} max={20} style={{ height: 36, padding: '0 12px', borderRadius: 9, fontSize: 13, width: 80, textAlign: 'center',
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-1)', outline: 'none' }} />
        </Row>
        <Row label="Similarity threshold" desc="Minimum cosine similarity (0–1)">
          <input type="number" defaultValue={0.3} step={0.05} min={0.1} max={0.9} style={{ height: 36, padding: '0 12px', borderRadius: 9, fontSize: 13, width: 80, textAlign: 'center',
            background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-1)', outline: 'none' }} />
        </Row>
        <Row label="PII detection" desc="Mask sensitive data before sending to LLM">
          <Toggle on={true} onChange={() => {}} />
        </Row>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} style={{ height: 40, padding: '0 24px', borderRadius: 10, border: 'none',
          background: saved ? 'var(--pos)' : 'var(--ai-grad)', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.3s' }}>
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}

// ── AdminScreen ────────────────────────────────────────────
interface AdminScreenProps { tab: string }

export default function AdminScreen({ tab }: AdminScreenProps) {
  const { theme, toggle } = useTheme()

  // Lift docs state here so it survives tab switches
  const [docs, setDocs] = useState<ApiDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsFetched, setDocsFetched] = useState(false)

  const reloadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await fetch('/api/documents', { credentials: 'include' })
      if (!res.ok) return
      const json = await res.json()
      if (json.data) setDocs(json.data)
      setDocsFetched(true)
    } finally { setDocsLoading(false) }
  }, [])

  // Fetch docs once on mount
  useEffect(() => { reloadDocs() }, [reloadDocs])

  const titles: Record<string, [string, string]> = {
    users:       ['Users',            'Manage members, roles, and access'],
    documents:   ['Document library', 'All indexed sources across departments'],
    departments: ['Departments',      'Team spaces & retrieval scopes'],
    logs:        ['Audit logs',       'Query & access history'],
    settings:    ['Settings',         'Platform configuration'],
  }
  const [t0, t1] = titles[tab] ?? titles.users

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ flex: 'none', height: 60, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--glass)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.1, color: 'var(--text-1)' }}>{t0}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t1}</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="badge badge-admin" style={{ fontSize: 11 }}><I.shield size={11} /> Admin</span>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>
        <div className="fade-in" style={{ maxWidth: 1180, margin: '0 auto' }}>
          {tab === 'users' && <UsersTable />}
          {tab === 'documents' && <DocLibrary docs={docs} setDocs={setDocs} loading={docsLoading && !docsFetched} reload={reloadDocs} />}
          {tab === 'logs' && <AuditLogs />}
          {tab === 'settings' && <Settings />}
          {tab === 'departments' && (
            <div style={{ borderRadius: 'var(--r-lg)', padding: 48, display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', background: 'var(--surface-1)',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', marginBottom: 16,
                background: 'var(--indigo-soft)', border: '1px solid var(--border-ai)' }}>
                <I.layers size={24} style={{ color: 'var(--indigo)' }} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600 }}>Departments</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.6 }}>
                HR and Operations are active. Department management coming in v2.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {['HR', 'Operations'].map(d => (
                  <span key={d} className="badge badge-admin" style={{ padding: '6px 16px', height: 'auto', fontSize: 13 }}>{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
