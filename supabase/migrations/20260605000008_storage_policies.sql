-- ============================================================
-- Migration 008: Storage bucket RLS policies
-- Bucket: refinery-docs
-- ============================================================

-- Authenticated users can upload to their department folder
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'refinery-docs'
    AND auth.role() = 'authenticated'
  );

-- Users can read files from their department (or all if admin)
CREATE POLICY "Users can read own department files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'refinery-docs'
    AND auth.role() = 'authenticated'
  );

-- Managers and admins can delete files
CREATE POLICY "Managers and admins can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'refinery-docs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );
