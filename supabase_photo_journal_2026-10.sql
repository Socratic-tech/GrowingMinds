-- =====================================================================
-- Growing Minds · Photo journal (BETA) · run once in the SQL Editor
--
--   beta_testers   who has which beta features. Admins turn people on
--                  and off in Admin → Educators; people can only read
--                  their own row.
--   slot_photos    one row per photo: slot, plant + planting date at the
--                  time (so a recycled slot keeps its old timelapse),
--                  date taken, optional caption.
--   slot-photos    PRIVATE storage bucket. Files live under
--                  <user id>/<slot>/..., and only that teacher (and
--                  admins) can see them. Max 1 MB per photo (the app
--                  shrinks photos to ~250 KB before uploading).
--
-- Only approved educators who are beta testers can add photos.
-- Safe to run more than once.
-- =====================================================================

BEGIN;

-- Beta testers ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beta_testers (
  user_id  uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  features text[] NOT NULL DEFAULT ARRAY['photo_journal'],
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid DEFAULT auth.uid()
);
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS beta_testers_read ON public.beta_testers;
CREATE POLICY beta_testers_read ON public.beta_testers
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS beta_testers_admin_write ON public.beta_testers;
CREATE POLICY beta_testers_admin_write ON public.beta_testers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.has_beta(p_feature text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM beta_testers WHERE user_id = auth.uid() AND p_feature = ANY (features))
$$;

-- Photos ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slot_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  slot_id       text NOT NULL CHECK (slot_id ~ '^[AB][1-8]$'),
  plant_name    text,
  date_planted  date,
  taken_on      date NOT NULL DEFAULT current_date,
  storage_path  text NOT NULL UNIQUE,
  caption       text CHECK (char_length(caption) <= 280),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slot_photos_user_slot ON public.slot_photos (user_id, slot_id, taken_on);
ALTER TABLE public.slot_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS slot_photos_read ON public.slot_photos;
CREATE POLICY slot_photos_read ON public.slot_photos
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS slot_photos_insert ON public.slot_photos;
CREATE POLICY slot_photos_insert ON public.slot_photos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator() AND public.has_beta('photo_journal')
              AND storage_path LIKE auth.uid()::text || '/%');
DROP POLICY IF EXISTS slot_photos_update ON public.slot_photos;
CREATE POLICY slot_photos_update ON public.slot_photos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS slot_photos_delete ON public.slot_photos;
CREATE POLICY slot_photos_delete ON public.slot_photos
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Storage bucket (private) ----------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('slot-photos', 'slot-photos', false, 1048576, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 1048576, allowed_mime_types = ARRAY['image/jpeg'];

DROP POLICY IF EXISTS slot_photos_obj_read ON storage.objects;
CREATE POLICY slot_photos_obj_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'slot-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS slot_photos_obj_insert ON storage.objects;
CREATE POLICY slot_photos_obj_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slot-photos' AND (storage.foldername(name))[1] = auth.uid()::text
              AND public.is_approved_educator() AND public.has_beta('photo_journal'));
DROP POLICY IF EXISTS slot_photos_obj_delete ON storage.objects;
CREATE POLICY slot_photos_obj_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'slot-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

COMMIT;

-- Turn the beta on for yourself (replace the email), or use Admin → Educators:
--   INSERT INTO beta_testers (user_id)
--   SELECT id FROM auth.users WHERE email = 'you@example.org'
--   ON CONFLICT (user_id) DO NOTHING;
