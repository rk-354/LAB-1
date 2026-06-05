// Elasticsearch client — keyword BM25 search
// Complements pgvector semantic search in hybrid retrieval

const ES_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
const ES_INDEX = process.env.ELASTICSEARCH_INDEX || 'refinery_docs'

export interface ESChunk {
  chunkId: string
  documentId: string
  chunkText: string
  score: number
  metadata: {
    filename?: string
    page?: number
    department?: string
    title?: string
  }
}

// Index a chunk into Elasticsearch
export async function indexChunk(
  chunkId: string,
  documentId: string,
  chunkText: string,
  departmentSlug: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await fetch(`${ES_URL}/${ES_INDEX}/_doc/${chunkId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunk_id: chunkId,
      document_id: documentId,
      chunk_text: chunkText,
      department_slug: departmentSlug,
      ...metadata,
      indexed_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(10000),
  })
}

// BM25 keyword search
export async function keywordSearch(
  query: string,
  departmentSlug: string,
  topK = 5
): Promise<ESChunk[]> {
  try {
    const res = await fetch(`${ES_URL}/${ES_INDEX}/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: topK,
        query: {
          bool: {
            must: { match: { chunk_text: { query, fuzziness: 'AUTO' } } },
            filter: { term: { department_slug: departmentSlug } },
          },
        },
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []
    const data = await res.json()

    return (data.hits?.hits ?? []).map((hit: {
      _id: string
      _score: number
      _source: {
        document_id: string
        chunk_text: string
        filename?: string
        page_number?: number
        department_slug?: string
        title?: string
      }
    }) => ({
      chunkId: hit._id,
      documentId: hit._source.document_id,
      chunkText: hit._source.chunk_text,
      score: hit._score,
      metadata: {
        filename: hit._source.filename,
        page: hit._source.page_number,
        department: hit._source.department_slug,
        title: hit._source.title,
      },
    }))
  } catch {
    // ES unavailable — degrade gracefully, pgvector covers retrieval
    return []
  }
}

// Create index with correct mappings (run once on startup)
export async function ensureIndex(): Promise<void> {
  try {
    const check = await fetch(`${ES_URL}/${ES_INDEX}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (check.ok) return // already exists

    await fetch(`${ES_URL}/${ES_INDEX}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mappings: {
          properties: {
            chunk_id:        { type: 'keyword' },
            document_id:     { type: 'keyword' },
            department_slug: { type: 'keyword' },
            chunk_text:      { type: 'text', analyzer: 'english' },
            filename:        { type: 'text' },
            title:           { type: 'text' },
            page_number:     { type: 'integer' },
            indexed_at:      { type: 'date' },
          },
        },
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // ES not available — non-fatal
  }
}
