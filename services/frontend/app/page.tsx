'use client'

/* ============================================================
   RefinerIQ — Root app: routing, shell
   ============================================================ */

import React, { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Sidebar from '@/components/Sidebar'
import ChatScreen from '@/components/chat/ChatScreen'
import DashboardScreen from '@/components/dashboard/DashboardScreen'
import AdminScreen from '@/components/admin/AdminScreen'

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "")
  const expanded = h.length === 3
    ? h.split("").map(c => c + c).join("")
    : h
  const n = parseInt(expanded, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState("chat")
  const [collapsed, setCollapsed] = useState(false)
  const [dept, setDept] = useState("safety")
  const [activeConv, setActiveConv] = useState<string | null>("c1")
  const [adminTab, setAdminTab] = useState("users")
  const [aiCardStyle] = useState("glass")

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", background: "var(--bg-base)" }}>
      <Sidebar
        view={view}
        setView={setView}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        dept={dept}
        setDept={setDept}
        activeConv={activeConv}
        setActiveConv={setActiveConv}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        onLogout={() => setAuthed(false)}
      />
      <main style={{ flex: 1, minWidth: 0, height: "100%", background: "var(--bg-navy)", position: "relative" }}>
        {view === "chat" && (
          <ChatScreen
            key={"chat-" + dept + "-" + activeConv}
            dept={dept}
            cardVariant={aiCardStyle}
          />
        )}
        {view === "dashboard" && <DashboardScreen />}
        {view === "admin" && <AdminScreen tab={adminTab} />}
      </main>
    </div>
  )
}
