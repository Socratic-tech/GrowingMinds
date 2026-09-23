// Local-calendar date helpers.
//
// Why this exists: `new Date().toISOString().slice(0, 10)` gives the *UTC*
// date, so after 8pm in Michigan (EDT) it returns tomorrow. And
// `new Date("2026-09-23")` is parsed as UTC midnight, which displays as
// Sep 22 in any US timezone. Every "YYYY-MM-DD" date column in this app
// (planted_date, last_completed, harvest_date, ...) is a plain calendar date
// with no time, so always read/write it with these helpers instead.

/** Today's date in the user's local timezone as "YYYY-MM-DD". */
export function todayLocal() {
  return toLocalISODate(new Date());
}

/** Format a Date as local "YYYY-MM-DD". */
export function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse "YYYY-MM-DD" (or a longer ISO string - only the date part is used)
 * as a local-midnight Date. Returns null for empty/invalid input.
 */
export function parseLocalDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d) ? null : d;
}

/** Add whole calendar days (DST-safe, unlike adding 86_400_000 ms). */
export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole calendar days from a to b (b - a). DST-safe. */
export function daysBetween(a, b) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** True for a well-formed "YYYY-MM-DD" with a sane year. */
export function isValidDateString(s, { minYear = 2020, allowFuture = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false;
  const d = parseLocalDate(s);
  if (!d || d.getFullYear() < minYear) return false;
  if (!allowFuture && daysBetween(new Date(), d) > 0) return false;
  return true;
}

/** "Sep 23" / "Sep 23, 2026" style display for a "YYYY-MM-DD" string. */
export function formatLocalDate(s, opts = { month: "short", day: "numeric" }) {
  const d = parseLocalDate(s);
  return d ? d.toLocaleDateString("en-US", opts) : "";
}
