-- =====================================================================
-- Growing Minds · Learn guide progress
-- Saves how far each educator got in each Learn guide, so progress
-- follows them across devices and admins can see who finished what.
-- Educators read and write only their own rows; admins can read all.
-- Safe to re-run.
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.learn_progress (
  user_id      uuid NOT NULL DEFAULT auth.uid(),
  tutorial_id  text NOT NULL CHECK (tutorial_id ~ '^[a-z0-9-]{1,60}$'),
  step         integer NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 200),
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tutorial_id)
);

ALTER TABLE public.learn_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learn_progress_own_select  ON public.learn_progress;
DROP POLICY IF EXISTS learn_progress_own_insert  ON public.learn_progress;
DROP POLICY IF EXISTS learn_progress_own_update  ON public.learn_progress;

CREATE POLICY learn_progress_own_select ON public.learn_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY learn_progress_own_insert ON public.learn_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY learn_progress_own_update ON public.learn_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;
