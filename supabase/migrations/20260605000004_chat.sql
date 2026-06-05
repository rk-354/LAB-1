-- ============================================================
-- Migration 004: Chat Sessions & Messages
-- ============================================================

CREATE TABLE public.chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         VARCHAR(500),
  department_slug VARCHAR(50) REFERENCES public.departments(slug),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  citations       JSONB DEFAULT '[]'::JSONB,  -- [{doc_id, version, page, chunk_id, filename}]
  model_used      VARCHAR(100),
  provider        VARCHAR(50),               -- ollama, anthropic, gemini
  input_tokens    INT DEFAULT 0,
  output_tokens   INT DEFAULT 0,
  latency_ms      INT,
  confidence      FLOAT,
  has_pii         BOOLEAN DEFAULT FALSE,
  pii_masked      BOOLEAN DEFAULT FALSE,
  cached          BOOLEAN DEFAULT FALSE,
  feedback        VARCHAR(10) CHECK (feedback IN ('up', 'down', NULL)),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX idx_sessions_dept ON public.chat_sessions(department_slug);
CREATE INDEX idx_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_messages_created ON public.chat_messages(created_at DESC);

-- RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sessions"
  ON public.chat_sessions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all sessions"
  ON public.chat_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
            WHERE p.id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY "Users see messages in own sessions"
  ON public.chat_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid())
  );
