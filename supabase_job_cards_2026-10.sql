-- =====================================================================
-- Growing Minds · teachers' own student job cards
-- Run once in the SQL Editor. Safe to run more than once.
--
-- custom_job_cards: job cards a teacher writes (or copies from a built-in
-- card and edits) on Learn → Job cards. Private to each teacher, every
-- approved educator can make them, at most 50 each.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.custom_job_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  icon        text NOT NULL DEFAULT '🌱' CHECK (char_length(icon) <= 16),
  title       text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 60),
  adult       boolean NOT NULL DEFAULT false,
  minutes     int CHECK (minutes BETWEEN 1 AND 120),
  steps       text[] NOT NULL CHECK (cardinality(steps) BETWEEN 1 AND 8),
  safety      text CHECK (char_length(safety) <= 140),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_job_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS custom_job_cards_read ON public.custom_job_cards;
CREATE POLICY custom_job_cards_read ON public.custom_job_cards FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS custom_job_cards_insert ON public.custom_job_cards;
CREATE POLICY custom_job_cards_insert ON public.custom_job_cards FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator()
              AND (SELECT count(*) FROM public.custom_job_cards c WHERE c.user_id = auth.uid()) < 50);
DROP POLICY IF EXISTS custom_job_cards_update ON public.custom_job_cards;
CREATE POLICY custom_job_cards_update ON public.custom_job_cards FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS custom_job_cards_delete ON public.custom_job_cards;
CREATE POLICY custom_job_cards_delete ON public.custom_job_cards FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMIT;
