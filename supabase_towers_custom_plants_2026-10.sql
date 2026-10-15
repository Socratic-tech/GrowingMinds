-- =====================================================================
-- Growing Minds · Multiple towers + custom plants (on request)
-- Run once in the SQL Editor, AFTER supabase_photo_journal_2026-10.sql
-- and supabase_beta_wave2_2026-10.sql. Safe to run more than once.
--
-- Both features are OFF for everyone. An admin turns them on for one
-- educator in Admin → Educators (they're stored with the beta switches
-- in beta_testers.features as 'multi_tower' and 'custom_plants').
--
-- MULTIPLE TOWERS (all Gardyn Studios)
--   * towers: a teacher's named towers. Existing data is NOT moved:
--     rows with tower_id NULL are the teacher's first ("primary") tower,
--     so everyone else keeps working exactly as before.
--   * tower_id added to tracker_slots, maintenance_tasks, harvest_log,
--     slot_photos, slot_measurements and class_stations.
--   * One-per-teacher rules become one-per-tower (slots, maintenance
--     tasks, station codes).
--
-- CUSTOM PLANTS
--   * custom_plants: a teacher's own plants (private to them). They can
--     "suggest" one; admins see suggestions in Admin → Plants and can add
--     them to the shared catalog. The weekly Gardyn sync never touches
--     this table.
-- =====================================================================

BEGIN;

-- Feature check for any switch (has_beta already exists; this alias reads better)
CREATE OR REPLACE FUNCTION public.has_feature(p_feature text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM beta_testers WHERE user_id = auth.uid() AND p_feature = ANY (features))
$$;

-- ── Towers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.towers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 40),
  is_primary  boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS towers_one_primary ON public.towers (user_id) WHERE is_primary;
CREATE UNIQUE INDEX IF NOT EXISTS towers_name_unique ON public.towers (user_id, lower(trim(name)));
ALTER TABLE public.towers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS towers_read ON public.towers;
CREATE POLICY towers_read ON public.towers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS towers_write ON public.towers;
CREATE POLICY towers_write ON public.towers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator() AND public.has_feature('multi_tower')
              AND (SELECT count(*) FROM public.towers t WHERE t.user_id = auth.uid()) < 10);
DROP POLICY IF EXISTS towers_update ON public.towers;
CREATE POLICY towers_update ON public.towers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS towers_delete ON public.towers;
CREATE POLICY towers_delete ON public.towers FOR DELETE TO authenticated USING (user_id = auth.uid() AND NOT is_primary);

-- tower_id on the classroom tables (NULL = the primary tower)
ALTER TABLE public.tracker_slots      ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE CASCADE;
ALTER TABLE public.maintenance_tasks  ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE CASCADE;
ALTER TABLE public.harvest_log        ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE SET NULL;
ALTER TABLE public.slot_photos        ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE CASCADE;
ALTER TABLE public.slot_measurements  ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE CASCADE;
ALTER TABLE public.class_stations     ADD COLUMN IF NOT EXISTS tower_id uuid REFERENCES public.towers (id) ON DELETE CASCADE;

-- One slot / task / station per TOWER instead of per teacher.
-- Drop whatever unique rule enforces one row per (teacher, slot) or
-- (teacher, task), whatever it was named, and replace it per tower.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conrelid::regclass AS tbl, con.conname
      FROM pg_constraint con
     WHERE con.contype = 'u'
       AND ((con.conrelid = 'public.tracker_slots'::regclass
             AND (SELECT array_agg(attname::text ORDER BY attname) FROM pg_attribute
                   WHERE attrelid = con.conrelid AND attnum = ANY (con.conkey)) = ARRAY['slot_id', 'user_id'])
         OR (con.conrelid = 'public.maintenance_tasks'::regclass
             AND (SELECT array_agg(attname::text ORDER BY attname) FROM pg_attribute
                   WHERE attrelid = con.conrelid AND attnum = ANY (con.conkey)) = ARRAY['task_name', 'user_id']))
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;
ALTER TABLE public.tracker_slots DROP CONSTRAINT IF EXISTS tracker_slots_user_slot_unique;
CREATE UNIQUE INDEX IF NOT EXISTS tracker_slots_user_tower_slot
  ON public.tracker_slots (user_id, coalesce(tower_id, '00000000-0000-0000-0000-000000000000'::uuid), slot_id);
ALTER TABLE public.maintenance_tasks DROP CONSTRAINT IF EXISTS maintenance_tasks_user_task_unique;
CREATE UNIQUE INDEX IF NOT EXISTS maintenance_tasks_user_tower_task
  ON public.maintenance_tasks (user_id, coalesce(tower_id, '00000000-0000-0000-0000-000000000000'::uuid), task_name);

ALTER TABLE public.class_stations ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.class_stations DROP CONSTRAINT IF EXISTS class_stations_pkey;
ALTER TABLE public.class_stations ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS class_stations_user_tower
  ON public.class_stations (user_id, coalesce(tower_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- A tower_id written by a teacher must be one of THEIR towers.
CREATE OR REPLACE FUNCTION public.gm_check_tower_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tower_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM towers WHERE id = NEW.tower_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'That tower belongs to someone else.';
  END IF;
  RETURN NEW;
END $$;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_slots','maintenance_tasks','harvest_log','slot_photos','slot_measurements','class_stations'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_tower_owner', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF tower_id ON public.%I FOR EACH ROW EXECUTE FUNCTION public.gm_check_tower_owner()', t || '_tower_owner', t);
  END LOOP;
END $$;

-- Stations read and write the slots of THEIR tower
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
DECLARE st class_stations%ROWTYPE;
BEGIN
  IF gm_station_owner(p_code) IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT * INTO st FROM class_stations WHERE code = upper(trim(p_code));
  RETURN jsonb_build_object(
    'ok', true,
    'label', coalesce(st.label, (SELECT name FROM towers WHERE id = st.tower_id)),
    'slots', coalesce((
      SELECT jsonb_agg(jsonb_build_object('slot_id', slot_id, 'plant_name', plant_name, 'status', status) ORDER BY slot_id)
        FROM tracker_slots
       WHERE user_id = st.user_id AND tower_id IS NOT DISTINCT FROM st.tower_id
         AND plant_name IS NOT NULL AND coalesce(status, 'Empty') <> 'Empty'
    ), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.station_submit(
  p_code text, p_slot_id text, p_height_cm numeric DEFAULT NULL, p_leaf_count int DEFAULT NULL,
  p_note text DEFAULT NULL, p_team text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  st      class_stations%ROWTYPE;
  v_slot  tracker_slots%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'America/Detroit')::date;
BEGIN
  IF gm_station_owner(p_code) IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'code'); END IF;
  SELECT * INTO st FROM class_stations WHERE code = upper(trim(p_code));
  SELECT * INTO v_slot FROM tracker_slots
   WHERE user_id = st.user_id AND tower_id IS NOT DISTINCT FROM st.tower_id AND slot_id = p_slot_id;
  IF NOT FOUND OR v_slot.plant_name IS NULL OR coalesce(v_slot.status, 'Empty') = 'Empty' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slot');
  END IF;
  IF p_height_cm IS NULL AND p_leaf_count IS NULL AND nullif(trim(p_note), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty');
  END IF;
  IF (SELECT count(*) FROM slot_measurements
       WHERE user_id = st.user_id AND source = 'station' AND measured_on = v_today) >= 300 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'limit');
  END IF;
  INSERT INTO slot_measurements (user_id, tower_id, slot_id, plant_name, date_planted, measured_on,
                                 height_cm, leaf_count, note, team, source)
  VALUES (st.user_id, st.tower_id, v_slot.slot_id, v_slot.plant_name, v_slot.date_planted, v_today,
          p_height_cm, p_leaf_count, left(nullif(trim(p_note), ''), 280), left(nullif(trim(p_team), ''), 60), 'station');
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('ok', false, 'error', 'range');
END $$;
GRANT EXECUTE ON FUNCTION public.station_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.station_submit(text, text, numeric, int, text, text) TO anon, authenticated;

-- ── Custom plants ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_plants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 60),
  category          text CHECK (category IN ('Greens', 'Herbs', 'Fruits & Veggies', 'Flowers')),
  light_zone        text CHECK (light_zone IN ('Yellow (Low)', 'Orange (Med)', 'Red (High)')),
  germination_days  int CHECK (germination_days BETWEEN 0 AND 120),
  harvest_days      int CHECK (harvest_days BETWEEN 0 AND 400),
  notes             text CHECK (char_length(notes) <= 500),
  suggestion        text NOT NULL DEFAULT 'private' CHECK (suggestion IN ('private', 'suggested', 'added', 'declined')),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS custom_plants_user_name ON public.custom_plants (user_id, lower(trim(name)));
ALTER TABLE public.custom_plants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS custom_plants_read ON public.custom_plants;
CREATE POLICY custom_plants_read ON public.custom_plants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS custom_plants_insert ON public.custom_plants;
CREATE POLICY custom_plants_insert ON public.custom_plants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator() AND public.has_feature('custom_plants')
              AND suggestion IN ('private', 'suggested')
              AND (SELECT count(*) FROM public.custom_plants c WHERE c.user_id = auth.uid()) < 100);
DROP POLICY IF EXISTS custom_plants_update_own ON public.custom_plants;
CREATE POLICY custom_plants_update_own ON public.custom_plants FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (public.is_admin() OR (user_id = auth.uid() AND suggestion IN ('private', 'suggested')));
DROP POLICY IF EXISTS custom_plants_delete ON public.custom_plants;
CREATE POLICY custom_plants_delete ON public.custom_plants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Updated impact summary (towers counted per tower)
CREATE OR REPLACE FUNCTION public.impact_summary() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE r jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'admins only'; END IF;

  WITH edu AS (
    SELECT id, coalesce(nullif(trim(remc), ''), 'Not set') AS remc
      FROM profiles WHERE is_approved AND role <> 'admin'
  ), towers_live AS (
    SELECT DISTINCT user_id, tower_id FROM tracker_slots WHERE plant_name IS NOT NULL AND coalesce(status, 'Empty') <> 'Empty'
  ), h AS (
    SELECT user_id, harvest_date, plant_name, coalesce(amount_grams, 0) AS g FROM harvest_log
  )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'educators',        (SELECT count(*) FROM edu),
      'active_towers',    (SELECT count(*) FROM towers_live),
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
        'active_towers', (SELECT count(*) FROM towers_live t JOIN edu e2 ON e2.id = t.user_id WHERE e2.remc = e.remc),
        'harvests', (SELECT count(*) FROM h JOIN edu e2 ON e2.id = h.user_id WHERE e2.remc = e.remc),
        'grams', (SELECT coalesce(sum(g), 0) FROM h JOIN edu e2 ON e2.id = h.user_id WHERE e2.remc = e.remc)
      ) AS x
      FROM edu e GROUP BY e.remc) s), '[]'::jsonb),
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
