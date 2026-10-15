import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "../supabase/client";
import { loadBetaFeatures } from "./beta";

// Multiple towers (admin switch 'multi_tower'; supabase_towers_custom_plants_2026-10.sql).
//
// A teacher's first tower is the "primary" one: its rows keep tower_id NULL,
// exactly like teachers without the feature. Extra towers have their own
// id. Everyone without the switch never sees any of this, and their
// queries are unchanged (no tower filter at all).
//
//   const t = useTowers(user.id);
//   t.scope(query)      -> adds the current tower's filter (or nothing)
//   t.stamp(row)        -> adds tower_id for inserts (or nothing)
//   t.current.name      -> "Library"

const VIRTUAL_PRIMARY = { id: null, rowId: null, is_primary: true, name: "Tower 1" };
const KEY = (uid) => `gm-tower-${uid}`;

const stores = new Map(); // uid -> { state, listeners, loading }

function store(uid) {
  if (!stores.has(uid)) {
    stores.set(uid, { state: { ready: false, enabled: false, towers: [VIRTUAL_PRIMARY], currentKey: "primary" }, listeners: new Set(), loading: null });
  }
  return stores.get(uid);
}
function emit(uid, patch) {
  const s = store(uid);
  s.state = { ...s.state, ...patch };
  s.listeners.forEach((l) => l());
}
const keyOf = (t) => (t.is_primary ? "primary" : t.id);

export async function reloadTowers(uid) {
  if (!uid) return;
  const s = store(uid);
  s.loading = (async () => {
    const features = await loadBetaFeatures(uid);
    if (!features.includes("multi_tower")) { emit(uid, { ready: true, enabled: false, towers: [VIRTUAL_PRIMARY], currentKey: "primary" }); return; }
    const { data, error } = await supabase.from("towers").select("*").eq("user_id", uid).order("sort_order").order("created_at");
    const rows = error ? [] : data || [];
    const primaryRow = rows.find((r) => r.is_primary);
    const towers = [
      primaryRow ? { id: null, rowId: primaryRow.id, is_primary: true, name: primaryRow.name } : VIRTUAL_PRIMARY,
      ...rows.filter((r) => !r.is_primary).map((r) => ({ id: r.id, rowId: r.id, is_primary: false, name: r.name })),
    ];
    let currentKey = "primary";
    try { currentKey = localStorage.getItem(KEY(uid)) || "primary"; } catch { /* ignore */ }
    if (!towers.some((t) => keyOf(t) === currentKey)) currentKey = "primary";
    emit(uid, { ready: true, enabled: true, towers, currentKey });
  })();
  return s.loading;
}

export function useTowers(uid) {
  const s = store(uid || "anon");
  const state = useSyncExternalStore(
    useCallback((cb) => { s.listeners.add(cb); return () => s.listeners.delete(cb); }, [s]),
    () => s.state,
  );
  useEffect(() => { if (uid && !s.state.ready && !s.loading) reloadTowers(uid); }, [uid, s]);

  const current = state.towers.find((t) => keyOf(t) === state.currentKey) || state.towers[0];
  const setCurrent = (t) => {
    try { localStorage.setItem(KEY(uid), keyOf(t)); } catch { /* ignore */ }
    emit(uid, { currentKey: keyOf(t) });
  };
  const scopeFor = (t) => (q) => (!state.enabled ? q : t.is_primary ? q.is("tower_id", null) : q.eq("tower_id", t.id));
  const stampFor = (t) => (row) => (!state.enabled ? row : { ...row, tower_id: t.is_primary ? null : t.id });

  return {
    ready: state.ready,
    enabled: state.enabled,
    towers: state.towers,
    current,
    currentKey: state.currentKey,
    setCurrent,
    scope: scopeFor(current),
    stamp: stampFor(current),
    scopeFor,
    stampFor,
    reload: () => reloadTowers(uid),
    /** Name of the tower a row belongs to (for "all towers" lists). */
    nameOf: (towerId) => (state.towers.find((t) => (towerId ? t.id === towerId : t.is_primary)) || VIRTUAL_PRIMARY).name,
  };
}
