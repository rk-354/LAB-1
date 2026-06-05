// RAG retrieval — hybrid search: pgvector semantic + Elasticsearch BM25
// Uses Reciprocal Rank Fusion (RRF) to merge both result sets

import { createAdminClient } from '@/lib/supabase/admin'
import { embed } from '@/lib/llm/embeddings'
import { keywordSearch } from '@/lib/search/elasticsearch'

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
  threshold = 0.3
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embed(query)
  const admin = createAdminClient()

  // Run semantic + keyword search in parallel
  const [semanticRaw, keywordRaw] = await Promise.all([
    admin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      dept_slug: departmentSlug,
      match_count: topK * 2,
      match_threshold: threshold,
    }).then(r => r.data ?? []),
    keywordSearch(query, departmentSlug, topK * 2),
  ])

  if (semanticRaw.length === 0 && keywordRaw.length === 0) return []

  // Reciprocal Rank Fusion — K=60 is standard
  const K = 60
  const rrfScores = new Map<string, number>()
  const chunkTexts = new Map<string, string>()
  const chunkDocIds = new Map<string, string>()
  const chunkMeta = new Map<string, Record<string, unknown>>()

  semanticRaw.forEach((r: {
    chunk_id: string; document_id: string; chunk_text: string;
    similarity: number; metadata: Record<string, unknown>
  }, rank: number) => {
    rrfScores.set(r.chunk_id, (rrfScores.get(r.chunk_id) ?? 0) + 1 / (K + rank + 1))
    chunkTexts.set(r.chunk_id, r.chunk_text)
    chunkDocIds.set(r.chunk_id, r.document_id)
    chunkMeta.set(r.chunk_id, r.metadata ?? {})
  })

  keywordRaw.forEach((r, rank) => {
    rrfScores.set(r.chunkId, (rrfScores.get(r.chunkId) ?? 0) + 1 / (K + rank + 1))
    if (!chunkTexts.has(r.chunkId)) {
      chunkTexts.set(r.chunkId, r.chunkText)
      chunkDocIds.set(r.chunkId, r.documentId)
      chunkMeta.set(r.chunkId, r.metadata as Record<string, unknown>)
    }
  })

  // Sort by RRF score descending, take topK
  const ranked = Array.from(rrfScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)

  // Fetch document titles for citations
  const docIds = Array.from(new Set(ranked.map(([id]) => chunkDocIds.get(id)).filter((d): d is string => !!d)))
  const { data: docs } = await admin
    .from('documents')
    .select('id, title, department_slug')
    .in('id', docIds)

  const docMap = new Map((docs ?? []).map(d => [d.id, d]))

  return ranked.map(([chunkId, score]) => {
    const docId = chunkDocIds.get(chunkId) ?? ''
    const doc = docMap.get(docId)
    const meta = chunkMeta.get(chunkId) ?? {}
    return {
      chunkId,
      documentId: docId,
      chunkText: chunkTexts.get(chunkId) ?? '',
      similarity: score,
      metadata: {
        filename: (meta.filename as string) || doc?.title || 'Unknown',
        page: meta.page_number as number | undefined,
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
