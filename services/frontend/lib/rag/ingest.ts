// Shared ingestion function — called directly from upload route
// Avoids the self-HTTP call + cookie forwarding issues

import { createAdminClient } from '@/lib/supabase/admin'
import { extractText } from './extractor'
import { chunkText } from './chunker'
import { embedBatch } from '@/lib/llm/embeddings'
import { indexChunk, ensureIndex } from '@/lib/search/elasticsearch'

export async function runIngestion(
  documentId: string,
  versionNumber: number,
  userId: string
): Promise<{ chunks_indexed: number }> {
  const admin = createAdminClient()

  // Get document version
  const { data: version, error: vErr } = await admin
    .from('document_versions')
    .select('*, documents(title, department_slug)')
    .eq('document_id', documentId)
    .eq('version_number', versionNumber)
    .single()

  if (vErr || !version) throw new Error('Document version not found')

  await admin.from('document_versions')
    .update({ indexing_status: 'processing' })
    .eq('id', version.id)

  try {
    // Download from Supabase Storage
    const { data: fileData, error: dlErr } = await admin.storage
      .from('refinery-docs')
      .download(version.storage_path)

    if (dlErr || !fileData) throw new Error('Failed to download file from storage')

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Extract text
    const text = await extractText(buffer, version.mime_type || 'text/plain', version.file_name)
    if (!text || text.trim().length < 10) throw new Error('No text extracted from document')

    // Chunk
    const chunks = chunkText(text)
    if (chunks.length === 0) throw new Error('Document produced no chunks')

    const doc = version.documents as { title: string; department_slug: string }

    // All embeddings in one parallel call
    const allEmbeddings = await embedBatch(chunks.map(c => c.text))

    // Batch insert chunks
    const { data: chunkRecords, error: chunkErr } = await admin
      .from('document_chunks')
      .insert(chunks.map(c => ({
        document_id: documentId,
        version_number: versionNumber,
        chunk_index: c.index,
        page_number: c.pageHint,
        text_preview: c.text.slice(0, 500),
        token_count: c.tokenCount,
      })))
      .select('id')

    if (chunkErr || !chunkRecords?.length) throw new Error('Failed to insert chunks')

    // Batch insert embeddings
    await admin.from('document_embeddings').insert(
      chunkRecords.map((rec, i) => ({
        chunk_id: rec.id,
        document_id: documentId,
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
    )

    // Elasticsearch — non-blocking
    ensureIndex().then(() =>
      Promise.all(chunkRecords.map((rec, i) =>
        indexChunk(rec.id, documentId, chunks[i].text, doc.department_slug, {
          filename: version.file_name,
          page_number: chunks[i].pageHint,
          title: doc.title,
          chunk_index: chunks[i].index,
        })
      ))
    ).catch(() => {})

    // Mark ready
    await admin.from('document_versions').update({
      indexing_status: 'ready',
      indexed: true,
      ocr_processed: true,
    }).eq('id', version.id)

    // Audit log
    await admin.rpc('log_action', {
      p_user_id: userId,
      p_action: 'index_doc',
      p_resource: 'document',
      p_resource_id: documentId,
      p_dept_slug: doc.department_slug,
      p_metadata: { chunks: chunks.length, version: versionNumber },
    })

    return { chunks_indexed: chunks.length }
  } catch (e) {
    await admin.from('document_versions')
      .update({ indexing_status: 'error' })
      .eq('id', version.id)
    throw e
  }
}
