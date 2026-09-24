import { supabase } from "../supabase/client";

// Event join codes (supabase_event_codes_2026-09.sql). An educator who
// enters a valid code, at sign-up or on the Pending page, is approved
// right away instead of waiting for an admin.

export const EVENT_CODE_MESSAGES = {
  approved: "You're in! Welcome to Growing Minds.",
  already: "Your account is already approved.",
  invalid: "That code didn't work. Check the spelling with your facilitator.",
  expired: "That event code has expired. An admin will approve you soon.",
  full: "That event code has been used up. An admin will approve you soon.",
  too_many: "Too many tries. Wait an hour, or ask your facilitator.",
  not_signed_in: "Sign in first, then enter the code.",
  no_profile: "Your account is still being set up. Try again in a moment.",
};

export const normalizeCode = (c) => (c || "").toUpperCase().replace(/\s+/g, "");

/** Returns one of the EVENT_CODE_MESSAGES keys, or "error". */
export async function redeemEventCode(code) {
  const c = normalizeCode(code);
  if (!c) return "invalid";
  const { data, error } = await supabase.rpc("redeem_event_code", { p_code: c });
  if (error) return "error";
  return data || "error";
}
