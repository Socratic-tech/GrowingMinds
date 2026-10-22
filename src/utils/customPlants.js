import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client";

// Custom plants (every approved teacher, since Oct 2026): a teacher's own
// plants, private to them. They behave like catalog plants everywhere (picker,
// light match, harvest dates, coaching) and carry `custom: true`.
// A custom plant whose name now matches a catalog plant is hidden, so an
// approved suggestion never shows up twice.

const norm = (s) => String(s || "").trim().toLowerCase();

export function useCustomPlants(userId) {
  const enabled = Boolean(userId);
  const [rows, setRows] = useState([]);
  const reload = useCallback(async () => {
    if (!enabled || !userId) { setRows([]); return; }
    const { data, error } = await supabase.from("custom_plants").select("*").eq("user_id", userId).order("name");
    setRows(error ? [] : data || []);
  }, [enabled, userId]);
  useEffect(() => { reload(); }, [reload]);
  return { enabled, customPlants: rows, reload };
}

/** Catalog plants + this teacher's custom plants (custom marked, de-duplicated). */
export function mergePlants(catalog, custom) {
  const names = new Set((catalog || []).map((p) => norm(p.name)));
  const extra = (custom || [])
    .filter((c) => !names.has(norm(c.name)))
    .map((c) => ({ ...c, custom: true, in_gardyn_store: null }));
  return [...(catalog || []), ...extra];
}

export const CUSTOM_CATEGORIES = ["Greens", "Herbs", "Fruits & Veggies", "Flowers"];
