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

    // Generate embeddings in batches of 10
    const batchSize = 10
    const allEmbeddings: number[][] = []
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await embedBatch(batch.map(c => c.text))
      allEmbeddings.push(...embeddings)
    }

    const doc = version.documents as { title: string; department_slug: string }

    // Ensure ES index exists (no-op if already there)
    await ensureIndex()

    // Store chunks + embeddings in Supabase + Elasticsearch
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = allEmbeddings[i]
      const chunkMeta = {
        filename: version.file_name,
        page_number: chunk.pageHint,
        title: doc.title,
        chunk_index: chunk.index,
      }

      // Insert chunk metadata into PostgreSQL
      const { data: chunkRecord } = await admin
        .from('document_chunks')
        .insert({
          document_id: body.document_id,
          version_number: body.version_number,
          chunk_index: chunk.index,
          page_number: chunk.pageHint,
          text_preview: chunk.text.slice(0, 500),
          token_count: chunk.tokenCount,
        })
        .select('id')
        .single()

      if (chunkRecord) {
        // Insert embedding into pgvector
        await admin.from('document_embeddings').insert({
          chunk_id: chunkRecord.id,
          document_id: body.document_id,
          department_slug: doc.department_slug,
          embedding: embedding,
          chunk_text: chunk.text,
          metadata: chunkMeta,
        })

        // Index into Elasticsearch for BM25 keyword search
        await indexChunk(
          chunkRecord.id,
          body.document_id,
          chunk.text,
          doc.department_slug,
          chunkMeta
        )
      }
    }

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
