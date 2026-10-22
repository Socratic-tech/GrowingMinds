-- =====================================================================
-- Growing Minds · add plants a Gardyn Studio is growing that the catalog
-- is missing (from a laminated Studio plant map, Oct 2026)
--
-- These five aren't on mygardyn.com (yCubes collection or anywhere in the
-- store, checked 2026-10-22), so the store refresh and the weekly sync
-- could never add them. They go in as non-store plants:
--   Bull's Blood Beets, Lemon Balm, White Petunia, Celosia Mix, Pink Celery
--
-- light_zone is where each one is growing on that tower (Studio map:
-- left M,M,H,M,H,M,H,L / right L,M,M,H,M,H,M,M). Germination and
-- harvest days are left blank for the team to fill in (Admin → Plants).
-- The sync never changes light_zone and keeps non-store plants.
--
-- Safe to run more than once: a plant that already exists (same name,
-- ignoring case and spaces) is skipped.
-- DRY RUN: change the COMMIT at the bottom to ROLLBACK.
-- =====================================================================

BEGIN;

CREATE TEMP TABLE tower_photo_plants (name text, category text, light_zone text) ON COMMIT DROP;

INSERT INTO tower_photo_plants VALUES
  ('Bull''s Blood Beets', 'Fruits & Veggies', 'Orange (Med)'),   -- A2
  ('Lemon Balm',          'Herbs',            'Orange (Med)'),   -- A4
  ('White Petunia',       'Flowers',          'Red (High)'),     -- A5
  ('Celosia Mix',         'Flowers',          'Red (High)'),     -- B6
  ('Pink Celery',         'Fruits & Veggies', 'Orange (Med)');   -- B8

CREATE TEMP TABLE tower_photo_added ON COMMIT DROP AS
SELECT t.* FROM tower_photo_plants t
WHERE NOT EXISTS (SELECT 1 FROM plants p WHERE lower(trim(p.name)) = lower(trim(t.name)));

INSERT INTO plants (name, category, light_zone, in_gardyn_store, gardyn_checked_at)
SELECT name, category, light_zone, false, current_date FROM tower_photo_added;

-- ---- Report ---------------------------------------------------------
SELECT t.name AS plant,
       CASE WHEN a.name IS NULL THEN 'already in catalog, skipped' ELSE 'added' END AS result
FROM tower_photo_plants t LEFT JOIN tower_photo_added a USING (name)
ORDER BY t.name;

COMMIT;   -- change to ROLLBACK for a dry run
