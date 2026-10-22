-- =====================================================================
-- Growing Minds · new key for the weekly Gardyn catalog sync
-- Run once in the SQL Editor (needs supabase_gardyn_sync_2026-09.sql).
--
-- The old scheduled task was gone, and its plain key with it, so the
-- sync was recreated (Oct 2026) with a new key. The plain key lives only
-- on John's Mac in ~/.config/growingminds/gardyn-sync-key; this stores
-- its hash and retires the old one.
--
-- To turn the weekly sync off later:  DELETE FROM catalog_sync_keys;
-- =====================================================================

BEGIN;

DELETE FROM public.catalog_sync_keys
WHERE key_hash <> '6b142ee6bb272db7af339c2b23dff7f3549600e38d6c1a1c665e996c52d5533a';

INSERT INTO public.catalog_sync_keys (key_hash, label)
VALUES ('6b142ee6bb272db7af339c2b23dff7f3549600e38d6c1a1c665e996c52d5533a', 'Claude weekly scheduled task (Oct 2026)')
ON CONFLICT (key_hash) DO NOTHING;

SELECT label, created_at FROM public.catalog_sync_keys;

COMMIT;
