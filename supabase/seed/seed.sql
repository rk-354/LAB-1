-- ============================================================
-- Seed Data — Development / Demo
-- Run after migrations
-- ============================================================

-- Departments are already seeded in migration 002.
-- Roles are already seeded in migration 001.

-- Sample documents (no actual files — for UI testing)
INSERT INTO public.documents (title, department_slug, doc_type, tags, current_version)
VALUES
  ('HSE Confined Space Procedure',   'operations', 'sop',    ARRAY['safety','confined-space'], 1),
  ('Site Safety Manual',             'operations', 'manual', ARRAY['safety','ppe'],            1),
  ('PTO & Leave Policy 2026',        'hr',         'policy', ARRAY['leave','benefits'],        1),
  ('Contractor Onboarding Pack',     'hr',         'manual', ARRAY['onboarding','contractors'],1),
  ('Crude Unit Shutdown SOP',        'operations', 'sop',    ARRAY['operations','crude-unit'], 1),
  ('Employee Handbook v5',           'hr',         'manual', ARRAY['hr','general'],            1);
