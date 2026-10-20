// Shared display helpers for the plants table, used by the Plant Library
// and the printable Plant Guide.

/* ─── Light zones ────────────────────────────────────────── */
export const ZONE_META = {
  "Yellow (Low)":  { label: "Yellow · Low",  dot: "bg-yellow-400", text: "text-yellow-800", bg: "bg-yellow-50 border-yellow-200" },
  "Orange (Med)":  { label: "Orange · Med",  dot: "bg-orange-400", text: "text-orange-800", bg: "bg-orange-50 border-orange-200" },
  "Red (High)":    { label: "Red · High",    dot: "bg-red-400",    text: "text-red-800",    bg: "bg-red-50   border-red-200"    },
};

/* ─── Categories ─────────────────────────────────────────── */
// Categories match the Gardyn store (supabase_plants_gardyn_2026-09.sql).
// Old names are kept in the icon map in case a row wasn't migrated.
export const CATEGORY_ICONS = {
  Greens:             "🥬",
  Herbs:              "🌿",
  "Fruits & Veggies": "🍅",
  Flowers:            "🌸",
  Herb:     "🌿",
  Fruiting: "🍅",
  Flower:   "🌸",
};

export const CATEGORY_ORDER = ["Greens", "Herbs", "Fruits & Veggies", "Flowers"];

// Map legacy category names onto the current Gardyn store names.
const LEGACY_CATEGORY = { Herb: "Herbs", Fruiting: "Fruits & Veggies", Flower: "Flowers" };
export const normalizeCategory = (c) => LEGACY_CATEGORY[c] || c || "Other";

export const gardynUrl = (handle) => `https://mygardyn.com/products/${encodeURIComponent(handle)}`;

/* ─── Skill level (Gardyn's "care level") ────────────────── */
// Gardyn rates yCubes Beginner / Intermediate / Expert. We show Expert as
// "Advanced" to match the Learn guide levels.
export const SKILLS = {
  beginner:     { label: "Beginner",     icon: "🌱", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  intermediate: { label: "Intermediate", icon: "🌿", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  advanced:     { label: "Advanced",     icon: "🌳", badge: "bg-purple-50 text-purple-800 border-purple-200" },
};

export function skillOf(p) {
  const c = String(p.care_level || "").trim().toLowerCase();
  if (c.startsWith("begin") || c === "easy") return "beginner";
  if (c.startsWith("inter") || c === "medium") return "intermediate";
  if (c.startsWith("expert") || c.startsWith("adv") || c === "hard") return "advanced";
  return null;
}
