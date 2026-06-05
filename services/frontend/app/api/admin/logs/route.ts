export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Use service-role client to bypass RLS â€” access is already gated by auth above
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('audit_logs')
    .select('id, action, resource, resource_id, department_slug, metadata, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

