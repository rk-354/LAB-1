import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/admin/users — list all users (admin only)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()

  if ((profile?.roles as unknown as { name: string })?.name !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, employee_id, department, is_active, created_at, roles(id, name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

const InviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role_id: z.number().int().min(1).max(3),
  department: z.string(),
})

// POST /api/admin/users — invite a new user (admin only)
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()

  if ((profile?.roles as unknown as { name: string })?.name !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = InviteSchema.parse(await req.json())
    const admin = createAdminClient()

    // Invite user via Supabase Auth
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      body.email,
      { data: { full_name: body.full_name }, redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
    )

    if (inviteErr) return NextResponse.json({ data: null, error: inviteErr.message }, { status: 400 })

    // Update profile with role + department
    await admin.from('profiles').update({
      full_name: body.full_name,
      role_id: body.role_id,
      department: body.department,
    }).eq('id', invited.user.id)

    // Audit log
    await admin.rpc('log_action', {
      p_user_id: user.id,
      p_action: 'invite_user',
      p_resource: 'user',
      p_resource_id: invited.user.id,
      p_metadata: { email: body.email, role_id: body.role_id },
    })

    return NextResponse.json({ data: { id: invited.user.id }, error: null }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}

const UpdateSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.boolean().optional(),
  role_id: z.number().int().min(1).max(3).optional(),
  department: z.string().optional(),
})

// PATCH /api/admin/users — update role or status
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()

  if ((profile?.roles as unknown as { name: string })?.name !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { user_id, ...updates } = UpdateSchema.parse(await req.json())
    const admin = createAdminClient()

    const { error } = await admin.from('profiles').update(updates).eq('id', user_id)
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

    return NextResponse.json({ data: { updated: true }, error: null })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}
