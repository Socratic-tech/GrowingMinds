-- =====================================================
-- SECURITY FIXES - Aug 20, 2026 rollout audit
-- Run this in the Supabase SQL Editor before rollout.
-- =====================================================
-- Context: the app's RLS policies were never committed to this repo (the
-- migration files referenced in earlier project notes don't exist here),
-- so they were only reviewable by querying pg_policies live. That review
-- turned up one real, exploitable gap and one lower-severity spoofing
-- vector. This file documents and fixes both. Safe to re-run (uses
-- DROP POLICY IF EXISTS / CREATE OR REPLACE throughout).

-- ---------------------------------------------------------------
-- FIX 1 (CRITICAL): profiles_update_own does not protect is_approved
-- ---------------------------------------------------------------
-- The existing policy locks the `role` column so a user can't self-promote
-- to admin, but leaves `is_approved` completely unprotected. Any logged-in
-- educator can currently run:
--   supabase.from('profiles').update({ is_approved: true }).eq('id', myId)
-- and bypass the Admin approval screen entirely - this has nothing to do
-- with the React app's UI and can't be fixed there. Locking `is_approved`
-- the same way `role` is already locked closes it.
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  AND is_approved = (SELECT is_approved FROM profiles WHERE id = auth.uid())
);

-- Defense in depth: the profiles.is_approved column defaults to `true`,
-- which the handle_new_user() trigger currently overrides correctly on
-- every real signup (it explicitly inserts is_approved = false). This just
-- removes the footgun for any future insert path that doesn't set it
-- explicitly. No effect on existing rows.
ALTER TABLE profiles ALTER COLUMN is_approved SET DEFAULT false;

-- ---------------------------------------------------------------
-- FIX 2 (should-fix): notifications can be spoofed by any authenticated user
-- ---------------------------------------------------------------
-- notifications_insert currently has with_check = true, i.e. no ownership
-- check at all - any logged-in user can insert a notification addressed to
-- any other user_id with arbitrary text, impersonating the system. This is
-- only "true" today because the trigger functions in notifications-setup.sql
-- are plain plpgsql (not SECURITY DEFINER), so they run as the calling
-- user and need an open INSERT policy to work at all.
--
-- The fix: mark the three trigger functions SECURITY DEFINER (so they run
-- with elevated privilege and can insert notifications on behalf of other
-- users regardless of RLS), then tighten the policy to self-only inserts.
-- Bodies below are unchanged from notifications-setup.sql other than the
-- added SECURITY DEFINER clause.

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  commenter_email TEXT;
BEGIN
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT email INTO commenter_email FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (post_author_id, 'comment', commenter_email || ' commented on your post', NEW.post_id, 'post');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_question()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  asker_email TEXT;
BEGIN
  SELECT email INTO asker_email FROM profiles WHERE id = NEW.user_id;
  FOR user_record IN SELECT id FROM profiles WHERE id != NEW.user_id LOOP
    INSERT INTO notifications (user_id, type, message, related_id, related_type)
    VALUES (user_record.id, 'question', asker_email || ' asked: ' || LEFT(NEW.title, 50), NEW.id, 'question');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_question_answer()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  question_author_id UUID;
  answerer_email TEXT;
BEGIN
  SELECT user_id INTO question_author_id FROM questions WHERE id = NEW.question_id;
  IF question_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT email INTO answerer_email FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (question_author_id, 'answer', answerer_email || ' answered your question', NEW.question_id, 'question');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now that the trigger functions run as SECURITY DEFINER (bypassing RLS
-- for their own inserts), the client-facing policy can be tightened to
-- self-only. Direct client inserts still work for any future "mark as
-- read"-style self-notifications, but a user can no longer address a
-- notification to someone else.
DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------
-- FIX 3 (cleanup, optional): plants has duplicate/redundant policies
-- ---------------------------------------------------------------
-- plants_select / plants_select_authenticated_v2 do the same thing, as do
-- the admin-write pairs (plants_delete/plants_admin_delete_v2, etc.) -
-- leftover from a migration that was re-run instead of replacing the old
-- policies. Harmless (multiple permissive policies just OR together) but
-- confusing for anyone editing plant permissions later. Keeping the _v2
-- set and dropping the older, unsuffixed duplicates:
DROP POLICY IF EXISTS plants_select ON plants;
DROP POLICY IF EXISTS plants_delete ON plants;
DROP POLICY IF EXISTS plants_insert ON plants;
DROP POLICY IF EXISTS plants_update ON plants;

-- ---------------------------------------------------------------
-- NOT included here - needs your input first (see chat):
-- ---------------------------------------------------------------
-- * Whether posts and harvest_log need an UPDATE policy (only add if the
--   UI actually lets someone edit an existing post or harvest entry -
--   otherwise this is dead code, not a bug).
-- * What the `GrowingMinds` table is for - it has RLS enabled with zero
--   policies (fully locked out for every role except service_role), which
--   might be intentional or might be an unused leftover.
