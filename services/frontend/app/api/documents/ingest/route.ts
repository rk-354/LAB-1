export const runtime = 'nodejs'

// POST /api/documents/ingest
// Triggered after a file is uploaded to Supabase Storage.
// Runs: extract text → chunk → embed → store pgvector + Elasticsearch

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { indexChunk, ensureIndex } from '@/lib/search/elasticsearch'
import { extractText } from '@/lib/rag/extractor'
import { chunkText } from '@/lib/rag/chunker'
import { embedBatch } from '@/lib/llm/embeddings'

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
    const admin = createAdminClient()

    // Get document version
    const { data: version, error: vErr } = await admin
      .from('document_versions')
      .select('*, documents(title, department_slug)')
      .eq('document_id', body.document_id)
      .eq('version_number', body.version_number)
      .single()

    if (vErr || !version) {
      return NextResponse.json({ data: null, error: 'Document version not found' }, { status: 404 })
    }

    // Mark as processing
    await admin.from('document_versions')
      .update({ indexing_status: 'processing' })
      .eq('id', version.id)

    // Download file from Supabase Storage
    const { data: fileData, error: dlErr } = await admin.storage
      .from('refinery-docs')
      .download(version.storage_path)

    if (dlErr || !fileData) {
      await admin.from('document_versions').update({ indexing_status: 'error' }).eq('id', version.id)
      return NextResponse.json({ data: null, error: 'Failed to download file' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Extract text
    const text = await extractText(buffer, version.mime_type || 'text/plain', version.file_name)
    if (!text || text.trim().length < 10) {
      await admin.from('document_versions').update({ indexing_status: 'error' }).eq('id', version.id)
      return NextResponse.json({ data: null, error: 'No text extracted from document' }, { status: 422 })
    }

    // Chunk text
    const chunks = chunkText(text)

    const doc = version.documents as { title: string; department_slug: string }

    // ── Fast path: all embeddings in ONE parallel Promise.all ──────────────
    const allEmbeddings = await embedBatch(chunks.map(c => c.text))

    // ── Batch insert ALL chunk metadata in one DB call ─────────────────────
    const { data: chunkRecords, error: chunkErr } = await admin
      .from('document_chunks')
      .insert(chunks.map(c => ({
        document_id: body.document_id,
        version_number: body.version_number,
        chunk_index: c.index,
        page_number: c.pageHint,
        text_preview: c.text.slice(0, 500),
        token_count: c.tokenCount,
      })))
      .select('id')

    if (chunkErr || !chunkRecords?.length) {
      await admin.from('document_versions').update({ indexing_status: 'error' }).eq('id', version.id)
      return NextResponse.json({ data: null, error: 'Failed to insert chunks' }, { status: 500 })
    }

    // ── Batch insert ALL embeddings in one DB call ─────────────────────────
    const embeddingRows = chunkRecords.map((rec, i) => ({
      chunk_id: rec.id,
      document_id: body.document_id,
      department_slug: doc.department_slug,
      embedding: allEmbeddings[i],
      chunk_text: chunks[i].text,
      metadata: {
        filename: version.file_name,
        page_number: chunks[i].pageHint,
        title: doc.title,
        chunk_index: chunks[i].index,
      },
    }))

    await admin.from('document_embeddings').insert(embeddingRows)

    // ── Elasticsearch indexing — fire-and-forget (non-blocking) ───────────
    ensureIndex().then(() =>
      Promise.all(chunkRecords.map((rec, i) =>
        indexChunk(rec.id, body.document_id, chunks[i].text, doc.department_slug, {
          filename: version.file_name,
          page_number: chunks[i].pageHint,
          title: doc.title,
          chunk_index: chunks[i].index,
        })
      ))
    ).catch(() => { /* ES is optional — don't fail if it's down */ })

    // Mark as ready
    await admin.from('document_versions').update({
      indexing_status: 'ready',
      indexed: true,
      ocr_processed: true,
    }).eq('id', version.id)

    // Log audit
    await admin.rpc('log_action', {
      p_user_id: user.id,
      p_action: 'index_doc',
      p_resource: 'document',
      p_resource_id: body.document_id,
      p_dept_slug: doc.department_slug,
      p_metadata: { chunks: chunks.length, version: body.version_number },
    })

    return NextResponse.json({
      data: { chunks_indexed: chunks.length, status: 'ready' },
      error: null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ingestion failed'
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }
}
