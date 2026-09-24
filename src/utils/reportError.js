import { supabase } from "../supabase/client";

// Quietly records problems educators hit (failed saves, failed loads,
// crashes) in the client_errors table so admins see them in
// Admin → Problems. Never throws, never shows anything to the user, and
// skips repeats so one broken page can't flood the log.
//
// Needs supabase_admin_tools_2026-09.sql; until that has run the insert
// just fails silently.

const recent = new Map(); // key -> last sent (ms)
const REPEAT_WINDOW_MS = 60_000;
const MAX_PER_SESSION = 40;
let sent = 0;

const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

function currentPage() {
  // HashRouter: the route lives after "#".
  return clip((window.location.hash || "#/").slice(1).split("?")[0] || "/", 300);
}

export async function reportError(action, error, details) {
  try {
    if (typeof window === "undefined" || sent >= MAX_PER_SESSION) return;
    const message =
      typeof error === "string" ? error : error?.message || error?.error_description || String(error ?? "");
    const key = `${action}|${message}`;
    const now = Date.now();
    if (now - (recent.get(key) || 0) < REPEAT_WINDOW_MS) return;
    recent.set(key, now);

    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (!uid) return; // the log only accepts signed-in educators

    sent += 1;
    const extra = {
      ...(details || {}),
      ...(error && typeof error === "object" && error.code ? { code: error.code } : {}),
      ...(error && typeof error === "object" && error.hint ? { hint: clip(error.hint, 300) } : {}),
      ...(error && typeof error === "object" && error.details ? { db: clip(error.details, 500) } : {}),
    };
    await supabase.from("client_errors").insert({
      user_id: uid,
      page: currentPage(),
      action: clip(action, 300),
      message: clip(message, 2000),
      details: Object.keys(extra).length ? extra : null,
      user_agent: clip(navigator.userAgent, 400),
    });
  } catch {
    /* reporting must never break the app */
  }
}

let installed = false;
export function installGlobalErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    reportError("Page error", e.error || e.message, { source: clip(e.filename, 200), line: e.lineno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    reportError("Unhandled promise", e.reason);
  });
}
