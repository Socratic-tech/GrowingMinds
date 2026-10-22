import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useToast } from "./ui/toast";
import { LIGHT_ZONE_META } from "../config/gardyn";
import { CUSTOM_CATEGORIES } from "../utils/customPlants";

// "My seed box" (every approved teacher): the yCubes a teacher has on
// hand. One search box picks a catalog plant, or adds a new one as the
// teacher's own plant right there. Used on the Plants tab and inside the
// Tracker's "Plan my tower".

const norm = (s) => String(s || "").trim().toLowerCase();

export default function SeedBox({ userId, box, plants, onCustomAdded, planLink = false, compact = false }) {
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPlant, setNewPlant] = useState(null); // { name, light_zone, category } while adding one

  const plantMap = useMemo(() => Object.fromEntries(plants.map((p) => [p.name, p])), [plants]);
  const matches = useMemo(() => {
    const s = norm(q);
    if (!s) return [];
    return plants.filter((p) => norm(p.name).includes(s))
      .sort((a, b) => norm(a.name).indexOf(s) - norm(b.name).indexOf(s) || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [q, plants]);
  const exact = plants.some((p) => norm(p.name) === norm(q));

  async function run(fn) {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) showToast({ title: "Couldn't update your seed box", description: err, type: "error" });
    return !err;
  }

  async function pick(name) {
    if (await run(() => box.add(name))) setQ("");
  }

  async function addNew(e) {
    e.preventDefault();
    const name = newPlant.name.trim();
    if (!name) return;
    setBusy(true);
    const { error } = await supabase.from("custom_plants").insert({
      user_id: userId, name, category: newPlant.category, light_zone: newPlant.light_zone || null,
    });
    setBusy(false);
    if (error && !/duplicate/i.test(error.message)) {
      return showToast({ title: "Couldn't add the plant", description: error.message, type: "error" });
    }
    await onCustomAdded?.();
    if (await run(() => box.add(name))) {
      showToast({ title: `🌱 ${name} added to your plants and seed box`, type: "success" });
      setNewPlant(null); setQ("");
    }
  }

  if (box.missing) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900" role="status">
        <b>🧺 Seed box isn't set up yet.</b> A Growing Minds admin needs to run <code>supabase_seed_box_2026-10.sql</code> in Supabase.
      </section>
    );
  }

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white";

  return (
    <section aria-labelledby="seed-box" className={`bg-white border border-teal-200 rounded-2xl space-y-3 ${compact ? "p-3" : "p-4 shadow-sm"}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="seed-box" className="font-bold text-teal-800">
          🧺 My seed box <span className="text-xs font-normal text-gray-500">({box.pods} yCube{box.pods === 1 ? "" : "s"})</span>
        </h2>
        {planLink && box.pods > 0 && (
          <Link to="/tracker?plan=1" className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-1.5">
            🗼 Plan my tower →
          </Link>
        )}
      </div>
      {!compact && (
        <p className="text-xs text-gray-600">The yCubes you have on hand. "Plan my tower" in the Tracker puts them in your open slots by light.</p>
      )}

      {/* One search: pick from the list, or add your own */}
      <div className="relative">
        <input
          type="search" value={q} onChange={(e) => { setQ(e.target.value); setNewPlant(null); }}
          placeholder="Add a yCube: type a plant name…" aria-label="Add a plant to your seed box"
          className={input} maxLength={60}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { e.preventDefault(); pick(matches[0].name); } }}
        />
        {q.trim() && !newPlant && (
          <ul className="mt-1 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden" role="listbox" aria-label="Matching plants">
            {matches.map((p) => {
              const z = LIGHT_ZONE_META[p.light_zone];
              return (
                <li key={p.name}>
                  <button type="button" disabled={busy} onClick={() => pick(p.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 flex items-center gap-2 disabled:opacity-50">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${z?.dot || "bg-gray-300"}`} aria-hidden="true" />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-[11px] text-gray-500">{z ? z.label : "Light not set"}{p.custom ? " · yours" : ""}</span>
                  </button>
                </li>
              );
            })}
            {!exact && (
              <li>
                <button type="button" onClick={() => setNewPlant({ name: q.trim(), light_zone: "", category: "Greens" })}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">
                  + Add “{q.trim()}” as your own plant
                </button>
              </li>
            )}
          </ul>
        )}
        {newPlant && (
          <form onSubmit={addNew} className="mt-2 grid grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="col-span-2 text-xs font-bold text-gray-700">New plant: {newPlant.name}</p>
            <label className="text-xs font-semibold text-gray-600">Light it needs
              <select value={newPlant.light_zone} onChange={(e) => setNewPlant({ ...newPlant, light_zone: e.target.value })} className={input}>
                <option value="">Not sure</option>
                {Object.entries(LIGHT_ZONE_META).map(([z, m]) => <option key={z} value={z}>{m.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600">Category
              <select value={newPlant.category} onChange={(e) => setNewPlant({ ...newPlant, category: e.target.value })} className={input}>
                {CUSTOM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={busy} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-50">Add to seed box</button>
              <button type="button" onClick={() => setNewPlant(null)} className="text-sm underline text-gray-700">Cancel</button>
            </div>
            <p className="col-span-2 text-[11px] text-gray-500">Days to sprout and harvest can be added later under 🪴 My plants.</p>
          </form>
        )}
      </div>

      {/* What's in the box */}
      {box.rows.length === 0 ? (
        <p className="text-xs text-gray-500">Empty. Add the yCubes you have, then plan your tower.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {box.rows.map((r) => {
            const z = LIGHT_ZONE_META[plantMap[r.plant_name]?.light_zone];
            return (
              <li key={r.id} className="py-1.5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${z?.dot || "bg-gray-300"}`} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">{r.plant_name}</span>
                  <span className="block text-[11px] text-gray-500">{z ? z.label : "Light not set"}</span>
                </span>
                <span className="flex items-center gap-1" role="group" aria-label={`How many ${r.plant_name}`}>
                  <button type="button" disabled={busy} onClick={() => run(() => box.setQty(r.plant_name, r.qty - 1))}
                    aria-label={r.qty === 1 ? `Remove ${r.plant_name}` : `One less ${r.plant_name}`}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{r.qty === 1 ? "✕" : "−"}</button>
                  <span className="w-7 text-center text-sm font-bold text-gray-800" aria-live="polite">{r.qty}</span>
                  <button type="button" disabled={busy || r.qty >= 99} onClick={() => run(() => box.setQty(r.plant_name, r.qty + 1))}
                    aria-label={`One more ${r.plant_name}`}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">+</button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
