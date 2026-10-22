-- =====================================================================
-- Growing Minds · Admin tools (Problems log + Plants editing)
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Problems log: the app records failed saves/loads here so admins
--    see them in Admin → Problems without waiting for a screenshot.
--    Educators can only ADD rows (as themselves); only admins can read,
--    resolve or delete them.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_errors (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  user_id     uuid DEFAULT auth.uid(),
  page        text,
  action      text,
  message     text,
  details     jsonb,
  user_agent  text,
  resolved    boolean NOT NULL DEFAULT false,
  CONSTRAINT client_errors_lengths CHECK (
    length(coalesce(page, '')) <= 300 AND length(coalesce(action, '')) <= 300
    AND length(coalesce(message, '')) <= 2000 AND length(coalesce(user_agent, '')) <= 400
  )
);

CREATE INDEX IF NOT EXISTS client_errors_open_idx ON public.client_errors (resolved, created_at DESC);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_errors_insert_own   ON public.client_errors;
DROP POLICY IF EXISTS client_errors_select_admin ON public.client_errors;
DROP POLICY IF EXISTS client_errors_update_admin ON public.client_errors;
DROP POLICY IF EXISTS client_errors_delete_admin ON public.client_errors;

CREATE POLICY client_errors_insert_own ON public.client_errors
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY client_errors_select_admin ON public.client_errors
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY client_errors_update_admin ON public.client_errors
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY client_errors_delete_admin ON public.client_errors
  FOR DELETE TO authenticated USING (public.is_admin());

-- Keep the log from growing forever: drop resolved rows older than 90 days
-- whenever a new problem is logged.
CREATE OR REPLACE FUNCTION public.client_errors_prune()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM client_errors WHERE resolved AND created_at < now() - interval '90 days';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS client_errors_prune ON public.client_errors;
CREATE TRIGGER client_errors_prune AFTER INSERT ON public.client_errors
  FOR EACH STATEMENT EXECUTE FUNCTION public.client_errors_prune();

-- ---------------------------------------------------------------------
-- 2. Renaming a plant in Admin → Plants also renames it in every
--    teacher's tracker slots and harvest log, so nothing loses its
--    dates or light match. (Runs as the table owner: teachers' rows are
--    otherwise only editable by the teacher.)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plants_cascade_rename()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE tracker_slots SET plant_name = NEW.name WHERE plant_name = OLD.name;
    UPDATE harvest_log   SET plant_name = NEW.name WHERE plant_name = OLD.name;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS plants_cascade_rename ON public.plants;
CREATE TRIGGER plants_cascade_rename AFTER UPDATE OF name ON public.plants
  FOR EACH ROW EXECUTE FUNCTION public.plants_cascade_rename();

-- ---------------------------------------------------------------------
-- 3. Make sure admins can add, edit and delete plants (these may
--    already exist from the earlier setup; re-created here so the
--    Plants tab works either way). Everyone signed in can read plants.
-- ---------------------------------------------------------------------
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plants_admin_insert_gm ON public.plants;
DROP POLICY IF EXISTS plants_admin_update_gm ON public.plants;
DROP POLICY IF EXISTS plants_admin_delete_gm ON public.plants;
DROP POLICY IF EXISTS plants_read_gm         ON public.plants;
CREATE POLICY plants_read_gm ON public.plants FOR SELECT TO authenticated USING (true);
CREATE POLICY plants_admin_insert_gm ON public.plants FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY plants_admin_update_gm ON public.plants FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY plants_admin_delete_gm ON public.plants FOR DELETE TO authenticated USING (public.is_admin());

COMMIT;

-- Check: should list client_errors with 4 policies and plants with its policies.
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('client_errors', 'plants') ORDER BY tablename, cmd;
