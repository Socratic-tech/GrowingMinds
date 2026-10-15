import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase/client";
import TowerView, { SUN_STRIPE } from "../components/TowerView";
import { getSlotLightZone } from "../config/gardyn";

// Student data station (beta). A classroom tablet opens
//   …/GrowingMinds/#/station?code=ABC234
// No student logins: the class code lets students pick a planted slot and
// log height, leaf count and a note. Everything goes through
// station_info / station_submit (supabase_beta_wave2_2026-10.sql).
const CODE_KEY = "gm-station-code";
const TEAM_KEY = "gm-station-team";
const store = {
  get: (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* private mode */ } },
};
const clean = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
const ERRORS = {
  code: "That class code isn't working. Ask your teacher.",
  slot: "That spot doesn't have a plant right now. Pick another one.",
  empty: "Add a height, a leaf count, or a note first.",
  range: "That number looks too big. Check your measurement.",
  limit: "Your class has added lots of data today! Try again tomorrow.",
};

export default function Station() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(() => clean(params.get("code")) || store.get(CODE_KEY));
  const [typed, setTyped] = useState("");
  const [info, setInfo] = useState(null);      // { ok, label, slots }
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [height, setHeight] = useState("");
  const [leaves, setLeaves] = useState(0);
  const [note, setNote] = useState("");
  const [team, setTeam] = useState(() => store.get(TEAM_KEY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    supabase.rpc("station_info", { p_code: code }).then(({ data, error: e }) => {
      setLoading(false);
      if (e || !data?.ok) { setInfo({ ok: false }); return; }
      setInfo(data);
      store.set(CODE_KEY, code);
      if (params.get("code")) setParams({}, { replace: true }); // keep the code off the screen
    });
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const planted = new Map((info?.slots || []).map((s) => [s.slot_id, s]));

  function reset() { setSlot(null); setHeight(""); setLeaves(0); setNote(""); setError(""); setDone(false); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const h = height === "" ? null : Number(height);
    if (h == null && !leaves && !note.trim()) { setError(ERRORS.empty); return; }
    setSaving(true);
    const { data, error: err } = await supabase.rpc("station_submit", {
      p_code: code, p_slot_id: slot.slot_id, p_height_cm: h, p_leaf_count: leaves || null,
      p_note: note.trim() || null, p_team: team.trim() || null,
    });
    setSaving(false);
    if (err || !data?.ok) { setError(ERRORS[data?.error] || "Something went wrong. Try again."); return; }
    store.set(TEAM_KEY, team.trim());
    setDone(true);
  }

  const shell = (children) => (
    <div className="min-h-screen bg-teal-50 px-4 py-6" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Growing Minds · Plant scientist station</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-teal-900">{info?.ok && info.label ? info.label : "Our tower"}</h1>
          </div>
          <span aria-hidden="true" className="text-4xl">🔬</span>
        </header>
        {children}
      </div>
    </div>
  );

  // 1. Enter the class code
  if (!code || info?.ok === false) {
    return shell(
      <form className="bg-white rounded-3xl border-2 border-teal-200 p-6 space-y-4"
            onSubmit={(e) => { e.preventDefault(); setInfo(null); setCode(clean(typed)); }}>
        <label htmlFor="class-code" className="block text-xl font-bold text-gray-900">Type your class code</label>
        {info?.ok === false && <p role="alert" className="text-base font-semibold text-red-800 bg-red-50 rounded-xl px-4 py-3">{ERRORS.code}</p>}
        <input id="class-code" value={typed} onChange={(e) => setTyped(clean(e.target.value))} autoComplete="off" autoCapitalize="characters"
          className="w-full text-center text-4xl tracking-[0.4em] font-bold border-2 border-gray-300 rounded-2xl py-4 uppercase" maxLength={6} />
        <button type="submit" disabled={typed.length !== 6} className="w-full bg-teal-700 text-white text-xl font-bold rounded-2xl py-4 disabled:opacity-40">Go</button>
      </form>
    );
  }

  if (loading || !info) return shell(<p className="text-lg text-gray-700">Loading your tower…</p>);

  // 3. Saved
  if (done) {
    return shell(
      <div className="bg-white rounded-3xl border-2 border-emerald-300 p-8 text-center space-y-4" role="status">
        <p className="text-6xl" aria-hidden="true">🎉</p>
        <p className="text-2xl font-bold text-emerald-900">Great data, scientist!</p>
        <p className="text-lg text-gray-700">Your measurement of <b>{slot.plant_name}</b> in {slot.slot_id} is saved.</p>
        <button type="button" onClick={reset} className="w-full bg-teal-700 text-white text-xl font-bold rounded-2xl py-4">Measure another plant</button>
      </div>
    );
  }

  // 2b. Measure a plant
  if (slot) {
    const stepBtn = "w-16 h-16 rounded-2xl border-2 border-gray-300 bg-white text-3xl font-bold text-gray-800 active:bg-gray-100";
    return shell(
      <form onSubmit={submit} className="bg-white rounded-3xl border-2 border-teal-200 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className={`w-3 self-stretch rounded-full ${SUN_STRIPE[getSlotLightZone(slot.slot_id)]}`} aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-gray-500">Spot {slot.slot_id}</p>
            <p className="text-2xl font-bold text-gray-900">{slot.plant_name}</p>
          </div>
        </div>

        <div>
          <label htmlFor="h" className="block text-lg font-bold text-gray-900">How tall is it? <span className="font-normal text-gray-600">(centimeters)</span></label>
          <p className="text-sm text-gray-600">Measure from the top of the pod to the tallest leaf.</p>
          <input id="h" type="number" inputMode="decimal" min="0" max="300" step="0.5" value={height} onChange={(e) => setHeight(e.target.value)}
            className="mt-2 w-40 text-3xl font-bold border-2 border-gray-300 rounded-2xl px-4 py-3" placeholder="0" />
        </div>

        <div>
          <p id="leaves-label" className="text-lg font-bold text-gray-900">How many leaves?</p>
          <div className="mt-2 flex items-center gap-4" role="group" aria-labelledby="leaves-label">
            <button type="button" className={stepBtn} onClick={() => setLeaves((n) => Math.max(0, n - 1))} aria-label="One fewer leaf">−</button>
            <output className="w-20 text-center text-4xl font-bold text-gray-900" aria-live="polite">{leaves}</output>
            <button type="button" className={stepBtn} onClick={() => setLeaves((n) => Math.min(999, n + 1))} aria-label="One more leaf">+</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-lg font-bold text-gray-900">What do you notice? <span className="font-normal text-gray-600">(optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} className="mt-2 w-full text-lg border-2 border-gray-300 rounded-2xl px-4 py-3" placeholder="New leaves! A flower bud!" />
          </label>
          <label className="block text-lg font-bold text-gray-900">Your team <span className="font-normal text-gray-600">(optional)</span>
            <input value={team} onChange={(e) => setTeam(e.target.value)} maxLength={40} className="mt-2 w-full text-lg border-2 border-gray-300 rounded-2xl px-4 py-3" placeholder="Team Basil" />
          </label>
        </div>
        <p className="text-sm text-gray-600">Use a team name, not your real name.</p>

        {error && <p role="alert" className="text-base font-semibold text-red-800 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={reset} className="px-6 py-4 rounded-2xl border-2 border-gray-300 text-lg font-bold text-gray-700">Back</button>
          <button type="submit" disabled={saving} className="flex-1 bg-teal-700 text-white text-xl font-bold rounded-2xl py-4 disabled:opacity-50">{saving ? "Saving…" : "Save my data"}</button>
        </div>
      </form>
    );
  }

  // 2a. Pick a plant on the tower
  return shell(
    <>
      <div className="bg-white rounded-3xl border-2 border-teal-200 p-4 space-y-3">
        <p className="text-xl font-bold text-gray-900 text-center">Tap the plant you measured</p>
        {planted.size === 0 ? (
          <p className="text-center text-gray-600">No plants are in the tower yet. Ask your teacher to add them in the Tracker.</p>
        ) : (
          <TowerView
            caption={false}
            renderSlot={(id, m) => {
              const s = planted.get(id);
              return s ? (
                <button type="button" onClick={() => setSlot(s)}
                  className="w-full h-full min-h-[60px] flex overflow-hidden rounded-xl border-2 border-teal-300 bg-teal-50 text-left active:bg-teal-100 focus-visible:ring-4 focus-visible:ring-teal-400">
                  <span className={`w-2 shrink-0 ${SUN_STRIPE[getSlotLightZone(id)]}`} aria-hidden="true" />
                  <span className="px-2 py-1.5">
                    <span className="block text-xs font-bold text-gray-500">{id}</span>
                    <span className="block text-sm sm:text-base font-bold text-teal-900 leading-tight">{s.plant_name}</span>
                  </span>
                </button>
              ) : (
                <div className="w-full h-full min-h-[60px] rounded-xl border border-dashed border-gray-300 bg-white/60 px-2 py-1.5">
                  <span className="block text-xs font-bold text-gray-400">{id}</span>
                  <span className="sr-only">empty, {m.label}</span>
                </div>
              );
            }}
          />
        )}
      </div>
      <button type="button" onClick={() => { store.set(CODE_KEY, ""); setCode(""); setInfo(null); setTyped(""); }}
        className="text-sm text-gray-600 underline">This isn't our tower</button>
    </>
  );
}
