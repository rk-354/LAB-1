export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/documents/upload
// Uploads to Supabase Storage + runs ingestion inline (no self-HTTP call)

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runIngestion } from '@/lib/rag/ingest'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/plain': 'txt',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const departmentSlug = formData.get('department_slug') as string | null
  const title = (formData.get('title') as string | null) || ''
  const docType = (formData.get('doc_type') as string | null) || 'general'

  if (!file) return NextResponse.json({ data: null, error: 'No file provided' }, { status: 400 })
  if (!departmentSlug) return NextResponse.json({ data: null, error: 'department_slug required' }, { status: 400 })
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ data: null, error: `Unsupported file type: ${file.type}` }, { status: 422 })
  }
  if (file.size > 52_428_800) {
    return NextResponse.json({ data: null, error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const docTitle = title || file.name.replace(/\.[^.]+$/, '')

  // Create document record
  const { data: doc, error: docErr } = await admin
    .from('documents')
    .insert({
      title: docTitle,
      department_slug: departmentSlug,
      doc_type: docType,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (docErr || !doc) {
    return NextResponse.json({ data: null, error: docErr?.message || 'Failed to create document' }, { status: 500 })
  }

  // Upload to Supabase Storage
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${departmentSlug}/${doc.id}/v1/${Date.now()}-${safeFileName}`

  const { error: uploadErr } = await admin.storage
    .from('refinery-docs')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) {
    await admin.from('documents').delete().eq('id', doc.id)
    return NextResponse.json({ data: null, error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 })
  }

  // Create version record
  const { data: version, error: vErr } = await admin
    .from('document_versions')
    .insert({
      document_id: doc.id,
      version_number: 1,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      checksum,
      uploaded_by: user.id,
      indexing_status: 'pending',
    })
    .select('id')
    .single()

  if (vErr) {
    return NextResponse.json({ data: null, error: vErr.message }, { status: 500 })
  }

  // Audit log
  await admin.rpc('log_action', {
    p_user_id: user.id,
    p_action: 'upload_doc',
    p_resource: 'document',
    p_resource_id: doc.id,
    p_dept_slug: departmentSlug,
    p_metadata: { file_name: file.name, file_size: file.size, mime_type: file.type },
  })

  // Run ingestion inline â€” no HTTP self-call, no auth issues, immediate result
  let indexingStatus = 'error'
  let chunksIndexed = 0
  try {
    const result = await runIngestion(doc.id, 1, user.id)
    chunksIndexed = result.chunks_indexed
    indexingStatus = 'ready'
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ingestion failed'
    logger.error('upload: ingestion failed', { document_id: doc.id, error: msg })
    // Don't fail the whole upload â€” file is in storage, just not indexed yet
    indexingStatus = 'error'
  }

  return NextResponse.json({
    data: {
      document_id: doc.id,
      version_id: version?.id,
      storage_path: storagePath,
      indexing_status: indexingStatus,
      chunks_indexed: chunksIndexed,
    },
    error: null,
  }, { status: 201 })
}

