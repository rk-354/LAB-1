-- ============================================================
-- Migration 007: PII Detection Log
-- Tracks PII found and masked in user inputs
-- ============================================================

CREATE TABLE public.pii_detections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id),
  pii_types   TEXT[] NOT NULL,   -- ['PERSON', 'EMAIL', 'PHONE', 'ID_NUMBER']
  token_count INT,
  masked      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pii_user ON public.pii_detections(user_id);
CREATE INDEX idx_pii_created ON public.pii_detections(created_at DESC);

ALTER TABLE public.pii_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read PII detection logs"
  ON public.pii_detections FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
            WHERE p.id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY "Service role can insert PII logs"
  ON public.pii_detections FOR INSERT
  WITH CHECK (TRUE);
