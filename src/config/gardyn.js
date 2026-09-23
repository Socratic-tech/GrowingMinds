// Gardyn Studio layout: 2 columns (A, B) × 8 slots each = 16 slots,
// numbered top to bottom. Change it here only; the Tracker, Harvest Log
// and Gardyn dashboard all read from this file.
export const GARDYN_MODEL   = "Gardyn Studio";
export const GARDYN_COLUMNS = ["A", "B"];
export const GARDYN_ROWS    = [1, 2, 3, 4, 5, 6, 7, 8];
export const SLOT_IDS       = GARDYN_COLUMNS.flatMap((c) => GARDYN_ROWS.map((r) => `${c}${r}`));
export const SLOT_COUNT     = SLOT_IDS.length;

const VALID = new Set(SLOT_IDS);
export const isValidSlotId = (id) => VALID.has(id);

/* ─── Light zones ─────────────────────────────────────────
   From the Gardyn light image (John, May 2026). Row 1 is the TOP of the
   column, row 8 the BOTTOM. Keys match plants.light_zone values. */
export const LIGHT_ZONE_META = {
  "Yellow (Low)": { label: "Low Sun",    short: "Low",  rank: 1, dot: "bg-yellow-400", text: "text-yellow-800", badge: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  "Orange (Med)": { label: "Medium Sun", short: "Med",  rank: 2, dot: "bg-orange-400", text: "text-orange-800", badge: "bg-orange-50 border-orange-200 text-orange-800" },
  "Red (High)":   { label: "High Sun",   short: "High", rank: 3, dot: "bg-red-500",    text: "text-red-800",    badge: "bg-red-50 border-red-200 text-red-800" },
};

export const SLOT_LIGHT_ZONES = {
  A1: "Yellow (Low)", A2: "Orange (Med)", A3: "Orange (Med)", A4: "Orange (Med)",
  A5: "Red (High)",   A6: "Red (High)",   A7: "Red (High)",   A8: "Orange (Med)",
  B1: "Yellow (Low)", B2: "Orange (Med)", B3: "Orange (Med)", B4: "Red (High)",
  B5: "Orange (Med)", B6: "Red (High)",   B7: "Orange (Med)", B8: "Orange (Med)",
};

export function getSlotLightZone(slotId) {
  return SLOT_LIGHT_ZONES[slotId] || "Orange (Med)";
}

/** "best" (same zone), "okay" (one step off), "poor", or "unknown". */
export function getLightMatch(slotZone, plantZone) {
  const a = LIGHT_ZONE_META[slotZone]?.rank;
  const b = LIGHT_ZONE_META[plantZone]?.rank;
  if (!a || !b) return "unknown";
  if (a === b) return "best";
  return Math.abs(a - b) === 1 ? "okay" : "poor";
}

export const MATCH_COPY = {
  best: "Great light match",
  okay: "Usable, not ideal",
  poor: "Light mismatch",
  unknown: "Light unknown",
};

export const MATCH_TEXT = {
  best: "text-green-700",
  okay: "text-amber-700",
  poor: "text-red-700",
  unknown: "text-gray-500",
};

export const MATCH_BOX = {
  best: "bg-green-50 border-green-200 text-green-800",
  okay: "bg-amber-50 border-amber-200 text-amber-800",
  poor: "bg-red-50 border-red-200 text-red-800",
  unknown: "bg-gray-50 border-gray-200 text-gray-600",
};
