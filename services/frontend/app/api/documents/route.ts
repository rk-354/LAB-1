import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/documents?dept=hr — list documents for the current user's department
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dept = searchParams.get('dept')

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, roles(name)')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile?.roles as unknown as { name: string })?.name === 'admin'
  const targetDept = dept || profile?.department

  let query = supabase
    .from('documents')
    .select(`
      id, title, description, department_slug, doc_type, tags,
      current_version, created_at, updated_at,
      document_versions(id, version_number, file_name, file_size, mime_type, indexing_status, created_at)
    `)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (!isAdmin && targetDept) query = query.eq('department_slug', targetDept)
  else if (targetDept && targetDept !== 'all') query = query.eq('department_slug', targetDept)

  const { data, error } = await query
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  return NextResponse.json({ data, error: null })
}

const UploadSchema = z.object({
  title: z.string().min(1).max(500),
  department_slug: z.string(),
  doc_type: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  storage_path: z.string(),
  file_name: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
})

// POST /api/documents — create document record after file upload to Storage
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = UploadSchema.parse(await req.json())
    const admin = createAdminClient()

    const { data: doc, error: docErr } = await admin
      .from('documents')
      .insert({ ...body, uploaded_by: user.id })
      .select()
      .single()

    if (docErr) return NextResponse.json({ data: null, error: docErr.message }, { status: 500 })

    const { error: vErr } = await admin
      .from('document_versions')
      .insert({
        document_id: doc.id,
        version_number: 1,
        storage_path: body.storage_path,
        file_name: body.file_name,
        file_size: body.file_size,
        mime_type: body.mime_type,
        uploaded_by: user.id,
        indexing_status: 'pending',
      })

    if (vErr) return NextResponse.json({ data: null, error: vErr.message }, { status: 500 })

    // Log action
    await admin.rpc('log_action', {
      p_user_id: user.id,
      p_action: 'upload_doc',
      p_resource: 'document',
      p_resource_id: doc.id,
      p_dept_slug: body.department_slug,
      p_metadata: { file_name: body.file_name, file_size: body.file_size },
    })

    return NextResponse.json({ data: doc, error: null }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE /api/documents?id=xxx — soft delete (managers own dept, admins all)
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ data: null, error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('documents').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  await admin.rpc('log_action', {
    p_user_id: user.id, p_action: 'delete_doc',
    p_resource: 'document', p_resource_id: id, p_metadata: {},
  })
  return NextResponse.json({ data: { deleted: true }, error: null })
}
