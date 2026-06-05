-- ============================================================
-- Migration 006: Audit Logs
-- Append-only — never update or delete rows
-- ============================================================

CREATE TABLE public.audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id),
  action      VARCHAR(100) NOT NULL,  -- upload_doc, query, login, delete_doc, invite_user
  resource    VARCHAR(100),           -- document, chat_session, user
  resource_id VARCHAR(255),
  department_slug VARCHAR(50),
  metadata    JSONB DEFAULT '{}'::JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent updates and deletes (append-only)
CREATE RULE audit_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- Indexes
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_dept ON public.audit_logs(department_slug);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON r.id = p.role_id
            WHERE p.id = auth.uid() AND r.name = 'admin')
  );

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- Helper function to log an action
CREATE OR REPLACE FUNCTION public.log_action(
  p_user_id     UUID,
  p_action      TEXT,
  p_resource    TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_dept_slug   TEXT DEFAULT NULL,
  p_metadata    JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, action, resource, resource_id, department_slug, metadata)
  VALUES (p_user_id, p_action, p_resource, p_resource_id, p_dept_slug, p_metadata);
END;
$$;
