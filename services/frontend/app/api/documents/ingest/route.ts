export const runtime = 'nodejs'

// POST /api/documents/ingest — manual trigger endpoint
// Uses shared runIngestion() from lib/rag/ingest.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runIngestion } from '@/lib/rag/ingest'

const IngestSchema = z.object({
  document_id: z.string().uuid(),
  version_number: z.number().int().default(1),
})

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = IngestSchema.parse(await req.json())
    const result = await runIngestion(body.document_id, body.version_number, user.id)
    return NextResponse.json({ data: result, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ingestion failed'
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }
}
