import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/dashboard — stats for admin and manager dashboards
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, roles(name)')
    .eq('id', user.id)
    .single()

  const role = (profile?.roles as unknown as { name: string })?.name
  if (!role || role === 'end_user') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const isAdmin = role === 'admin'
  const dept = profile?.department

  // Total documents
  const docQuery = admin.from('documents').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (!isAdmin && dept) docQuery.eq('department_slug', dept)
  const { count: totalDocs } = await docQuery

  // Active users (logged in last 7 days) — approximated via profiles
  const { count: activeUsers } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // Queries today
  const today = new Date().toISOString().split('T')[0]
  const msgQuery = admin.from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', `${today}T00:00:00Z`)
  const { count: queriesToday } = await msgQuery

  // Token usage today
  const { data: tokenData } = await admin
    .from('daily_token_usage')
    .select('total_tokens, query_count')
    .eq('usage_date', today)

  const totalTokensToday = tokenData?.reduce((s, r) => s + (r.total_tokens || 0), 0) ?? 0

  // Document coverage by department
  const { data: deptDocs } = await admin
    .from('documents')
    .select('department_slug')
    .eq('is_active', true)

  const coverage: Record<string, number> = {}
  deptDocs?.forEach(d => {
    if (d.department_slug) coverage[d.department_slug] = (coverage[d.department_slug] || 0) + 1
  })

  // Recent queries (last 10)
  const recentQuery = admin
    .from('chat_messages')
    .select('id, content, created_at, session_id, chat_sessions(department_slug, user_id)')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(10)
  const { data: recentMessages } = await recentQuery

  // Audit log (last 10, admin only)
  let auditLogs = null
  if (isAdmin) {
    const { data } = await admin
      .from('audit_logs')
      .select('id, action, resource, department_slug, metadata, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10)
    auditLogs = data
  }

  return NextResponse.json({
    data: {
      stats: {
        total_docs: totalDocs ?? 0,
        active_users: activeUsers ?? 0,
        queries_today: queriesToday ?? 0,
        tokens_today: totalTokensToday,
      },
      coverage,
      recent_queries: recentMessages ?? [],
      audit_logs: auditLogs,
    },
    error: null,
  })
}
