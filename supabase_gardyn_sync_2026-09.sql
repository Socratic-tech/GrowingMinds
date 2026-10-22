-- =====================================================================
-- Growing Minds · weekly Gardyn catalog sync (run once)
--
-- Lets Claude's weekly scheduled check save what it finds on
-- mygardyn.com, without any admin password or service key:
--
--   public.gardyn_catalog_sync(p_key, p_items, p_dry_run, p_force)
--     * Only works with the sync key (stored hashed below; the plain key
--       lives only in the scheduled task). Wrong key = error.
--     * Only touches the plants table, with the same rules as
--       supabase_plants_gardyn_2026-09.sql:
--         - store facts updated (category, price, member price, perfect
--           for, yield, care level, first harvest, handle)
--         - harvest_days filled only when blank
--         - team fields NEVER changed (light_zone, germination_days,
--           thin_to, teacher_note, lesson_hook, best_use)
--         - new yCubes added; dropped ones kept, marked not in store
--         - a blank on the store never erases what we have
--     * Safety stops: fewer than 50 store items, or more than 15 plants
--       dropping at once (unless p_force).
--     * Every run is logged in public.catalog_sync_runs (admins can read).
--
-- To turn the weekly sync off later:  DELETE FROM catalog_sync_keys;
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Sync key (hashed). No policies = nobody can read it through the API.
CREATE TABLE IF NOT EXISTS public.catalog_sync_keys (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_hash   text NOT NULL UNIQUE,
  label      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_sync_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_sync_keys FROM anon, authenticated;
INSERT INTO public.catalog_sync_keys (key_hash, label)
VALUES ('137048dc42e201c57cc6942beaa963a0c846945009811a83b9afcac4b9e77dd5', 'Claude weekly scheduled task')
ON CONFLICT (key_hash) DO NOTHING;

-- Run log.
CREATE TABLE IF NOT EXISTS public.catalog_sync_runs (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at     timestamptz NOT NULL DEFAULT now(),
  dry_run    boolean NOT NULL,
  store_count int,
  report     jsonb
);
ALTER TABLE public.catalog_sync_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_sync_runs_admin_read ON public.catalog_sync_runs;
CREATE POLICY catalog_sync_runs_admin_read ON public.catalog_sync_runs
  FOR SELECT TO authenticated USING (public.is_admin());

-- Name aliases (store handle -> matching keys), from the September refresh.
CREATE TABLE IF NOT EXISTS public.gardyn_aliases (
  handle text NOT NULL,
  key    text NOT NULL,
  PRIMARY KEY (handle, key)
);
ALTER TABLE public.gardyn_aliases ENABLE ROW LEVEL SECURITY;
INSERT INTO public.gardyn_aliases (handle, key) VALUES
  ('arugula', 'arugula'),
  ('banana-peppers', 'bananapepper'),
  ('basil', 'basil'),
  ('bok-choy', 'bokchoy'),
  ('bok-choy', 'greenbokchoy'),
  ('breen-lettuce', 'breen'),
  ('breen-lettuce', 'breenlettuce'),
  ('bunching-onions', 'bunchingonion'),
  ('bunching-onions', 'greenonion'),
  ('bunching-onions', 'scallion'),
  ('buttercrunch', 'buttercrunch'),
  ('buttercrunch', 'buttercrunchlettuce'),
  ('butterhead', 'butterhead'),
  ('butterhead', 'butterheadlettuce'),
  ('catnip', 'catnip'),
  ('celery', 'celery'),
  ('cherry-tomatoes', 'cherrytomato'),
  ('cherry-tomatoes', 'cherrytomatoe'),
  ('cherry-tomatoes', 'redcherrytomatoe'),
  ('cherry-tomatoes', 'tomatoe'),
  ('chives', 'chive'),
  ('cilantro', 'cilantro'),
  ('cucumbers', 'cucumber'),
  ('dianthus', 'dianthu'),
  ('dill', 'dill'),
  ('dragon-beans', 'dragonbean'),
  ('endive-lettuce', 'endive'),
  ('endive-lettuce', 'endivelettuce'),
  ('fairytale-eggplant', 'eggplant'),
  ('fairytale-eggplant', 'fairytaleeggplant'),
  ('flashy-lettuce', 'flashy'),
  ('flashy-lettuce', 'flashylettuce'),
  ('flashy-lettuce', 'flashytroutback'),
  ('green-beans', 'greenbean'),
  ('green-cabbage', 'greencabbage'),
  ('green-mustard', 'greenmustard'),
  ('green-mustard', 'mizuna'),
  ('green-salanova', 'greensalanova'),
  ('green-salanova', 'salanova'),
  ('green-tatsoi', 'greentatsoi'),
  ('green-tatsoi', 'tatsoi'),
  ('holy-basil', 'holybasil'),
  ('holy-basil', 'tulsi'),
  ('iceberg-lettuce', 'iceberg'),
  ('iceberg-lettuce', 'iceberglettuce'),
  ('italian-parsley', 'flatleafparsley'),
  ('italian-parsley', 'italianparsley'),
  ('italian-parsley', 'parsley'),
  ('jalapenos', 'jalapeno'),
  ('jalapenos', 'jalapenopepper'),
  ('kale', 'kale'),
  ('kale-lacinato', 'dinosaurkale'),
  ('kale-lacinato', 'kalelacinato'),
  ('kale-lacinato', 'lacinatokale'),
  ('lavender', 'lavender'),
  ('lemon-hot-pepper', 'lemondroppepper'),
  ('lemon-hot-pepper', 'lemonhotpepper'),
  ('mini-cauliflower', 'cauliflower'),
  ('mini-cauliflower', 'minicauliflower'),
  ('mini-strawberries', 'ministrawberrie'),
  ('mini-strawberries', 'redministrawberrie'),
  ('mini-strawberries', 'strawberrie'),
  ('mint', 'mint'),
  ('muir-lettuce', 'muir'),
  ('muir-lettuce', 'muirlettuce'),
  ('oregano', 'oregano'),
  ('peas', 'pea'),
  ('perpetual-spinach', 'perpetualspinach'),
  ('perpetual-spinach', 'spinach'),
  ('purple-basil', 'purplebasil'),
  ('purple-bok-choy', 'purplebokchoy'),
  ('purple-campanula', 'campanula'),
  ('purple-campanula', 'purplecampanula'),
  ('purple-kohlrabi', 'kohlrabi'),
  ('purple-kohlrabi', 'purplekohlrabi'),
  ('purple-petunia', 'petunia'),
  ('purple-petunia', 'purplepetunia'),
  ('purple-snapdragon', 'purplesnapdragon'),
  ('radio-calendula', 'calendula'),
  ('radio-calendula', 'radiocalendula'),
  ('red-amaranth', 'amaranth'),
  ('red-amaranth', 'redamaranth'),
  ('red-marietta-marigold', 'marigold'),
  ('red-marietta-marigold', 'redmariettamarigold'),
  ('red-mustard', 'redmustard'),
  ('red-sails', 'redsail'),
  ('red-sails', 'redsailslettuce'),
  ('red-salad-bowl', 'redsaladbowl'),
  ('red-salad-bowl', 'redsaladbowllettuce'),
  ('red-sorrel', 'redsorrel'),
  ('red-sorrel', 'sorrel'),
  ('red-swiss-chard', 'redswisschard'),
  ('red-tatsoi', 'redtatsoi'),
  ('romaine', 'romaine'),
  ('romaine', 'romainelettuce'),
  ('rosemary', 'rosemary'),
  ('sage', 'sage'),
  ('savory', 'savory'),
  ('scarlet-snapdragon', 'scarletsnapdragon'),
  ('stevia', 'stevia'),
  ('stock-flower', 'stock'),
  ('stock-flower', 'stockflower'),
  ('sunflower', 'sunflower'),
  ('sweet-marjoram', 'marjoram'),
  ('sweet-marjoram', 'sweetmarjoram'),
  ('sweet-peppers', 'bellpepper'),
  ('sweet-peppers', 'sweetpepper'),
  ('sweet-thai-basil', 'sweetthaibasil'),
  ('sweet-thai-basil', 'thaibasil'),
  ('tarragon', 'tarragon'),
  ('thyme', 'thyme'),
  ('tokyo-bekana', 'tokyobekana'),
  ('torenia', 'torenia'),
  ('violet-impatiens', 'impatien'),
  ('violet-impatiens', 'violetimpatien'),
  ('watercress', 'watercres'),
  ('wheatgrass', 'wheatgras'),
  ('yellow-snapdragon', 'yellowsnapdragon'),
  ('yellow-swiss-chard', 'yellowswisschard')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.gardyn_name_key(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
           regexp_replace(translate(lower(coalesce(t, '')), 'ñéèáíóúü', 'neeaiouu'), '[^a-z0-9]', '', 'g'),
           's$', '')
$$;

CREATE OR REPLACE FUNCTION public.gardyn_catalog_sync(
  p_key text, p_items jsonb, p_dry_run boolean DEFAULT false, p_force boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  it        jsonb;
  r         plants%ROWTYPE;
  v_id      plants.id%TYPE;
  v_keys    text[];
  matched   text[] := '{}';
  added     jsonb := '[]';
  updated   jsonb := '[]';
  back      jsonb := '[]';
  gone      jsonb := '[]';
  changes   jsonb;
  f         text;
  n_items   int;
  n_gone    int;
  report    jsonb;
  today     date := (now() AT TIME ZONE 'America/Detroit')::date;
BEGIN
  IF p_key IS NULL OR NOT EXISTS (
    SELECT 1 FROM catalog_sync_keys WHERE key_hash = encode(digest(p_key, 'sha256'), 'hex')
  ) THEN
    RAISE EXCEPTION 'invalid sync key';
  END IF;

  n_items := jsonb_array_length(coalesce(p_items, '[]'));
  IF n_items < 50 THEN
    RAISE EXCEPTION 'only % store items sent; the store may be down or changed. Nothing saved.', n_items;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(it->>'handle', '') = '' OR coalesce(it->>'name', '') = '' THEN CONTINUE; END IF;

    -- Match: saved handle, then name / handle / alias keys.
    v_id := NULL;
    SELECT id INTO v_id FROM plants WHERE gardyn_handle = it->>'handle' AND NOT (id::text = ANY (matched)) LIMIT 1;
    IF v_id IS NULL THEN
      v_keys := ARRAY[gardyn_name_key(it->>'name'), gardyn_name_key(it->>'handle')]
                || coalesce((SELECT array_agg(key) FROM gardyn_aliases WHERE handle = it->>'handle'), '{}');
      SELECT id INTO v_id FROM plants
       WHERE gardyn_name_key(name) = ANY (v_keys) AND NOT (id::text = ANY (matched))
       ORDER BY (gardyn_handle IS NULL) DESC, id LIMIT 1;
    END IF;

    IF v_id IS NOT NULL THEN
      matched := matched || v_id::text;
      SELECT * INTO r FROM plants WHERE id = v_id;
      changes := '{}';
      FOREACH f IN ARRAY ARRAY['category','price','member_price','perfect_for','yield','care_level','first_harvest'] LOOP
        IF nullif(it->>f, '') IS NOT NULL AND (to_jsonb(r)->>f) IS DISTINCT FROM (it->>f) THEN
          changes := changes || jsonb_build_object(f, jsonb_build_array(to_jsonb(r)->>f, it->>f));
        END IF;
      END LOOP;
      IF r.gardyn_handle IS DISTINCT FROM it->>'handle' THEN
        changes := changes || jsonb_build_object('gardyn_handle', jsonb_build_array(r.gardyn_handle, it->>'handle'));
      END IF;
      IF r.harvest_days IS NULL AND (it->>'harvest_days') ~ '^\d+$' THEN
        changes := changes || jsonb_build_object('harvest_days', jsonb_build_array(NULL, (it->>'harvest_days')::int));
      END IF;
      IF changes <> '{}' THEN updated := updated || jsonb_build_object('name', r.name, 'changes', changes); END IF;
      IF r.in_gardyn_store IS FALSE THEN back := back || to_jsonb(r.name); END IF;

      IF NOT p_dry_run THEN
        UPDATE plants SET
          category      = coalesce(nullif(it->>'category', ''), category),
          price         = coalesce(nullif(it->>'price', ''), price),
          member_price  = coalesce(nullif(it->>'member_price', ''), member_price),
          perfect_for   = coalesce(nullif(it->>'perfect_for', ''), perfect_for),
          yield         = coalesce(nullif(it->>'yield', ''), yield),
          care_level    = coalesce(nullif(it->>'care_level', ''), care_level),
          first_harvest = coalesce(nullif(it->>'first_harvest', ''), first_harvest),
          gardyn_handle = it->>'handle',
          harvest_days  = coalesce(harvest_days, CASE WHEN (it->>'harvest_days') ~ '^\d+$' THEN (it->>'harvest_days')::int END),
          in_gardyn_store   = true,
          gardyn_checked_at = today
        WHERE id = v_id;
      END IF;
    ELSE
      added := added || jsonb_build_object('name', it->>'name', 'category', it->>'category', 'care_level', it->>'care_level');
      IF NOT p_dry_run THEN
        INSERT INTO plants (name, category, price, member_price, perfect_for, yield, care_level,
                            first_harvest, harvest_days, gardyn_handle, in_gardyn_store, gardyn_checked_at)
        VALUES (it->>'name', nullif(it->>'category', ''), nullif(it->>'price', ''), nullif(it->>'member_price', ''),
                nullif(it->>'perfect_for', ''), nullif(it->>'yield', ''), nullif(it->>'care_level', ''),
                nullif(it->>'first_harvest', ''),
                CASE WHEN (it->>'harvest_days') ~ '^\d+$' THEN (it->>'harvest_days')::int END,
                it->>'handle', true, today)
        RETURNING id INTO v_id;
        matched := matched || v_id::text;
      END IF;
    END IF;
  END LOOP;

  SELECT coalesce(jsonb_agg(name ORDER BY name), '[]'), count(*) INTO gone, n_gone
    FROM plants WHERE NOT (id::text = ANY (matched)) AND in_gardyn_store IS DISTINCT FROM false;

  IF n_gone > 15 AND NOT p_force THEN
    RAISE EXCEPTION '% plants would be marked no longer sold at once. Nothing saved. Re-run with force if that is real.', n_gone;
  END IF;

  IF NOT p_dry_run THEN
    UPDATE plants SET in_gardyn_store = false, gardyn_checked_at = today
     WHERE NOT (id::text = ANY (matched)) AND in_gardyn_store IS DISTINCT FROM false;
  END IF;

  report := jsonb_build_object('store_count', n_items, 'dry_run', p_dry_run,
    'added', added, 'no_longer_sold', gone, 'updated', updated, 'back_in_store', back);
  INSERT INTO catalog_sync_runs (dry_run, store_count, report) VALUES (p_dry_run, n_items, report);
  RETURN report;
END $$;

REVOKE ALL ON FUNCTION public.gardyn_catalog_sync(text, jsonb, boolean, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.gardyn_catalog_sync(text, jsonb, boolean, boolean) TO anon, authenticated;

COMMIT;
