-- =====================================================================
-- STATEWIDE ROLLOUT MIGRATION - Sept 2026
-- Run in the Supabase SQL Editor BEFORE deploying the rollout-statewide
-- branch. Run STEP 0 first on its own and read the output.
-- Steps 1-5 run inside one transaction: if anything fails, nothing changes.
-- Safe to re-run.
-- =====================================================================


-- =====================================================================
-- STEP 0 (READ-ONLY PREVIEW) - run this alone first.
-- Shows duplicate rows that STEP 4 will remove before adding unique
-- constraints. Expect zero rows. If you see rows, those are real
-- duplicates created by the old first-visit seeding bug.
-- =====================================================================
-- SELECT 'tracker_slots' AS tbl, user_id, slot_id AS key, count(*)
--   FROM tracker_slots GROUP BY user_id, slot_id HAVING count(*) > 1
-- UNION ALL
-- SELECT 'maintenance_tasks', user_id, task_name, count(*)
--   FROM maintenance_tasks GROUP BY user_id, task_name HAVING count(*) > 1;


BEGIN;

-- =====================================================================
-- STEP 1: Educator details on profiles
-- ---------------------------------------------------------------------
-- Statewide, an email address alone isn't enough for an admin to verify
-- who's signing up, or for teachers to know who they're talking to.
-- The app collects these at signup (stored in auth user_metadata) and
-- copies them onto the profile on first login; existing users are asked
-- to fill them in once. profiles_update_own (Aug 20 fix) still locks
-- role + is_approved, so users can edit these but nothing else sensitive.
-- =====================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS remc      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

-- Keep free-text fields sane.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_text_lengths;
ALTER TABLE profiles ADD CONSTRAINT profiles_text_lengths CHECK (
  coalesce(length(full_name), 0) <= 120 AND
  coalesce(length(school), 0)    <= 160 AND
  coalesce(length(district), 0)  <= 160 AND
  coalesce(length(remc), 0)      <= 80
);


-- =====================================================================
-- STEP 2: Helper functions used by the policies below
-- ---------------------------------------------------------------------
-- SECURITY DEFINER so they can read profiles without recursing through
-- profiles' own RLS policies. STABLE so Postgres evaluates them once per
-- query, not once per row.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_approved_educator()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_approved = true OR role = 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
REVOKE ALL ON FUNCTION public.is_approved_educator() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_educator() TO authenticated;


-- =====================================================================
-- STEP 3: Replace RLS policies with a known, version-controlled set
-- ---------------------------------------------------------------------
-- Until now, most of these policies existed only inside Supabase, so no
-- one could review them. This drops whatever is on each table and
-- recreates an explicit set. Rules:
--   * Classroom data (tracker, maintenance, harvest): owner only.
--   * Investigations: everyone approved sees templates; you see and edit
--     only your own (they can contain student predictions/conclusions).
--   * Community (posts, comments, questions, answers): approved educators
--     read everything; you create as yourself; you delete your own;
--     admins can delete anything (moderation).
--   * Resources: approved educators read; admins write.
-- Not touched: profiles, notifications, plants, app_settings,
-- maintenance_templates, storage buckets.
-- =====================================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'tracker_slots','maintenance_tasks','harvest_log','investigations',
      'posts','comments','questions','answers','resources'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Owner-only classroom tables ----------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_slots','maintenance_tasks','harvest_log'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
                     USING (user_id = auth.uid())$p$, t || '_select_own', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
                     WITH CHECK (user_id = auth.uid() AND public.is_approved_educator())$p$, t || '_insert_own', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
                     USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$, t || '_update_own', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
                     USING (user_id = auth.uid())$p$, t || '_delete_own', t);
  END LOOP;
END $$;

-- Investigations ------------------------------------------------------
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY investigations_select ON investigations FOR SELECT TO authenticated
  USING ((is_template = true AND public.is_approved_educator())
         OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY investigations_insert ON investigations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved_educator()
              AND (coalesce(is_template, false) = false OR public.is_admin()));
CREATE POLICY investigations_update ON investigations FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() AND coalesce(is_template, false) = false) OR public.is_admin())
  WITH CHECK ((user_id = auth.uid() AND coalesce(is_template, false) = false) OR public.is_admin());
CREATE POLICY investigations_delete ON investigations FOR DELETE TO authenticated
  USING ((user_id = auth.uid() AND coalesce(is_template, false) = false) OR public.is_admin());

-- Community tables ----------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts','comments','questions','answers'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
                     USING (public.is_approved_educator())$p$, t || '_select_approved', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
                     WITH CHECK (user_id = auth.uid() AND public.is_approved_educator())$p$, t || '_insert_own', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
                     USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())$p$, t || '_update_own', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
                     USING (user_id = auth.uid() OR public.is_admin())$p$, t || '_delete_own_or_admin', t);
  END LOOP;
END $$;

-- Resources -----------------------------------------------------------
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY resources_select_approved ON resources FOR SELECT TO authenticated
  USING (public.is_approved_educator());
CREATE POLICY resources_insert_admin ON resources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY resources_update_admin ON resources FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY resources_delete_admin ON resources FOR DELETE TO authenticated
  USING (public.is_admin());
-- Block non-http(s) links (e.g. javascript:) at the database, not just the UI.
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_url_http;
ALTER TABLE resources ADD CONSTRAINT resources_url_http
  CHECK (url ~* '^https?://') NOT VALID;  -- NOT VALID: existing rows aren't checked


-- =====================================================================
-- STEP 4: Stop duplicate tracker slots / maintenance tasks
-- ---------------------------------------------------------------------
-- The old first-visit seeding could insert a teacher's 30 slots or 11
-- tasks twice. Remove duplicates (keeping the row with the most data
-- filled in), then add unique constraints so it can't happen again.
-- The app now seeds with upsert on these exact columns.
-- =====================================================================
DELETE FROM tracker_slots t
USING (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, slot_id
    ORDER BY (plant_name IS NOT NULL) DESC, (date_planted IS NOT NULL) DESC,
             (observation_notes IS NOT NULL) DESC, id
  ) AS rn
  FROM tracker_slots
) d
WHERE t.id = d.id AND d.rn > 1;

DELETE FROM maintenance_tasks m
USING (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, task_name
    ORDER BY last_completed DESC NULLS LAST, id
  ) AS rn
  FROM maintenance_tasks
) d
WHERE m.id = d.id AND d.rn > 1;

ALTER TABLE tracker_slots DROP CONSTRAINT IF EXISTS tracker_slots_user_slot_unique;
ALTER TABLE tracker_slots ADD CONSTRAINT tracker_slots_user_slot_unique UNIQUE (user_id, slot_id);
ALTER TABLE maintenance_tasks DROP CONSTRAINT IF EXISTS maintenance_tasks_user_task_unique;
ALTER TABLE maintenance_tasks ADD CONSTRAINT maintenance_tasks_user_task_unique UNIQUE (user_id, task_name);


-- =====================================================================
-- STEP 5: Notifications that scale statewide
-- ---------------------------------------------------------------------
-- * New-question alerts go only to APPROVED educators (previously every
--   profile, including pending signups and restricted accounts).
-- * Messages show the person's name instead of their email address.
-- Bodies otherwise unchanged from the Aug 20 SECURITY DEFINER versions.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.person_label(uid UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(nullif(trim(full_name), ''), split_part(email, '@', 1), 'An educator')
  FROM profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author_id UUID;
BEGIN
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id IS NULL OR post_author_id = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (post_author_id, 'comment',
          coalesce(person_label(NEW.user_id), 'An educator') || ' commented on your post',
          NEW.post_id, 'post');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_question()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE asker TEXT;
BEGIN
  asker := coalesce(person_label(NEW.user_id), 'An educator');
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  SELECT p.id, 'question', asker || ' asked: ' || LEFT(NEW.title, 50), NEW.id, 'question'
  FROM profiles p
  WHERE p.id <> NEW.user_id AND (p.is_approved = true OR p.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_question_answer()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE question_author_id UUID;
BEGIN
  SELECT user_id INTO question_author_id FROM questions WHERE id = NEW.question_id;
  IF question_author_id IS NULL OR question_author_id = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (question_author_id, 'answer',
          coalesce(person_label(NEW.user_id), 'An educator') || ' answered your question',
          NEW.question_id, 'question');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The unread-badge query filters on (user_id, read).
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read);

COMMIT;


-- =====================================================================
-- STEP 6 (READ-ONLY CHECK) - run after COMMIT and eyeball the result.
-- Every table listed should show 4 policies.
-- =====================================================================
-- SELECT tablename, count(*) AS policies, string_agg(policyname, ', ' ORDER BY policyname)
-- FROM pg_policies WHERE schemaname = 'public'
--   AND tablename IN ('tracker_slots','maintenance_tasks','harvest_log','investigations',
--                     'posts','comments','questions','answers','resources')
-- GROUP BY tablename ORDER BY tablename;
