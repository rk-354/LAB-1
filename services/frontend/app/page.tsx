'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import ChatScreen from '@/components/chat/ChatScreen'
import DashboardScreen from '@/components/dashboard/DashboardScreen'
import AdminScreen from '@/components/admin/AdminScreen'

export default function App() {
  const [view, setView] = useState<string>('chat')
  const [collapsed, setCollapsed] = useState(false)
  const [dept, setDept] = useState('hr')
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [adminTab, setAdminTab] = useState('users')
  const [ready, setReady] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO === '1') { setReady(true); return }
    // Verify session exists (middleware handles redirect if not, this is a safety check)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login'
      } else {
        setReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.href = '/login'
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!ready) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--indigo)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading RefinerIQ…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--bg-base)' }}>
      <Sidebar
        view={view} setView={setView}
        collapsed={collapsed} setCollapsed={setCollapsed}
        dept={dept} setDept={setDept}
        activeConv={activeConv} setActiveConv={setActiveConv}
        adminTab={adminTab} setAdminTab={setAdminTab}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, minWidth: 0, height: '100%', background: 'var(--bg-navy)', position: 'relative' }}>
        {view === 'chat' && <ChatScreen key={'chat-' + dept + '-' + (activeConv ?? 'new')} dept={dept} cardVariant='glass' sessionId={activeConv} />}
        {view === 'dashboard' && <DashboardScreen />}
        {view === 'admin' && <AdminScreen tab={adminTab} />}
      </main>
    </div>
  )
}
