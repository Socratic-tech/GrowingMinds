-- =====================================================================
-- Fix: "Failed to post comment" (400 on POST /rest/v1/comments)
-- ---------------------------------------------------------------------
-- Commenting fires a trigger that writes a notification for the post's
-- author. notifications.related_id was created as UUID, but post and
-- question ids in this database are numbers, so the trigger errors and
-- the whole comment is rejected. It only happens when commenting on
-- SOMEONE ELSE'S post (your own posts skip the notification), which is
-- why it slipped through testing. Answers and new questions use the
-- same pattern.
--
-- This script:
--   1. Stores related_id as text (the app never reads it; it only uses
--      related_type to decide which page to open).
--   2. Rewrites the three notification triggers to cast ids to text.
--   3. Wraps each notification in its own error handler, so a problem
--      with a notification can never block a post, comment or answer.
-- Safe to run more than once.
-- =====================================================================

BEGIN;

ALTER TABLE notifications ALTER COLUMN related_id TYPE text USING related_id::text;

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author_id UUID;
BEGIN
  BEGIN
    SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
    IF post_author_id IS NOT NULL AND post_author_id <> NEW.user_id THEN
      INSERT INTO notifications (user_id, type, message, related_id, related_type)
      VALUES (post_author_id, 'comment',
              coalesce(person_label(NEW.user_id), 'An educator') || ' commented on your post',
              NEW.post_id::text, 'post');
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_post_comment skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_question()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE asker TEXT;
BEGIN
  BEGIN
    asker := coalesce(person_label(NEW.user_id), 'An educator');
    INSERT INTO notifications (user_id, type, message, related_id, related_type)
    SELECT p.id, 'question', asker || ' asked: ' || LEFT(NEW.title, 50), NEW.id::text, 'question'
    FROM profiles p
    WHERE p.id <> NEW.user_id AND (p.is_approved = true OR p.role = 'admin');
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_new_question skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_question_answer()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE question_author_id UUID;
BEGIN
  BEGIN
    SELECT user_id INTO question_author_id FROM questions WHERE id = NEW.question_id;
    IF question_author_id IS NOT NULL AND question_author_id <> NEW.user_id THEN
      INSERT INTO notifications (user_id, type, message, related_id, related_type)
      VALUES (question_author_id, 'answer',
              coalesce(person_label(NEW.user_id), 'An educator') || ' answered your question',
              NEW.question_id::text, 'question');
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_question_answer skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
