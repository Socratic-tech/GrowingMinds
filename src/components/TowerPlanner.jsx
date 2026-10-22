import { useEffect, useMemo, useRef, useState } from "react";
import TowerView, { SUN_STRIPE } from "./TowerView";
import SeedBox from "./SeedBox";
import { LIGHT_ZONE_META, getSlotLightZone, getLightMatch, MATCH_COPY, MATCH_TEXT } from "../config/gardyn";
import { planTower } from "../utils/seedBox";
import { todayLocal } from "../utils/date";

// "Plan my tower" (admin switch 'custom_plants'): fills the open slots from
// the seed box by light, on the same tower picture as the Tracker. Tap two
// slots to swap them; tap a waiting pod, then a slot, to place it.

const isOpen = (s) => s && (!s.plant_name || s.status === "Empty");

export default function TowerPlanner({ userId, box, plants, plantMap, slots, onCustomAdded, onPlant, onClose }) {
  const openSlots = useMemo(() => Object.keys(slots).filter((id) => isOpen(slots[id])), [slots]);
  const [plan, setPlan] = useState({});
  const [waiting, setWaiting] = useState([]);
  const [picked, setPicked] = useState(null); // { slot } or { wait: index }
  const [date, setDate] = useState(todayLocal());
  const [saving, setSaving] = useState(false);
  const headingRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // A fresh suggestion whenever the seed box changes (manual swaps after that are kept).
  useEffect(() => {
    const r = planTower(openSlots, box.rows, plantMap);
    setPlan(r.plan); setWaiting(r.waiting); setPicked(null);
  }, [box.rows, openSlots.join(), plants]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);

  function place(slotId, name) {
    const next = { ...plan };
    const out = next[slotId];
    if (name) next[slotId] = name; else delete next[slotId];
    return [next, out];
  }

  function tapSlot(id) {
    if (!picked) return setPicked({ slot: id });
    if (picked.slot === id) return setPicked(null);
    if (picked.slot) {
      const a = plan[picked.slot], b = plan[id];
      const next = { ...plan };
      if (b) next[picked.slot] = b; else delete next[picked.slot];
      if (a) next[id] = a; else delete next[id];
      setPlan(next);
    } else {
      const name = waiting[picked.wait];
      const [next, out] = place(id, name);
      const w = waiting.filter((_, i) => i !== picked.wait);
      if (out) w.push(out);
      setPlan(next); setWaiting(w);
    }
    setPicked(null);
  }

  function tapWait(i) {
    if (picked?.slot) {
      const [next, out] = place(picked.slot, waiting[i]);
      const w = waiting.filter((_, j) => j !== i);
      if (out) w.push(out);
      setPlan(next); setWaiting(w); setPicked(null);
    } else setPicked(picked?.wait === i ? null : { wait: i });
  }

  function leaveEmpty() {
    const [next, out] = place(picked.slot, null);
    setPlan(next);
    if (out) setWaiting([...waiting, out]);
    setPicked(null);
  }

  function replan() {
    const r = planTower(openSlots, box.rows, plantMap);
    setPlan(r.plan); setWaiting(r.waiting); setPicked(null);
  }

  async function plantAll() {
    setSaving(true);
    await onPlant(plan, date);
    setSaving(false);
  }

  const planned = Object.keys(plan).length;
  const matchCounts = Object.entries(plan).reduce((acc, [id, name]) => {
    const m = getLightMatch(getSlotLightZone(id), plantMap[name]?.light_zone);
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const pickedName = picked?.slot ? plan[picked.slot] : picked ? waiting[picked.wait] : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="plan-heading"
        className="relative w-full md:max-w-4xl max-h-[92vh] overflow-y-auto bg-white border border-teal-200
                   rounded-t-3xl md:rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-fadeIn">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="plan-heading" ref={headingRef} tabIndex={-1} className="font-bold text-teal-800 text-lg focus:outline-none">🗼 Plan my tower</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {openSlots.length} open slot{openSlots.length === 1 ? "" : "s"} · {box.pods} yCube{box.pods === 1 ? "" : "s"} in your seed box.
              Each pod goes where its light fits best.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close planner"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-teal-700">✕</button>
        </div>

        <div className="grid md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-4 items-start">
          <SeedBox userId={userId} box={box} plants={plants} onCustomAdded={onCustomAdded} compact />

          <div className="space-y-3">
            <p className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" aria-live="polite">
              {pickedName
                ? <>Moving <b>{pickedName}</b>: tap another open slot to swap{picked?.slot ? <>, or <button type="button" onClick={leaveEmpty} className="underline font-semibold text-teal-800">leave this slot empty</button></> : ""}.</>
                : picked?.slot
                  ? <>Slot {picked.slot} selected: tap a planned slot or a waiting pod to put it here.</>
                  : <>Tap two slots to swap them. Tap a waiting pod, then a slot, to place it.</>}
            </p>

            <TowerView caption={false} renderSlot={(id, zoneMeta) => {
              const s = slots[id];
              const zone = getSlotLightZone(id);
              if (!isOpen(s)) {
                return (
                  <div className="w-full h-full min-h-[52px] flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 opacity-70"
                    aria-label={`Slot ${id}: ${s?.plant_name || "not set up"}, already growing`}>
                    <span className={`w-1.5 shrink-0 ${SUN_STRIPE[zone]}`} aria-hidden="true" />
                    <span className="flex-1 min-w-0 px-2 py-1">
                      <span className="block text-[10px] font-bold text-gray-500">{id} · growing</span>
                      <span className="block text-xs text-gray-600 leading-tight line-clamp-2">{s?.plant_name || "—"}</span>
                    </span>
                  </div>
                );
              }
              const name = plan[id];
              const match = name ? getLightMatch(zone, plantMap[name]?.light_zone) : null;
              const sel = picked?.slot === id;
              return (
                <button type="button" onClick={() => tapSlot(id)} aria-pressed={sel}
                  aria-label={`Slot ${id}, ${zoneMeta.label}: ${name ? `${name}, ${MATCH_COPY[match]}` : "leave empty"}`}
                  className={`w-full h-full min-h-[52px] text-left flex overflow-hidden rounded-xl border transition-all
                              focus-visible:ring-2 focus-visible:ring-teal-700
                              ${name ? "bg-teal-50 border-teal-300" : "bg-white border-dashed border-gray-300"}
                              ${sel ? "ring-2 ring-teal-600 shadow-md" : match === "poor" ? "ring-2 ring-red-300" : ""}`}>
                  <span className={`w-1.5 shrink-0 ${SUN_STRIPE[zone]}`} aria-hidden="true" />
                  <span className="flex-1 min-w-0 px-2 py-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-gray-500">{id}</span>
                      <span className={`text-[9px] font-bold uppercase ${zoneMeta.text}`}>{zoneMeta.short} sun</span>
                    </span>
                    <span className={`block text-xs sm:text-sm font-semibold leading-tight line-clamp-2 ${name ? "text-teal-900" : "text-gray-400"}`}>
                      {name || "Empty"}
                    </span>
                    {name && <span className={`block text-[9px] sm:text-[10px] font-bold uppercase truncate ${MATCH_TEXT[match]}`}>{MATCH_COPY[match]}</span>}
                  </span>
                </button>
              );
            }} />

            {waiting.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-bold text-amber-900">Waiting for a slot ({waiting.length})</p>
                <p className="text-[11px] text-amber-900">No open slot with the right light is left. They stay in your seed box, or tap one and then a slot to place it anyway.</p>
                <div className="flex flex-wrap gap-1.5">
                  {waiting.map((name, i) => {
                    const z = LIGHT_ZONE_META[plantMap[name]?.light_zone];
                    return (
                      <button key={`${name}-${i}`} type="button" onClick={() => tapWait(i)} aria-pressed={picked?.wait === i}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold bg-white border rounded-full px-2.5 py-1
                                    ${picked?.wait === i ? "border-teal-600 ring-2 ring-teal-600" : "border-amber-300"}`}>
                        <span className={`w-2 h-2 rounded-full ${z?.dot || "bg-gray-300"}`} aria-hidden="true" />{name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2 pt-1">
              <label className="text-xs font-semibold text-gray-600">Date planted
                <input type="date" value={date} max={todayLocal()} onChange={(e) => setDate(e.target.value)}
                  className="block mt-1 p-2 border border-gray-300 rounded-xl text-sm" />
              </label>
              <button type="button" onClick={plantAll} disabled={saving || planned === 0 || !date}
                className="flex-1 min-w-[10rem] bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                {saving ? "Planting…" : planned === 0 ? "Nothing to plant yet" : `🌱 Plant these ${planned}`}
              </button>
              <button type="button" onClick={replan} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">↺ Re-plan</button>
            </div>
            {planned > 0 && (
              <p className="text-[11px] text-gray-600">
                {[["best", "great light match"], ["okay", "usable"], ["unknown", "light not set"], ["poor", "light mismatch"]]
                  .filter(([k]) => matchCounts[k]).map(([k, t]) => `${matchCounts[k]} ${t}`).join(" · ")}
                . Planting sets each slot to Germinating and takes the pods out of your seed box.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
