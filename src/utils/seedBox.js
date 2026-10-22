import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { SLOT_IDS, LIGHT_ZONE_META, getSlotLightZone, getLightMatch } from "../config/gardyn";

// Seed box (admin switch 'custom_plants'; supabase_seed_box_2026-10.sql):
// the yCubes a teacher has on hand. "Plan my tower" places them in the
// empty slots by light. One box per teacher, shared by all their towers.

const missingTable = (e) => /seed_box|does not exist|could not find the table/i.test(e?.message || "") || e?.code === "42P01" || e?.code === "PGRST205";

export function useSeedBox(userId, enabled) {
  const [rows, setRows] = useState([]);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled || !userId) { setRows([]); return; }
    const { data, error: e } = await supabase.from("seed_box").select("*").eq("user_id", userId).order("created_at");
    if (e) { setMissing(missingTable(e)); setError(e.message); setRows([]); return; }
    setMissing(false); setError(null);
    setRows(data || []);
  }, [enabled, userId]);
  useEffect(() => { reload(); }, [reload]);

  /** Set a plant's count (0 removes it). Returns an error message or null. */
  const setQty = useCallback(async (name, qty) => {
    const row = rows.find((r) => r.plant_name === name);
    const q = Math.max(0, Math.min(99, Math.round(qty)));
    let res;
    if (q === 0) res = row ? await supabase.from("seed_box").delete().eq("id", row.id) : { error: null };
    else if (row) res = await supabase.from("seed_box").update({ qty: q }).eq("id", row.id);
    else res = await supabase.from("seed_box").insert({ user_id: userId, plant_name: name, qty: q });
    await reload();
    return res.error ? res.error.message : null;
  }, [rows, userId, reload]);

  const add = useCallback((name, n = 1) => setQty(name, (rows.find((r) => r.plant_name === name)?.qty || 0) + n), [rows, setQty]);

  /** Take planted pods out of the box: { [plant name]: how many }. */
  const consume = useCallback(async (used) => {
    await Promise.all(Object.entries(used).map(([name, n]) => {
      const row = rows.find((r) => r.plant_name === name);
      if (!row) return null;
      return row.qty - n > 0
        ? supabase.from("seed_box").update({ qty: row.qty - n }).eq("id", row.id)
        : supabase.from("seed_box").delete().eq("id", row.id);
    }));
    await reload();
  }, [rows, reload]);

  const pods = rows.reduce((n, r) => n + r.qty, 0);
  return { enabled, rows, pods, missing, error, reload, setQty, add, consume };
}

const rank = (zone) => LIGHT_ZONE_META[zone]?.rank;

/**
 * Suggested layout: the seed box's pods in the open slots, best light
 * first. Pass 1 puts each pod in a slot of its own light zone; pass 2 in
 * the nearest zone (a medium plant tries high before low); plants with no
 * light zone then take what's left, medium first. Pods that would only get
 * a light mismatch, or don't fit, come back as `waiting`.
 * Returns { plan: { [slot id]: plant name }, waiting: [plant name] }.
 */
export function planTower(openSlots, rows, plantMap) {
  const free = SLOT_IDS.filter((id) => openSlots.includes(id));
  const take = (test) => { const i = free.findIndex(test); return i < 0 ? null : free.splice(i, 1)[0]; };
  const plan = {};
  let pods = rows.flatMap((r) => Array(r.qty).fill(r.plant_name));

  const pass = (pick) => {
    const left = [];
    for (const name of pods) {
      const slot = pick(plantMap[name]?.light_zone);
      if (slot) plan[slot] = name; else left.push(name);
    }
    pods = left;
  };
  pass((z) => rank(z) && take((id) => getSlotLightZone(id) === z));
  pass((z) => rank(z) && (take((id) => rank(getSlotLightZone(id)) === rank(z) + 1) || take((id) => rank(getSlotLightZone(id)) === rank(z) - 1)));
  pass((z) => !rank(z) && (take((id) => rank(getSlotLightZone(id)) === 2) || take(() => true)));
  return { plan, waiting: pods };
}

/** Seed box plants for one slot, best light match first. */
const MATCH_ORDER = { best: 0, okay: 1, unknown: 2, poor: 3 };
export function rankForSlot(slotId, rows, plantMap) {
  const zone = getSlotLightZone(slotId);
  return rows
    .map((r) => ({ ...r, match: getLightMatch(zone, plantMap[r.plant_name]?.light_zone) }))
    .sort((a, b) => MATCH_ORDER[a.match] - MATCH_ORDER[b.match] || a.plant_name.localeCompare(b.plant_name));
}
