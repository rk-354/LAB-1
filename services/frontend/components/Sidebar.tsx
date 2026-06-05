'use client'

/* ============================================================
   RefinerIQ — App sidebar (collapsible, context-aware)
   ============================================================ */

import React, { useState } from 'react'
import { Logo, Avatar, RoleBadge, IconBtn } from './ui'
import { I } from './icons'
import { DEPARTMENTS, CONVERSATIONS, CURRENT_USER } from '@/lib/data'

/* ---- NavItem ---- */
interface NavItemProps {
  icon: (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  badge?: number | string | null;
}

function NavItem({ icon: Ico, label, active, collapsed, onClick, badge }: NavItemProps) {
  return (
    <button
      className="focusable"
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        height: 42, padding: collapsed ? 0 : "0 12px", justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 11, border: "none", textAlign: "left",
        background: active ? "var(--indigo-soft)" : "transparent",
        color: active ? "var(--text-1)" : "var(--text-2)",
        position: "relative", transition: "all var(--dur) var(--ease)", fontFamily: "inherit",
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
      }}
    >
      {active && (
        <span style={{
          position: "absolute", left: collapsed ? 6 : 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, borderRadius: 3, background: "var(--ai-grad)"
        }} />
      )}
      <Ico size={19} style={{ flex: "none", color: active ? "#B9A6FA" : "var(--text-2)" }} />
      {!collapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, flex: 1 }}>{label}</span>}
      {!collapsed && badge != null && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{badge}</span>
      )}
    </button>
  )
}

/* ---- DeptSelector ---- */
interface DeptSelectorProps {
  value: string;
  onChange: (id: string) => void;
  collapsed?: boolean;
}

function DeptSelector({ value, onChange, collapsed }: DeptSelectorProps) {
  const [open, setOpen] = useState(false)
  const cur = DEPARTMENTS.find(d => d.id === value) ?? DEPARTMENTS[0]

  if (collapsed) {
    return (
      <div
        title={cur.name}
        style={{
          display: "grid", placeItems: "center", height: 40, margin: "0 auto", width: 40,
          borderRadius: 10, background: "var(--glass-faint)", border: "1px solid var(--border)",
          fontSize: 11, fontWeight: 700, color: "var(--text-2)"
        }}
      >{cur.short}</div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="focusable"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%", height: 40, padding: "0 11px",
          borderRadius: 10, background: "var(--glass-faint)", border: "1px solid var(--border)",
          color: "var(--text-1)", transition: "all var(--dur) var(--ease)",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}
      >
        <span style={{
          width: 26, height: 18, borderRadius: 5, display: "grid", placeItems: "center",
          fontSize: 9.5, fontWeight: 700, color: "#fff", background: "var(--ai-grad)", flex: "none"
        }}>{cur.short}</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500 }}>{cur.name}</span>
        <I.chevD size={15} style={{
          color: "var(--text-3)",
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform var(--dur)"
        }} />
      </button>
      {open && (
        <div
          className="glass fade-in"
          style={{
            position: "absolute", top: 46, left: 0, right: 0, zIndex: 40,
            borderRadius: 12, padding: 5, boxShadow: "var(--shadow-card)", background: "var(--glass-strong)"
          }}
        >
          {DEPARTMENTS.map(d => (
            <button
              key={d.id}
              onClick={() => { onChange(d.id); setOpen(false) }}
              style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", height: 36, padding: "0 9px",
                borderRadius: 8, border: "none", background: d.id === value ? "var(--indigo-soft)" : "transparent",
                color: "var(--text-1)", fontSize: 13, textAlign: "left",
              }}
              onMouseEnter={e => {
                if (d.id !== value) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"
              }}
              onMouseLeave={e => {
                if (d.id !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
              }}
            >
              <span style={{ width: 24, fontSize: 9.5, fontWeight: 700, color: "var(--text-3)" }}>{d.short}</span>
              <span style={{ flex: 1 }}>{d.name}</span>
              {d.id === value && <I.check size={14} style={{ color: "#B9A6FA" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---- Admin nav ---- */
const ADMIN_NAV = [
  { id: "users",       label: "Users",       icon: I.users   },
  { id: "documents",   label: "Documents",   icon: I.folder  },
  { id: "departments", label: "Departments", icon: I.layers  },
  { id: "logs",        label: "Logs",        icon: I.logs    },
  { id: "settings",    label: "Settings",    icon: I.settings},
]

/* ---- Sidebar ---- */
export interface SidebarProps {
  view: string;
  setView: (v: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  dept: string;
  setDept: (v: string) => void;
  activeConv: string | null;
  setActiveConv: (v: string | null) => void;
  adminTab: string;
  setAdminTab: (v: string) => void;
  onLogout: () => void;
}

export default function Sidebar({
  view, setView,
  collapsed, setCollapsed,
  dept, setDept,
  activeConv, setActiveConv,
  adminTab, setAdminTab,
  onLogout,
}: SidebarProps) {
  const sectionLabel = (t: string) => !collapsed && (
    <div style={{
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-4)",
      textTransform: "uppercase", padding: "0 4px", marginBottom: 8
    }}>{t}</div>
  )

  return (
    <aside style={{
      width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
      flex: "none", height: "100%", display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, var(--bg-navy), var(--bg-base))",
      borderRight: "1px solid var(--border)", transition: "width 260ms var(--ease)",
      overflow: "hidden",
    }}>
      {/* Logo + collapse */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
        height: 64, padding: collapsed ? 0 : "0 16px 0 18px", flex: "none"
      }}>
        {collapsed ? <Logo size={30} withText={false} /> : <Logo size={28} textSize={17} />}
        {!collapsed && (
          <IconBtn icon={I.chevL} size={30} title="Collapse" onClick={() => setCollapsed(true)} />
        )}
      </div>
      {collapsed && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <IconBtn icon={I.chevR} size={30} title="Expand" onClick={() => setCollapsed(false)} />
        </div>
      )}

      {/* Primary nav */}
      <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
        <NavItem icon={I.chat}   label="Assistant" active={view === "chat"}      collapsed={collapsed} onClick={() => setView("chat")} />
        <NavItem icon={I.grid}   label="Dashboard" active={view === "dashboard"} collapsed={collapsed} onClick={() => setView("dashboard")} />
        <NavItem icon={I.shield} label="Admin"     active={view === "admin"}     collapsed={collapsed} onClick={() => setView("admin")} />
      </div>

      <div style={{ height: 1, background: "var(--border-soft)", margin: collapsed ? "8px 16px" : "10px 18px" }} />

      {/* Context section */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px", minHeight: 0 }}>
        {view === "chat" && (
          <>
            <button
              className="focusable"
              onClick={() => setActiveConv(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 42, marginBottom: 14, borderRadius: 11,
                background: "var(--ai-grad)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600,
                boxShadow: "0 6px 20px -8px rgba(124,109,245,0.8)", padding: 0,
              }}
            >
              <I.plus size={18} />{!collapsed && "New chat"}
            </button>

            {!collapsed && (
              <div style={{ marginBottom: 16 }}>
                {sectionLabel("Department")}
                <DeptSelector value={dept} onChange={setDept} collapsed={false} />
              </div>
            )}
            {collapsed && (
              <div style={{ marginBottom: 14 }}>
                <DeptSelector value={dept} onChange={setDept} collapsed />
              </div>
            )}

            {!collapsed && (
              <>
                {sectionLabel("Recent")}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {CONVERSATIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConv(c.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px",
                        borderRadius: 9, border: "none", textAlign: "left",
                        background: activeConv === c.id ? "var(--bg-hover)" : "transparent",
                        color: activeConv === c.id ? "var(--text-1)" : "var(--text-2)",
                        transition: "background var(--dur) var(--ease)",
                      }}
                      onMouseEnter={e => {
                        if (activeConv !== c.id) (e.currentTarget as HTMLButtonElement).style.background = "var(--glass-faint)"
                      }}
                      onMouseLeave={e => {
                        if (activeConv !== c.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                      }}
                    >
                      {c.pinned
                        ? <I.pin size={13} style={{ flex: "none", color: "var(--violet)" }} />
                        : <I.chat size={13} style={{ flex: "none", opacity: 0.5 }} />
                      }
                      <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                        {c.title}
                      </span>
                      <span style={{ fontSize: 10.5, color: "var(--text-4)", flex: "none" }}>{c.time}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {view === "admin" && (
          <>
            {sectionLabel("Manage")}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {ADMIN_NAV.map(n => (
                <NavItem
                  key={n.id}
                  icon={n.icon}
                  label={n.label}
                  active={adminTab === n.id}
                  collapsed={collapsed}
                  onClick={() => setAdminTab(n.id)}
                />
              ))}
            </div>
          </>
        )}

        {view === "dashboard" && !collapsed && (
          <div style={{ padding: "4px 4px" }}>
            {sectionLabel("Overview")}
            <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
              Org-wide retrieval health, document coverage, and query sentiment across all departments.
            </p>
          </div>
        )}
      </div>

      {/* User footer */}
      <div style={{ flex: "none", borderTop: "1px solid var(--border-soft)", padding: collapsed ? "10px" : "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <Avatar initials={CURRENT_USER.initials} size={collapsed ? 34 : 36} />
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {CURRENT_USER.name}
                  </span>
                  <RoleBadge role={CURRENT_USER.role} />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {CURRENT_USER.email}
                </div>
              </div>
              <IconBtn icon={I.logout} size={32} title="Sign out" onClick={onLogout} />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
