-- =====================================================
-- RLS / SCHEMA AUDIT - run this in the Supabase SQL Editor
-- =====================================================
-- Why this file exists: the app's memory notes reference five migration
-- files (supabase_plants_migration.sql, supabase_maintenance_migration.sql,
-- supabase_tracker_migration.sql, supabase_harvest_migration.sql,
-- supabase_lessons_migration.sql) that were supposedly run against this
-- project, but none of them are present in this repo - only
-- notifications-setup.sql is. That means the actual row-level-security
-- policies protecting each educator's Gardyn data only exist live inside
-- Supabase right now, with nothing in version control to review, diff, or
-- rebuild from if this project ever needs to be recreated.
--
-- This script is READ-ONLY (SELECT statements only, no CREATE/ALTER/DROP).
-- It's safe to run as-is. Run it, then paste the output back so the actual
-- policies can be reviewed and (if anything is missing) written up as a
-- proper, version-controlled migration.
-- =====================================================

-- 1. What tables actually exist in the public schema right now?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Does every Gardyn table have Row Level Security turned ON at all?
-- (rowsecurity = false means ANY authenticated user - or in some configs,
-- anyone with the anon key - can read/write every row in that table.)
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
ORDER BY relname;

-- 3. What policies exist, and what do they actually check?
-- `qual` = condition for SELECT/UPDATE/DELETE, `with_check` = condition for
-- INSERT/UPDATE. For a per-user table, expect to see something like
-- `auth.uid() = user_id` here - if a table has NO rows below, it has RLS
-- enabled but zero policies, which means it silently denies ALL access
-- (app-breaking), or RLS is disabled and it's wide open (data-leak risk).
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Column list for each of the tables this app depends on, so it's
-- possible to confirm column names (e.g. `user_id` vs `owner_id`) match
-- what the frontend code expects.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'posts', 'comments', 'questions', 'answers', 'resources',
    'plants', 'maintenance_tasks', 'tracker_slots', 'harvest_log',
    'investigations', 'notifications'
  )
ORDER BY table_name, ordinal_position;
