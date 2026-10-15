-- =====================================================================
-- Growing Minds · Beta wave 2 · run once in the SQL Editor
-- (after supabase_photo_journal_2026-10.sql)
--
--  1. Photo storage guardrails
--     - slot_photos.thumb_path: a ~15 KB thumbnail saved with each photo,
--       so grids load thumbnails instead of full photos (less bandwidth).
--     - Quota: 400 photos per teacher (about 60 MB). Raise or lower it
--       in gm_photo_quota() below.
--
--  2. Student data stations (beta)
--     - class_stations: one 6-character class code per teacher.
--     - slot_measurements: height (cm), leaf count, notes per slot, from
--       the teacher or from the class station.
--     - station_info(code) / station_submit(...): the only way a station
--       (no student login) can read the tower's plant list or add a
--       measurement. Max 300 station entries per tower per day.
--
--  3. Impact dashboard
--     - impact_summary(): admin-only totals (harvests, grams, towers,
--       guides, photos, measurements) by REMC and by month, plus how much
--       photo storage and database space is in use.
--
-- Safe to run more than once.
-- =====================================================================

BEGIN;

-- Everyone already in the beta also gets the student station.
UPDATE public.beta_testers
   SET features = ARRAY(SELECT DISTINCT unnest(features || ARRAY['student_station']))
 WHERE NOT ('student_station' = ANY (features));
ALTER TABLE public.beta_testers ALTER COLUMN features SET DEFAULT ARRAY['photo_journal', 'student_station'];

-- 1. Photo guardrails ---------------------------------------------------
ALTER TABLE public.slot_photos ADD COLUMN IF NOT EXISTS thumb_path text;

CREATE OR REPLACE FUNCTION public.gm_photo_quota() RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT 400 $$;

CREATE OR REPLACE FUNCTION public.gm_slot_photos_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM slot_photos WHERE user_id = NEW.user_id) >= gm_photo_quota() THEN
    RAISE EXCEPTION 'Photo limit reached (% photos). Delete old photos to add new ones.', gm_photo_quota()
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS slot_photos_quota ON public.slot_photos;
CREATE TRIGGER slot_photos_quota BEFORE INSERT ON public.slot_photos
  FOR EACH ROW EXECUTE FUNCTION public.gm_slot_photos_quota();

-- 2. Student data stations ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_stations (
  user_id    uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  code       text NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  label      text CHECK (char_length(label) <= 60),
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.class_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS class_stations_own_read ON public.class_stations;
CREATE POLICY class_stations_own_read ON public.class_stations
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS class_stations_own_write ON public.class_stations;
CREATE POLICY class_stations_own_write ON public.class_stations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator() AND public.has_beta('student_station'));

CREATE TABLE IF NOT EXISTS public.slot_measurements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  slot_id      text NOT NULL CHECK (slot_id ~ '^[AB][1-8]$'),
  plant_name   text,
  date_planted date,
  measured_on  date NOT NULL DEFAULT current_date,
  height_cm    numeric(5,1) CHECK (height_cm BETWEEN 0 AND 300),
  leaf_count   int CHECK (leaf_count BETWEEN 0 AND 999),
  note         text CHECK (char_length(note) <= 280),
  team         text CHECK (char_length(team) <= 60),
  source       text NOT NULL DEFAULT 'teacher' CHECK (source IN ('teacher', 'station')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (height_cm IS NOT NULL OR leaf_count IS NOT NULL OR note IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS slot_measurements_user_slot ON public.slot_measurements (user_id, slot_id, measured_on);
ALTER TABLE public.slot_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slot_measurements_read ON public.slot_measurements;
CREATE POLICY slot_measurements_read ON public.slot_measurements
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS slot_measurements_insert ON public.slot_measurements;
CREATE POLICY slot_measurements_insert ON public.slot_measurements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_approved_educator() AND source = 'teacher');
DROP POLICY IF EXISTS slot_measurements_update ON public.slot_measurements;
CREATE POLICY slot_measurements_update ON public.slot_measurements
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS slot_measurements_delete ON public.slot_measurements;
CREATE POLICY slot_measurements_delete ON public.slot_measurements
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- The station's teacher, if the code is live and that teacher may use it.
CREATE OR REPLACE FUNCTION public.gm_station_owner(p_code text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id
    FROM class_stations s
    JOIN profiles p ON p.id = s.user_id AND p.is_approved
    JOIN beta_testers b ON b.user_id = s.user_id AND 'student_station' = ANY (b.features)
   WHERE s.code = upper(trim(p_code)) AND s.active
$$;
REVOKE ALL ON FUNCTION public.gm_station_owner(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.station_info(p_code text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid := gm_station_owner(p_code);
BEGIN
  IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'label', (SELECT label FROM class_stations WHERE user_id = v_owner),
    'slots', coalesce((
      SELECT jsonb_agg(jsonb_build_object('slot_id', slot_id, 'plant_name', plant_name, 'status', status) ORDER BY slot_id)
        FROM tracker_slots
       WHERE user_id = v_owner AND plant_name IS NOT NULL AND coalesce(status, 'Empty') <> 'Empty'
    ), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.station_submit(
  p_code text, p_slot_id text, p_height_cm numeric DEFAULT NULL, p_leaf_count int DEFAULT NULL,
  p_note text DEFAULT NULL, p_team text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid := gm_station_owner(p_code);
  v_slot  tracker_slots%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'America/Detroit')::date;
BEGIN
  IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'code'); END IF;
  SELECT * INTO v_slot FROM tracker_slots WHERE user_id = v_owner AND slot_id = p_slot_id;
  IF NOT FOUND OR v_slot.plant_name IS NULL OR coalesce(v_slot.status, 'Empty') = 'Empty' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slot');
  END IF;
  IF p_height_cm IS NULL AND p_leaf_count IS NULL AND nullif(trim(p_note), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty');
  END IF;
  IF (SELECT count(*) FROM slot_measurements
       WHERE user_id = v_owner AND source = 'station' AND measured_on = v_today) >= 300 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'limit');
  END IF;
  INSERT INTO slot_measurements (user_id, slot_id, plant_name, date_planted, measured_on,
                                 height_cm, leaf_count, note, team, source)
  VALUES (v_owner, v_slot.slot_id, v_slot.plant_name, v_slot.date_planted, v_today,
          p_height_cm, p_leaf_count, left(nullif(trim(p_note), ''), 280), left(nullif(trim(p_team), ''), 60), 'station');
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('ok', false, 'error', 'range');
END $$;

GRANT EXECUTE ON FUNCTION public.station_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.station_submit(text, text, numeric, int, text, text) TO anon, authenticated;

-- 3. Impact dashboard (admins only) -------------------------------------
CREATE OR REPLACE FUNCTION public.impact_summary() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE r jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'admins only'; END IF;

  WITH edu AS (
    SELECT id, coalesce(nullif(trim(remc), ''), 'Not set') AS remc
      FROM profiles WHERE is_approved AND role <> 'admin'
  ), towers AS (
    SELECT DISTINCT user_id FROM tracker_slots WHERE plant_name IS NOT NULL AND coalesce(status, 'Empty') <> 'Empty'
  ), h AS (
    SELECT user_id, harvest_date, plant_name, coalesce(amount_grams, 0) AS g FROM harvest_log
  )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'educators',        (SELECT count(*) FROM edu),
      'active_towers',    (SELECT count(*) FROM towers),
      'growing_now',      (SELECT count(*) FROM tracker_slots WHERE plant_name IS NOT NULL AND coalesce(status, 'Empty') <> 'Empty'),
      'harvests',         (SELECT count(*) FROM h),
      'grams',            (SELECT coalesce(sum(g), 0) FROM h),
      'guides_completed', (SELECT count(*) FROM learn_progress WHERE completed_at IS NOT NULL),
      'photos',           (SELECT count(*) FROM slot_photos),
      'measurements',     (SELECT count(*) FROM slot_measurements)
    ),
    'by_remc', coalesce((SELECT jsonb_agg(x ORDER BY x->>'remc') FROM (
      SELECT jsonb_build_object(
        'remc', e.remc,
        'educators', count(DISTINCT e.id),
        'active_towers', count(DISTINCT t.user_id),
        'harvests', (SELECT count(*) FROM h JOIN edu e2 ON e2.id = h.user_id WHERE e2.remc = e.remc),
        'grams', (SELECT coalesce(sum(g), 0) FROM h JOIN edu e2 ON e2.id = h.user_id WHERE e2.remc = e.remc)
      ) AS x
      FROM edu e LEFT JOIN towers t ON t.user_id = e.id
      GROUP BY e.remc) s), '[]'::jsonb),
    'by_month', coalesce((SELECT jsonb_agg(jsonb_build_object('month', m, 'grams', g, 'harvests', n) ORDER BY m) FROM (
      SELECT to_char(date_trunc('month', harvest_date), 'YYYY-MM') AS m, sum(g) AS g, count(*) AS n
        FROM h WHERE harvest_date >= date_trunc('month', now()) - interval '11 months'
       GROUP BY 1) s), '[]'::jsonb),
    'top_plants', coalesce((SELECT jsonb_agg(jsonb_build_object('plant', plant_name, 'grams', g, 'harvests', n) ORDER BY g DESC) FROM (
      SELECT plant_name, sum(g) AS g, count(*) AS n FROM h WHERE plant_name IS NOT NULL
       GROUP BY plant_name ORDER BY sum(g) DESC LIMIT 10) s), '[]'::jsonb),
    'storage', jsonb_build_object(
      'photo_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects WHERE bucket_id = 'slot-photos'),
      'all_file_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects),
      'database_bytes', pg_database_size(current_database())
    ),
    'generated_at', now()
  ) INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.impact_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.impact_summary() TO authenticated;

COMMIT;
