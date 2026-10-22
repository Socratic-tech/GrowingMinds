import { supabase, REDIRECT_URL } from "../supabase/client";

// Shared password rules and the reset-email helper used by the login page,
// the Profile "Change password" form, and Admin → send reset email.

export const MIN_PASSWORD = 8;

export const RESET_REDIRECT = REDIRECT_URL.replace("/auth", "/reset-password");

/** Send Supabase's password-reset email to `email`. Returns { error }. */
export async function sendPasswordReset(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return { error: new Error("No email address on file.") };
  const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: RESET_REDIRECT });
  return { error };
}

/** Plain-language versions of Supabase's password errors. */
export function friendlyPasswordError(err) {
  const msg = err?.message || String(err || "");
  const code = err?.code || "";
  if (code === "same_password" || /different from the old/i.test(msg)) return "Your new password has to be different from your current one.";
  if (code === "weak_password" || (/password/i.test(msg) && /characters|short|weak/i.test(msg))) return `Please choose a stronger password (at least ${MIN_PASSWORD} characters).`;
  if (/after \d+ seconds|security purposes/i.test(msg)) return "A reset email was just sent. Please wait a minute before sending another.";
  if (/rate limit|too many/i.test(msg)) return "Too many emails or attempts right now. Please wait a few minutes and try again.";
  if (/reauthentication|reauthenticate/i.test(msg)) return "For security, please sign out and back in, then try again.";
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return "We couldn't reach the server. Check your internet connection and try again.";
  return msg || "Something went wrong. Please try again.";
}
