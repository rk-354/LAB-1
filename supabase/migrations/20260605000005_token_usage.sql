-- ============================================================
-- Migration 005: Token Usage & LLM Tracking
-- ============================================================

CREATE TABLE public.token_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id),
  session_id      UUID REFERENCES public.chat_sessions(id),
  message_id      UUID REFERENCES public.chat_messages(id),
  model           VARCHAR(100) NOT NULL,
  provider        VARCHAR(50) NOT NULL,   -- ollama, anthropic, gemini
  input_tokens    INT NOT NULL DEFAULT 0,
  output_tokens   INT NOT NULL DEFAULT 0,
  cached          BOOLEAN DEFAULT FALSE,
  cost_usd        NUMERIC(10,6) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage view (used for budget enforcement)
CREATE VIEW public.daily_token_usage AS
  SELECT
    user_id,
    DATE(created_at) AS usage_date,
    SUM(input_tokens + output_tokens) AS total_tokens,
    SUM(cost_usd) AS total_cost,
    COUNT(*) AS query_count
  FROM public.token_usage
  GROUP BY user_id, DATE(created_at);

-- Indexes
CREATE INDEX idx_token_usage_user_date ON public.token_usage(user_id, created_at DESC);
CREATE INDEX idx_token_usage_provider ON public.token_usage(provider);

-- RLS
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own token usage"
  ON public.token_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all token usage"
  ON public.token_usage FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
            WHERE p.id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY "Service role can insert token usage"
  ON public.token_usage FOR INSERT
  WITH CHECK (TRUE);
