-- ============================================================
-- Migration 003: Document Management
-- Documents, versions, chunks (metadata only — vectors in pgvector)
-- ============================================================

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents
CREATE TABLE public.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  department_slug VARCHAR(50) REFERENCES public.departments(slug),
  doc_type        VARCHAR(50) DEFAULT 'general', -- sop, policy, report, manual, form, general
  tags            TEXT[] DEFAULT '{}',
  uploaded_by     UUID REFERENCES public.profiles(id),
  current_version INT DEFAULT 1,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Document versions
CREATE TABLE public.document_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number  INT NOT NULL,
  storage_path    VARCHAR(1000) NOT NULL,  -- Supabase Storage path
  file_name       VARCHAR(500) NOT NULL,
  file_size       BIGINT,
  mime_type       VARCHAR(100),
  checksum        VARCHAR(64),             -- SHA-256
  ocr_processed   BOOLEAN DEFAULT FALSE,
  indexed         BOOLEAN DEFAULT FALSE,
  indexing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, ready, error
  uploaded_by     UUID REFERENCES public.profiles(id),
  change_notes    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- Document chunks — metadata only, vector stored in pgvector table below
CREATE TABLE public.document_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number  INT NOT NULL,
  chunk_index     INT NOT NULL,
  page_number     INT,
  section         VARCHAR(500),
  text_preview    VARCHAR(500),
  token_count     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings (pgvector) — nomic-embed-text produces 768-dim vectors
CREATE TABLE public.document_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id    UUID UNIQUE REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  department_slug VARCHAR(50),
  embedding   vector(768),
  chunk_text  TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast ANN search
CREATE INDEX ON public.document_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indexes
CREATE INDEX idx_documents_dept ON public.documents(department_slug);
CREATE INDEX idx_documents_type ON public.documents(doc_type);
CREATE INDEX idx_documents_active ON public.documents(is_active);
CREATE INDEX idx_doc_versions_doc ON public.document_versions(document_id);
CREATE INDEX idx_doc_versions_status ON public.document_versions(indexing_status);
CREATE INDEX idx_chunks_doc ON public.document_chunks(document_id);
CREATE INDEX idx_embeddings_doc ON public.document_embeddings(document_id);
CREATE INDEX idx_embeddings_dept ON public.document_embeddings(department_slug);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Documents: users see their department + admins see all
CREATE POLICY "Users see own department documents"
  ON public.documents FOR SELECT
  USING (
    department_slug = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Managers and admins can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers manage own dept, admins manage all"
  ON public.documents FOR UPDATE USING (
    (department_slug = (SELECT department FROM public.profiles WHERE id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id WHERE p.id = auth.uid() AND r.name = 'manager'))
    OR EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id WHERE p.id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY "Document versions follow document policy"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id)
  );

CREATE POLICY "Embeddings readable by authenticated users in their dept"
  ON public.document_embeddings FOR SELECT
  USING (
    department_slug = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id WHERE p.id = auth.uid() AND r.name = 'admin')
  );

-- Semantic search function
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(768),
  dept_slug       TEXT,
  match_count     INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  chunk_id    UUID,
  document_id UUID,
  chunk_text  TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.chunk_id,
    e.document_id,
    e.chunk_text,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings e
  WHERE e.department_slug = dept_slug
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
