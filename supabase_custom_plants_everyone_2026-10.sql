-- =====================================================================
-- Growing Minds · custom plants + seed box for every approved teacher
-- Run once in the SQL Editor, AFTER supabase_towers_custom_plants_2026-10.sql
-- and supabase_seed_box_2026-10.sql. Safe to run more than once.
--
-- Until now only teachers with the 'custom_plants' switch could add their
-- own plants or fill a seed box. This drops that switch from the two
-- insert rules; everything else is unchanged:
--   * still approved educators only, still private to each teacher
--   * still at most 100 custom plants and 150 seed box rows each
--   * "Suggest for everyone" still goes to admins for approval
-- Old 'custom_plants' entries in beta_testers are harmless and left alone.
-- =====================================================================

BEGIN;

DROP POLICY IF EXISTS custom_plants_insert ON public.custom_plants;
CREATE POLICY custom_plants_insert ON public.custom_plants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator()
              AND suggestion IN ('private', 'suggested')
              AND (SELECT count(*) FROM public.custom_plants c WHERE c.user_id = auth.uid()) < 100);

DROP POLICY IF EXISTS seed_box_insert ON public.seed_box;
CREATE POLICY seed_box_insert ON public.seed_box FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator()
              AND (SELECT count(*) FROM public.seed_box s WHERE s.user_id = auth.uid()) < 150);

COMMIT;
