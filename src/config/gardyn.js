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
