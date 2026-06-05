-- ============================================================
-- Migration 002: Departments
-- ============================================================

CREATE TABLE public.departments (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  short_code  VARCHAR(10) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.departments (slug, name, short_code, description) VALUES
  ('hr',         'Human Resources', 'HR',  'HR policies, onboarding, leave, org charts'),
  ('operations', 'Operations',      'OPS', 'SOPs, equipment manuals, maintenance logs, incidents');

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments readable by authenticated users"
  ON public.departments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );
