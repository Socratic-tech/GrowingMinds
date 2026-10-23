-- =====================================================================
-- Growing Minds · Seed box + "Plan my tower"
-- Run once in the SQL Editor, AFTER supabase_towers_custom_plants_2026-10.sql.
-- Safe to run more than once.
--
-- seed_box: the yCubes a teacher has on hand (plant name + how many).
-- One box per teacher, shared by all their towers. Plant names are the
-- same text the Tracker stores (catalog or the teacher's custom plants).
-- Every approved educator can add (since Oct 2026; this file used to
-- require the 'custom_plants' switch, so re-running an old copy blocked
-- teachers without it).
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.seed_box (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  plant_name  text NOT NULL CHECK (char_length(trim(plant_name)) BETWEEN 1 AND 60),
  qty         int NOT NULL DEFAULT 1 CHECK (qty BETWEEN 1 AND 99),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plant_name)
);

ALTER TABLE public.seed_box ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS seed_box_read ON public.seed_box;
CREATE POLICY seed_box_read ON public.seed_box FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS seed_box_insert ON public.seed_box;
CREATE POLICY seed_box_insert ON public.seed_box FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator()
              AND (SELECT count(*) FROM public.seed_box s WHERE s.user_id = auth.uid()) < 150);
DROP POLICY IF EXISTS seed_box_update ON public.seed_box;
CREATE POLICY seed_box_update ON public.seed_box FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS seed_box_delete ON public.seed_box;
CREATE POLICY seed_box_delete ON public.seed_box FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMIT;
