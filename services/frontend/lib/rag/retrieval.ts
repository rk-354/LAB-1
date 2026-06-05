// RAG retrieval — semantic search via Supabase pgvector
// Returns top-k chunks with citation metadata

import { createAdminClient } from '@/lib/supabase/admin'
import { embed } from '@/lib/llm/embeddings'

export interface RetrievedChunk {
  chunkId: string
  documentId: string
  chunkText: string
  similarity: number
  metadata: {
    filename?: string
    page?: number
    department?: string
    title?: string
  }
}

export async function retrieveChunks(
  query: string,
  departmentSlug: string,
  topK = 5,
  threshold = 0.4
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embed(query)
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('match_documents', {
    query_embedding: queryEmbedding,
    dept_slug: departmentSlug,
    match_count: topK,
    match_threshold: threshold,
  })

  if (error) throw new Error(`Retrieval error: ${error.message}`)
  if (!data || data.length === 0) return []

  // Fetch document titles for citations
  const docIds = Array.from(new Set(data.map((r: { document_id: string }) => r.document_id)))
  const { data: docs } = await admin
    .from('documents')
    .select('id, title, department_slug')
    .in('id', docIds)

  const docMap = new Map(docs?.map(d => [d.id, d]) ?? [])

  return data.map((r: {
    chunk_id: string
    document_id: string
    chunk_text: string
    similarity: number
    metadata: Record<string, unknown>
  }) => {
    const doc = docMap.get(r.document_id)
    return {
      chunkId: r.chunk_id,
      documentId: r.document_id,
      chunkText: r.chunk_text,
      similarity: r.similarity,
      metadata: {
        filename: (r.metadata?.filename as string) || doc?.title || 'Unknown',
        page: r.metadata?.page_number as number | undefined,
        department: doc?.department_slug,
        title: doc?.title,
      },
    }
  })
}

export function buildRAGPrompt(
  query: string,
  chunks: RetrievedChunk[],
  department: string
): string {
  const context = chunks
    .map((c, i) =>
      `[${i + 1}] Source: ${c.metadata.filename}${c.metadata.page ? `, Page ${c.metadata.page}` : ''}\n${c.chunkText}`
    )
    .join('\n\n---\n\n')

  return `You are a knowledgeable assistant for a refinery's ${department} department.
Answer ONLY based on the provided context. If the answer is not in the context, say so clearly.
Always cite your sources using [n] notation matching the source numbers below.

CONTEXT:
${context}

QUESTION: ${query}

Provide a clear, accurate answer with citations. Format citations as [1], [2], etc.`
}
