-- =====================================================
-- NOTIFICATIONS TABLE & TRIGGERS SETUP
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'question', 'answer')),
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('post', 'question', 'comment')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "Allow insert for authenticated users"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Notify post author when someone comments
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_email TEXT;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Don't notify if commenting on own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter's email
  SELECT email INTO commenter_email
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert notification
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (
    post_author_id,
    'comment',
    commenter_email || ' commented on your post',
    NEW.post_id,
    'post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notify all users when new question is posted (except author)
CREATE OR REPLACE FUNCTION notify_new_question()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  asker_email TEXT;
BEGIN
  -- Get asker's email
  SELECT email INTO asker_email
  FROM profiles
  WHERE id = NEW.user_id;

  -- Notify all users except the question author
  FOR user_record IN
    SELECT id FROM profiles WHERE id != NEW.user_id
  LOOP
    INSERT INTO notifications (user_id, type, message, related_id, related_type)
    VALUES (
      user_record.id,
      'question',
      asker_email || ' asked: ' || LEFT(NEW.title, 50),
      NEW.id,
      'question'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notify question author when someone answers
CREATE OR REPLACE FUNCTION notify_question_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_author_id UUID;
  answerer_email TEXT;
BEGIN
  -- Get the question author
  SELECT user_id INTO question_author_id
  FROM questions
  WHERE id = NEW.question_id;

  -- Don't notify if answering own question
  IF question_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get answerer's email
  SELECT email INTO answerer_email
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert notification
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (
    question_author_id,
    'answer',
    answerer_email || ' answered your question',
    NEW.question_id,
    'question'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for new comments on posts
DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- Trigger for new questions
DROP TRIGGER IF EXISTS on_question_created ON questions;
CREATE TRIGGER on_question_created
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_question();

-- Trigger for new answers
DROP TRIGGER IF EXISTS on_answer_created ON answers;
CREATE TRIGGER on_answer_created
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_answer();
