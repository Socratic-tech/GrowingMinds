-- =====================================================================
-- Growing Minds · every plant in Gardyn's yCube Placement Guide
-- Source: https://help.mygardyn.com/en/articles/1776961
--         ("All Plants Placement Guide", edited 2026-10-13; 138 plants)
--
-- Why: the catalog came from the Gardyn STORE (74 yCubes on sale), but
-- Gardyn's guide lists every plant they make, including seasonal,
-- starter-kit and limited ones teachers get pods of (Zinnia, Mini
-- Pumpkin, Candy Cane Pepper, Canna Flower, Bronze Arrow, ...). Run this
-- once; safe to run again.
--
-- What it does:
--   1. ADDS guide plants the catalog doesn't have (name matching ignores
--      case, punctuation, plurals and a trailing "lettuce", so "Breen" =
--      "Breen Lettuce" and "Jalapeño" = "Jalapeños"). They go in marked
--      not in the Gardyn store, so the weekly store sync leaves them be.
--   2. FILLS a blank light zone on existing plants from the guide.
--   3. FIXES two light zones set from a classroom tower photo in
--      supabase_plants_tower_photo_2026-10.sql (Lemon Balm is Low and
--      White Petunia Medium in Gardyn's guide), only if still as set then.
--   4. REPORTS plants where your team's light zone differs from the guide.
--      Those are NOT changed; review them in Admin → Plants.
--
-- DRY RUN: change the COMMIT at the bottom to ROLLBACK.
-- =====================================================================

BEGIN;

CREATE FUNCTION pg_temp.guide_key(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(regexp_replace(
           regexp_replace(translate(lower(coalesce(t, '')), 'ñéèáíóúü', 'neeaiouu'), '[^a-z0-9]', '', 'g'),
           'lettuce$', ''), 'e?s$', '')
$$;

CREATE TEMP TABLE gardyn_guide (name text, category text, light_zone text) ON COMMIT DROP;
INSERT INTO gardyn_guide VALUES
  ('Banana Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Bi-Color Sunflower', 'Flowers', 'Red (High)'),
  ('Black Pearl Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Burrito Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Candy Cane Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Cape Gooseberry', 'Fruits & Veggies', 'Red (High)'),
  ('Celosia Mix', 'Flowers', 'Red (High)'),
  ('Cucumber', 'Fruits & Veggies', 'Red (High)'),
  ('Fairytale Eggplant', 'Fruits & Veggies', 'Red (High)'),
  ('Fuchsia Snapdragon', 'Flowers', 'Red (High)'),
  ('Green Beans', 'Fruits & Veggies', 'Red (High)'),
  ('Goliath Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Holy Basil', 'Herbs', 'Red (High)'),
  ('Hungarian Hot Wax Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Jalapeño', 'Fruits & Veggies', 'Red (High)'),
  ('Lavender', 'Herbs', 'Red (High)'),
  ('Lemon Hot Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Broccoli', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Cauliflower', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Eggplant', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Pumpkin', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Squash', 'Fruits & Veggies', 'Red (High)'),
  ('Mini Okra', 'Fruits & Veggies', 'Red (High)'),
  ('Red Mini Strawberries', 'Fruits & Veggies', 'Red (High)'),
  ('Yellow Mini Strawberry', 'Fruits & Veggies', 'Red (High)'),
  ('Poblano Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Portulaca Mix', 'Flowers', 'Red (High)'),
  ('Purple Beans', 'Fruits & Veggies', 'Red (High)'),
  ('Purple Cayenne Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Purple Snapdragon', 'Flowers', 'Red (High)'),
  ('Red Cherry Tomato', 'Fruits & Veggies', 'Red (High)'),
  ('Scarlet Snapdragon', 'Flowers', 'Red (High)'),
  ('Shishito Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Stevia', 'Herbs', 'Red (High)'),
  ('Stock Flower', 'Flowers', 'Red (High)'),
  ('(Bare Root) Strawberries', 'Fruits & Veggies', 'Red (High)'),
  ('Sunflower', 'Flowers', 'Red (High)'),
  ('Sweet Pepper', 'Fruits & Veggies', 'Red (High)'),
  ('Thai Eggplant', 'Fruits & Veggies', 'Red (High)'),
  ('Tokyo Bekana', 'Greens', 'Red (High)'),
  ('Yellow Beans', 'Fruits & Veggies', 'Red (High)'),
  ('Yellow Cherry Tomato', 'Fruits & Veggies', 'Red (High)'),
  ('Yellow Snapdragon', 'Flowers', 'Red (High)'),
  ('Zinnia', 'Flowers', 'Red (High)'),
  ('American Mustard', 'Greens', 'Orange (Med)'),
  ('Basil', 'Herbs', 'Orange (Med)'),
  ('Black Viola', 'Flowers', 'Orange (Med)'),
  ('Blue Cornflower', 'Flowers', 'Orange (Med)'),
  ('Blush Hibiscus', 'Flowers', 'Orange (Med)'),
  ('Borage', 'Herbs', 'Orange (Med)'),
  ('Breen', 'Greens', 'Orange (Med)'),
  ('Bronze Arrow', 'Greens', 'Orange (Med)'),
  ('Bull''s Blood Beets', 'Fruits & Veggies', 'Orange (Med)'),
  ('Buttercrunch', 'Greens', 'Orange (Med)'),
  ('Butterhead', 'Greens', 'Orange (Med)'),
  ('Canna Flower', 'Flowers', 'Orange (Med)'),
  ('Cardinale', 'Greens', 'Orange (Med)'),
  ('Celery', 'Fruits & Veggies', 'Orange (Med)'),
  ('Chamomile', 'Herbs', 'Orange (Med)'),
  ('Collard Greens', 'Greens', 'Orange (Med)'),
  ('Dianthus', 'Flowers', 'Orange (Med)'),
  ('Endive Lettuce', 'Greens', 'Orange (Med)'),
  ('Fiesta Gitana', 'Greens', 'Orange (Med)'),
  ('Flashy Trout Back', 'Greens', 'Orange (Med)'),
  ('Green Bok Choy', 'Greens', 'Orange (Med)'),
  ('Green Cabbage', 'Greens', 'Orange (Med)'),
  ('Green Mustard', 'Greens', 'Orange (Med)'),
  ('Green Salanova', 'Greens', 'Orange (Med)'),
  ('Green Tatsoi', 'Greens', 'Orange (Med)'),
  ('Hon Tsai Tai', 'Greens', 'Orange (Med)'),
  ('Iceberg', 'Greens', 'Orange (Med)'),
  ('Italian Parsley', 'Herbs', 'Orange (Med)'),
  ('Kale', 'Greens', 'Orange (Med)'),
  ('Kale Lacinato', 'Greens', 'Orange (Med)'),
  ('Lime Basil', 'Herbs', 'Orange (Med)'),
  ('Lollo Rossa', 'Greens', 'Orange (Med)'),
  ('Marietta Marigold', 'Flowers', 'Orange (Med)'),
  ('Matilda', 'Greens', 'Orange (Med)'),
  ('Monte Carlo', 'Greens', 'Orange (Med)'),
  ('Muir Lettuce', 'Greens', 'Orange (Med)'),
  ('Nasturtium', 'Flowers', 'Orange (Med)'),
  ('Night-Scented Stock', 'Flowers', 'Orange (Med)'),
  ('Peas', 'Fruits & Veggies', 'Orange (Med)'),
  ('Perpetual Spinach', 'Greens', 'Orange (Med)'),
  ('Pink Celery', 'Fruits & Veggies', 'Orange (Med)'),
  ('Pink Petunia', 'Flowers', 'Orange (Med)'),
  ('Pink Swiss Chard', 'Greens', 'Orange (Med)'),
  ('Purple Basil', 'Herbs', 'Orange (Med)'),
  ('Purple Bok Choy', 'Greens', 'Orange (Med)'),
  ('Purple Campanula', 'Flowers', 'Orange (Med)'),
  ('Purple Kohlrabi', 'Fruits & Veggies', 'Orange (Med)'),
  ('Purple Petunia', 'Flowers', 'Orange (Med)'),
  ('Radicchio', 'Greens', 'Orange (Med)'),
  ('Radio Calendula', 'Flowers', 'Orange (Med)'),
  ('Red Amaranth', 'Greens', 'Orange (Med)'),
  ('Red Hibiscus', 'Flowers', 'Orange (Med)'),
  ('Red Impatiens', 'Flowers', 'Orange (Med)'),
  ('Red Mustard', 'Greens', 'Orange (Med)'),
  ('Red Oak Leaf Lettuce', 'Greens', 'Orange (Med)'),
  ('Red Romaine', 'Greens', 'Orange (Med)'),
  ('Red Sails Lettuce', 'Greens', 'Orange (Med)'),
  ('Red Salad Bowl', 'Greens', 'Orange (Med)'),
  ('Red Sorrel', 'Herbs', 'Orange (Med)'),
  ('Red Tatsoi', 'Greens', 'Orange (Med)'),
  ('Red Swiss Chard', 'Greens', 'Orange (Med)'),
  ('Romaine', 'Greens', 'Orange (Med)'),
  ('Rouge d''Hiver', 'Greens', 'Orange (Med)'),
  ('Sage', 'Herbs', 'Orange (Med)'),
  ('Savory', 'Herbs', 'Orange (Med)'),
  ('Sorrel', 'Herbs', 'Orange (Med)'),
  ('Shiso', 'Herbs', 'Orange (Med)'),
  ('Sweet Marjoram', 'Herbs', 'Orange (Med)'),
  ('Sweet Thai Basil', 'Herbs', 'Orange (Med)'),
  ('Tarragon', 'Herbs', 'Orange (Med)'),
  ('Torenia', 'Flowers', 'Orange (Med)'),
  ('Viola', 'Flowers', 'Orange (Med)'),
  ('Violet Impatiens', 'Flowers', 'Orange (Med)'),
  ('Wasabi Greens', 'Greens', 'Orange (Med)'),
  ('Watercress', 'Greens', 'Orange (Med)'),
  ('White Kohlrabi', 'Fruits & Veggies', 'Orange (Med)'),
  ('White Petunia', 'Flowers', 'Orange (Med)'),
  ('Yellow Swiss Chard', 'Greens', 'Orange (Med)'),
  ('Arugula', 'Greens', 'Yellow (Low)'),
  ('Bunching Onions', 'Herbs', 'Yellow (Low)'),
  ('Catnip', 'Herbs', 'Yellow (Low)'),
  ('Chervil', 'Herbs', 'Yellow (Low)'),
  ('Chives', 'Herbs', 'Yellow (Low)'),
  ('Cilantro', 'Herbs', 'Yellow (Low)'),
  ('Dill', 'Herbs', 'Yellow (Low)'),
  ('Garlic Chives', 'Herbs', 'Yellow (Low)'),
  ('Lemon Balm', 'Herbs', 'Yellow (Low)'),
  ('Lemongrass', 'Herbs', 'Yellow (Low)'),
  ('Mint', 'Herbs', 'Yellow (Low)'),
  ('Oregano', 'Herbs', 'Yellow (Low)'),
  ('Purslane', 'Greens', 'Yellow (Low)'),
  ('Rosemary', 'Herbs', 'Yellow (Low)'),
  ('Thyme', 'Herbs', 'Yellow (Low)'),
  ('Wheatgrass', 'Greens', 'Yellow (Low)');

-- Known renames between the guide and the store.
CREATE TEMP TABLE guide_alias (guide text, catalog text) ON COMMIT DROP;
INSERT INTO guide_alias VALUES ('Flashy Trout Back', 'Flashy Lettuce'), ('Marietta Marigold', 'Marigold');

CREATE TEMP TABLE guide_match ON COMMIT DROP AS
SELECT g.*, p.id AS plant_id, p.name AS catalog_name, p.light_zone AS catalog_zone
FROM gardyn_guide g
LEFT JOIN LATERAL (
  SELECT id, name, light_zone FROM plants p
  WHERE pg_temp.guide_key(p.name) = pg_temp.guide_key(g.name)
     OR pg_temp.guide_key(p.name) IN (SELECT pg_temp.guide_key(a.catalog) FROM guide_alias a WHERE a.guide = g.name)
  ORDER BY (lower(p.name) = lower(g.name)) DESC, p.name
  LIMIT 1
) p ON true;

-- 1. Add the missing ones.
INSERT INTO plants (name, category, light_zone, in_gardyn_store, gardyn_checked_at)
SELECT name, category, light_zone, false, current_date FROM guide_match WHERE plant_id IS NULL;

-- 2. Fill blank light zones.
UPDATE plants p SET light_zone = m.light_zone
FROM guide_match m WHERE p.id = m.plant_id AND p.light_zone IS NULL;

-- 3. Correct the two set from the tower photo.
UPDATE plants SET light_zone = 'Yellow (Low)'  WHERE name = 'Lemon Balm'    AND light_zone = 'Orange (Med)';
UPDATE plants SET light_zone = 'Orange (Med)'  WHERE name = 'White Petunia' AND light_zone = 'Red (High)';

-- ---- Report ---------------------------------------------------------
SELECT * FROM (
  SELECT 1 AS sort, 'added' AS result, name AS plant, light_zone AS note FROM guide_match WHERE plant_id IS NULL
  UNION ALL
  SELECT 2, 'light zone filled', catalog_name, light_zone FROM guide_match WHERE plant_id IS NOT NULL AND catalog_zone IS NULL
  UNION ALL
  SELECT 3, 'light zone corrected', name, light_zone FROM gardyn_guide WHERE name IN ('Lemon Balm', 'White Petunia')
  UNION ALL
  SELECT 4, 'team zone differs from guide (not changed)', catalog_name, 'yours: ' || catalog_zone || ' · guide: ' || light_zone
    FROM guide_match WHERE plant_id IS NOT NULL AND catalog_zone IS NOT NULL AND catalog_zone <> light_zone
      AND catalog_name NOT IN ('Lemon Balm', 'White Petunia')
) r
ORDER BY sort, plant;

COMMIT;   -- change to ROLLBACK for a dry run
