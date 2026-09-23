-- =====================================================================
-- Growing Minds · refresh the plant catalog from the Gardyn store
-- Source: https://mygardyn.com/collections/ycubes  (checked 2026-09-23,
-- 75 yCubes; the "Seedless yCube" filler pod is skipped)
--
-- What this does, all in one transaction:
--   1. Adds columns for the store facts: gardyn_handle (for the link),
--      first_harvest, care_level, yield, perfect_for, member_price,
--      in_gardyn_store, gardyn_checked_at.
--   2. Matches your existing plants to store yCubes by name (ignoring
--      case, punctuation, plurals and a few known aliases like
--      "Bok Choy" = "Green Bok Choy").
--   3. Matched plants: updates category, price, member price and the
--      new store fields. harvest_days is only filled in where it's blank,
--      so your team's exact numbers are kept. light_zone,
--      germination_days, thin_to, teacher_note, lesson_hook and best_use
--      are NEVER changed.
--   4. yCubes you don't have yet are ADDED (light zone and germination
--      left blank for the team to fill in).
--   5. Plants that aren't in the store anymore are KEPT (tracker slots
--      use them) and marked in_gardyn_store = false.
--   6. Categories now match the store: Greens, Herbs, Fruits & Veggies,
--      Flowers (old "Herb", "Fruiting", "Flower" are renamed).
--
-- DRY RUN: change the COMMIT at the very bottom to ROLLBACK, run it, and
-- read the report. Nothing is saved. Then change it back and run again.
-- =====================================================================

BEGIN;

ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS gardyn_handle     text,
  ADD COLUMN IF NOT EXISTS first_harvest     text,
  ADD COLUMN IF NOT EXISTS care_level        text,
  ADD COLUMN IF NOT EXISTS yield             text,
  ADD COLUMN IF NOT EXISTS perfect_for       text,
  ADD COLUMN IF NOT EXISTS member_price      text,
  ADD COLUMN IF NOT EXISTS in_gardyn_store   boolean,
  ADD COLUMN IF NOT EXISTS gardyn_checked_at date;

-- Store prices are text like "$4.99" (safe if the column was numeric).
ALTER TABLE plants ALTER COLUMN price TYPE text USING price::text;

CREATE FUNCTION pg_temp.gm_key(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
           regexp_replace(translate(lower(coalesce(t, '')), 'ñéèáíóúü', 'neeaiouu'), '[^a-z0-9]', '', 'g'),
           's$', '')
$$;

CREATE TEMP TABLE gardyn_site (
  name text, handle text, category text, price text, member_price text,
  perfect_for text, yield text, care_level text, first_harvest text,
  harvest_days int, keys text[]
) ON COMMIT DROP;

INSERT INTO gardyn_site VALUES
  ('Arugula', 'arugula', 'Greens', '$4.99', '$1.99', 'spicy salads', 'Light', 'Expert', '1-2 Months', 30, ARRAY['arugula']),
  ('Banana Peppers', 'banana-peppers', 'Fruits & Veggies', '$9.98', '$3.98', 'add crunch and heat', 'Bountiful', 'Expert', '3-4 Months', 90, ARRAY['bananapepper']),
  ('Basil', 'basil', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['basil']),
  ('Breen Lettuce', 'breen-lettuce', 'Greens', '$4.99', '$1.99', 'romaine lovers', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['breen', 'breenlettuce']),
  ('Bunching Onions', 'bunching-onions', 'Fruits & Veggies', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Intermediate', '2-3 Months', 60, ARRAY['bunchingonion', 'greenonion', 'scallion']),
  ('Buttercrunch', 'buttercrunch', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['buttercrunch', 'buttercrunchlettuce']),
  ('Butterhead', 'butterhead', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['butterhead', 'butterheadlettuce']),
  ('Catnip', 'catnip', 'Herbs', '$9.98', '$3.98', 'your feline friends', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['catnip']),
  ('Celery', 'celery', 'Fruits & Veggies', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Intermediate', '1-2 Months', 30, ARRAY['celery']),
  ('Chives', 'chives', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Intermediate', '2-3 Months', 60, ARRAY['chive']),
  ('Cilantro', 'cilantro', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Light', 'Beginner', '1-2 Months', 30, ARRAY['cilantro']),
  ('Cucumbers', 'cucumbers', 'Fruits & Veggies', '$9.98', '$3.98', 'add crunch and heat', 'Generous', 'Expert', '2-3 Months', 60, ARRAY['cucumber']),
  ('Dianthus', 'dianthus', 'Flowers', '$9.98', '$3.98', 'adding texture to bouquet', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['dianthu']),
  ('Dill', 'dill', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['dill']),
  ('Dragon Beans', 'dragon-beans', 'Fruits & Veggies', '$4.99', '$1.99', 'add crunch and heat', 'Light', 'Expert', '2-3 Months', 60, ARRAY['dragonbean']),
  ('Endive Lettuce', 'endive-lettuce', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['endive', 'endivelettuce']),
  ('Fairytale Eggplant', 'fairytale-eggplant', 'Fruits & Veggies', '$9.98', '$3.98', 'vining plants', 'Generous', 'Expert', '3-4 Months', 90, ARRAY['eggplant', 'fairytaleeggplant']),
  ('Flashy Lettuce', 'flashy-lettuce', 'Greens', '$4.99', '$1.99', 'romaine lovers', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['flashy', 'flashylettuce', 'flashytroutback']),
  ('Green Beans', 'green-beans', 'Fruits & Veggies', '$4.99', '$1.99', 'vining plants', 'Light', 'Expert', '2-3 Months', 60, ARRAY['greenbean']),
  ('Green Bok Choy', 'bok-choy', 'Greens', '$4.99', '$1.99', 'spinach lovers', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['bokchoy', 'greenbokchoy']),
  ('Green Cabbage', 'green-cabbage', 'Fruits & Veggies', '$4.99', '$1.99', 'your everyday superfood', 'Generous', 'Intermediate', '2-3 Months', 60, ARRAY['greencabbage']),
  ('Green Mustard', 'green-mustard', 'Greens', '$4.99', '$1.99', 'spinach lovers', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['greenmustard', 'mizuna']),
  ('Green Salanova', 'green-salanova', 'Greens', '$4.99', '$1.99', 'your daily salad mix', NULL, NULL, NULL, NULL, ARRAY['greensalanova', 'salanova']),
  ('Green Tatsoi', 'green-tatsoi', 'Greens', '$4.99', '$1.99', 'spinach lovers', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['greentatsoi', 'tatsoi']),
  ('Holy Basil', 'holy-basil', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['holybasil', 'tulsi']),
  ('Iceberg Lettuce', 'iceberg-lettuce', 'Greens', '$4.99', '$1.99', 'adding crunchy texture', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['iceberg', 'iceberglettuce']),
  ('Italian Parsley', 'italian-parsley', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['flatleafparsley', 'italianparsley', 'parsley']),
  ('Jalapeños', 'jalapenos', 'Fruits & Veggies', '$9.98', '$3.98', 'add crunch and heat', 'Bountiful', 'Expert', '3-4 Months', 90, ARRAY['jalapeno', 'jalapenopepper']),
  ('Kale', 'kale', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['kale']),
  ('Kale Lacinato', 'kale-lacinato', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['dinosaurkale', 'kalelacinato', 'lacinatokale']),
  ('Lavender', 'lavender', 'Flowers', '$4.99', '$1.99', 'favorite florals', 'Generous', 'Intermediate', '3-4 Months', 90, ARRAY['lavender']),
  ('Lemon Hot Pepper', 'lemon-hot-pepper', 'Fruits & Veggies', '$9.98', '$3.98', 'add crunch and heat', 'Bountiful', 'Expert', '3-4 Months', 90, ARRAY['lemondroppepper', 'lemonhotpepper']),
  ('Marigold', 'red-marietta-marigold', 'Flowers', '$4.99', '$1.99', 'favorite florals', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['marigold', 'redmariettamarigold']),
  ('Mini Cauliflower', 'mini-cauliflower', 'Fruits & Veggies', '$9.98', '$3.98', 'vining plants', 'Light', 'Beginner', '1-2 Months', 30, ARRAY['cauliflower', 'minicauliflower']),
  ('Mint', 'mint', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['mint']),
  ('Muir Lettuce', 'muir-lettuce', 'Greens', '$4.99', '$1.99', 'iceberg or romaine lovers', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['muir', 'muirlettuce']),
  ('Oregano', 'oregano', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Light', 'Intermediate', '2-3 Months', 60, ARRAY['oregano']),
  ('Peas', 'peas', 'Fruits & Veggies', '$4.99', '$1.99', 'add crunch and heat', 'Generous', 'Expert', '2-3 Months', 60, ARRAY['pea']),
  ('Perpetual Spinach', 'perpetual-spinach', 'Greens', '$4.99', '$1.99', 'spinach lovers', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['perpetualspinach', 'spinach']),
  ('Purple Basil', 'purple-basil', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['purplebasil']),
  ('Purple Bok Choy', 'purple-bok-choy', 'Greens', '$4.99', '$1.99', 'salads or stir-fries', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['purplebokchoy']),
  ('Purple Campanula', 'purple-campanula', 'Flowers', '$4.99', '$3.98', 'favorite florals', 'Generous', 'Intermediate', '2-3 Months', 60, ARRAY['campanula', 'purplecampanula']),
  ('Purple Kohlrabi', 'purple-kohlrabi', 'Fruits & Veggies', '$4.99', '$1.99', 'pepper lovers', 'Light', 'Beginner', '2-3 Months', 60, ARRAY['kohlrabi', 'purplekohlrabi']),
  ('Purple Petunia', 'purple-petunia', 'Flowers', '$4.99', '$1.99', 'favorite florals', 'Bountiful', 'Intermediate', '1-2 Months', 30, ARRAY['petunia', 'purplepetunia']),
  ('Purple Snapdragon', 'purple-snapdragon', 'Flowers', '$14.97', '$5.97', 'favorite florals', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['purplesnapdragon']),
  ('Radio Calendula', 'radio-calendula', 'Flowers', '$4.99', '$1.99', 'favorite florals', 'Generous', 'Intermediate', '1-2 Months', 30, ARRAY['calendula', 'radiocalendula']),
  ('Red Amaranth', 'red-amaranth', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Intermediate', '3-4 Months', 90, ARRAY['amaranth', 'redamaranth']),
  ('Red Cherry Tomatoes', 'cherry-tomatoes', 'Fruits & Veggies', '$9.98', '$3.98', 'vining plants', 'Bountiful', 'Expert', '3-4 Months', 90, ARRAY['cherrytomato', 'cherrytomatoe', 'redcherrytomatoe', 'tomatoe']),
  ('Red Mini Strawberries', 'mini-strawberries', 'Fruits & Veggies', '$9.98', '$3.98', 'vining plants', 'Bountiful', 'Intermediate', '3-4 Months', 90, ARRAY['ministrawberrie', 'redministrawberrie', 'strawberrie']),
  ('Red Mustard', 'red-mustard', 'Greens', '$4.99', '$1.99', 'a sharp, peppery flavor', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['redmustard']),
  ('Red Sails', 'red-sails', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['redsail', 'redsailslettuce']),
  ('Red Salad Bowl', 'red-salad-bowl', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['redsaladbowl', 'redsaladbowllettuce']),
  ('Red Sorrel', 'red-sorrel', 'Greens', '$4.99', '$1.99', 'classic salads', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['redsorrel', 'sorrel']),
  ('Red Swiss Chard', 'red-swiss-chard', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['redswisschard']),
  ('Red Tatsoi', 'red-tatsoi', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['redtatsoi']),
  ('Romaine', 'romaine', 'Greens', '$4.99', '$1.99', 'classic salads', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['romaine', 'romainelettuce']),
  ('Rosemary', 'rosemary', 'Herbs', '$4.99', NULL, 'flavor rush', 'Light', 'Beginner', '2-3 Months', 60, ARRAY['rosemary']),
  ('Sage', 'sage', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Intermediate', '2-3 Months', 60, ARRAY['sage']),
  ('Savory', 'savory', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['savory']),
  ('Scarlet Snapdragon', 'scarlet-snapdragon', 'Flowers', '$14.97', '$5.97', 'vibrant bouquets', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['scarletsnapdragon']),
  ('Stevia', 'stevia', 'Herbs', '$9.98', '$3.98', 'a natural sweetener', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['stevia']),
  ('Stock Flower', 'stock-flower', 'Flowers', '$9.98', '$3.98', 'aromatic therapy at home', 'Bountiful', 'Beginner', '3-4 Months', 90, ARRAY['stock', 'stockflower']),
  ('Sunflower', 'sunflower', 'Flowers', '$14.97', '$5.97', 'sunny bouquets', 'Light', 'Intermediate', '2-3 Months', 60, ARRAY['sunflower']),
  ('Sweet Marjoram', 'sweet-marjoram', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['marjoram', 'sweetmarjoram']),
  ('Sweet Peppers', 'sweet-peppers', 'Fruits & Veggies', '$9.98', '$3.98', 'vining plants', 'Bountiful', 'Expert', '3-4 Months', 90, ARRAY['bellpepper', 'sweetpepper']),
  ('Sweet Thai Basil', 'sweet-thai-basil', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['sweetthaibasil', 'thaibasil']),
  ('Tarragon', 'tarragon', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['tarragon']),
  ('Thyme', 'thyme', 'Herbs', '$4.99', '$1.99', 'flavor rush', 'Bountiful', 'Intermediate', '3-4 Months', 90, ARRAY['thyme']),
  ('Tokyo Bekana', 'tokyo-bekana', 'Greens', '$4.99', '$1.99', 'slaws or stir-fries', 'Bountiful', 'Beginner', '1-2 Months', 30, ARRAY['tokyobekana']),
  ('Torenia', 'torenia', 'Flowers', '$9.98', '$1.99', 'favorite florals', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['torenia']),
  ('Violet Impatiens', 'violet-impatiens', 'Flowers', '$4.99', '$1.99', 'favorite florals', 'Bountiful', 'Beginner', '2-3 Months', 60, ARRAY['impatien', 'violetimpatien']),
  ('Watercress', 'watercress', 'Fruits & Veggies', '$4.99', '$1.99', 'health boost', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['watercres']),
  ('Wheatgrass', 'wheatgrass', 'Fruits & Veggies', '$4.99', '$1.99', 'health boost', 'Generous', 'Beginner', '1-2 Months', 30, ARRAY['wheatgras']),
  ('Yellow Snapdragon', 'yellow-snapdragon', 'Flowers', '$14.97', '$5.97', 'favorite florals', 'Bountiful', 'Intermediate', '2-3 Months', 60, ARRAY['yellowsnapdragon']),
  ('Yellow Swiss Chard', 'yellow-swiss-chard', 'Greens', '$4.99', '$1.99', 'getting your daily nutrients', 'Generous', 'Beginner', '2-3 Months', 60, ARRAY['yellowswisschard']);

-- Old category names → store names
UPDATE plants SET category = CASE category
    WHEN 'Herb' THEN 'Herbs'
    WHEN 'Fruiting' THEN 'Fruits & Veggies'
    WHEN 'Flower' THEN 'Flowers'
    ELSE category END
WHERE category IN ('Herb', 'Fruiting', 'Flower');

CREATE TEMP TABLE gardyn_match ON COMMIT DROP AS
SELECT p.id AS plant_id, p.name AS your_name, s.*
FROM plants p
JOIN gardyn_site s ON pg_temp.gm_key(p.name) = ANY (s.keys);

UPDATE plants p SET
  category          = m.category,
  price             = m.price,
  member_price      = m.member_price,
  perfect_for       = m.perfect_for,
  yield             = m.yield,
  care_level        = m.care_level,
  first_harvest     = m.first_harvest,
  gardyn_handle     = m.handle,
  harvest_days      = coalesce(p.harvest_days, m.harvest_days),
  in_gardyn_store   = true,
  gardyn_checked_at = current_date
FROM gardyn_match m
WHERE p.id = m.plant_id;

CREATE TEMP TABLE gardyn_added ON COMMIT DROP AS
SELECT s.* FROM gardyn_site s
WHERE NOT EXISTS (SELECT 1 FROM gardyn_match m WHERE m.handle = s.handle);

INSERT INTO plants (name, category, price, member_price, perfect_for, yield, care_level,
                    first_harvest, gardyn_handle, harvest_days, in_gardyn_store, gardyn_checked_at)
SELECT name, category, price, member_price, perfect_for, yield, care_level,
       first_harvest, handle, harvest_days, true, current_date
FROM gardyn_added;

UPDATE plants SET in_gardyn_store = false, gardyn_checked_at = current_date
WHERE id NOT IN (SELECT plant_id FROM gardyn_match)
  AND name NOT IN (SELECT name FROM gardyn_added);

-- ---- Report ---------------------------------------------------------
SELECT * FROM (
  SELECT 1 AS sort, 'updated' AS result, your_name AS plant,
         CASE WHEN your_name <> name THEN 'matched store yCube "' || name || '"' ELSE '' END AS note
  FROM gardyn_match
  UNION ALL
  SELECT 2, 'added (needs light zone + germination days)', name, category FROM gardyn_added
  UNION ALL
  SELECT 3, 'kept, not in Gardyn store', name, coalesce(category, '')
  FROM plants WHERE in_gardyn_store = false
) r
ORDER BY sort, plant;

COMMIT;   -- change to ROLLBACK for a dry run
