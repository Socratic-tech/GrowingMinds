-- =====================================================================
-- Growing Minds · Event join codes
-- ---------------------------------------------------------------------
-- Lets educators at a training (e.g. Tuesday's PD) approve themselves by
-- entering a code the facilitator shows on screen, instead of waiting
-- for an admin. Admins create codes in Admin -> Codes, each with an
-- optional expiry and use limit, and can switch a code off any time.
--
-- Safety:
--   * Only admins can see or manage codes (RLS).
--   * Educators can't approve themselves directly (the Aug 20 rule on
--     profiles still blocks that). The only way in is redeem_event_code(),
--     which checks the code, its expiry and its limit.
--   * Wrong guesses are slowed down and capped at 10 per hour per person.
--   * Every redemption is recorded (who, which code, when).
-- Safe to re-run.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_codes (
  code        text PRIMARY KEY CHECK (code ~ '^[A-Z0-9-]{4,32}$'),
  label       text CHECK (length(coalesce(label, '')) <= 120),
  active      boolean NOT NULL DEFAULT true,
  expires_at  timestamptz,
  max_uses    integer CHECK (max_uses IS NULL OR max_uses > 0),
  uses        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS public.event_code_redemptions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL,
  user_id     uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_code_attempts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL,
  tried_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_code_attempts_user_idx ON public.event_code_attempts (user_id, tried_at DESC);

ALTER TABLE public.event_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_code_attempts    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_codes_admin_all        ON public.event_codes;
DROP POLICY IF EXISTS event_code_redemptions_admin ON public.event_code_redemptions;
CREATE POLICY event_codes_admin_all ON public.event_codes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY event_code_redemptions_admin ON public.event_code_redemptions
  FOR SELECT TO authenticated USING (public.is_admin());
-- event_code_attempts: no policies = nobody reads it through the API.

CREATE OR REPLACE FUNCTION public.redeem_event_code(p_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid   uuid := auth.uid();
  c     text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  ec    event_codes%ROWTYPE;
  prof  profiles%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN 'not_signed_in'; END IF;

  SELECT * INTO prof FROM profiles WHERE id = uid;
  IF NOT FOUND THEN RETURN 'no_profile'; END IF;
  IF prof.is_approved OR prof.role = 'admin' THEN RETURN 'already'; END IF;

  IF (SELECT count(*) FROM event_code_attempts
      WHERE user_id = uid AND tried_at > now() - interval '1 hour') >= 10 THEN
    RETURN 'too_many';
  END IF;

  SELECT * INTO ec FROM event_codes WHERE code = c FOR UPDATE;
  IF NOT FOUND OR NOT ec.active THEN
    INSERT INTO event_code_attempts (user_id) VALUES (uid);
    PERFORM pg_sleep(1);
    RETURN 'invalid';
  END IF;
  IF ec.expires_at IS NOT NULL AND ec.expires_at < now() THEN RETURN 'expired'; END IF;
  IF ec.max_uses IS NOT NULL AND ec.uses >= ec.max_uses THEN RETURN 'full'; END IF;

  UPDATE profiles SET is_approved = true WHERE id = uid;
  UPDATE event_codes SET uses = uses + 1 WHERE code = c;
  INSERT INTO event_code_redemptions (code, user_id) VALUES (c, uid);
  RETURN 'approved';
END $$;

REVOKE ALL ON FUNCTION public.redeem_event_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_event_code(text) TO authenticated;

COMMIT;

-- Tuesday's code (or create it in Admin -> Codes instead). Expires at
-- midnight Wednesday Eastern; up to 60 people.
-- INSERT INTO public.event_codes (code, label, expires_at, max_uses)
-- VALUES ('GROW2026', 'Growing Minds PD - Tuesday', '2026-09-30 04:00:00+00', 60);
