import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { SLOT_IDS, GARDYN_COLUMNS, LIGHT_ZONE_META, getSlotLightZone } from "../config/gardyn";
import { formatLocalDate, todayLocal } from "../utils/date";
import TowerView, { SUN_STRIPE } from "../components/TowerView";

// Printables that tie the app to the physical tower:
//  - Slot stickers: one per slot (A1–B8), to stick beside each slot or on
//    its Gardyn Cap, so students see the same slot IDs as the app.
//  - Tower map: the front view with what's planted where, to post by the
//    tower.
const PRINT_CSS = `
@media print {
  @page { margin: 0.4in; }
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; }
  #print-area * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #print-area .no-print { display: none !important; }
}`;

const side = (id) => (id[0] === GARDYN_COLUMNS[0] ? "Left" : "Right");
const rowWords = (id) => {
  const r = Number(id.slice(1));
  return r === 1 ? "row 1 · top" : r === 8 ? "row 8 · bottom" : `row ${r}`;
};

export default function TowerPrint() {
  const { user } = useAuth();
  const [slots, setSlots] = useState({});
  const [mode, setMode] = useState("stickers");
  const [withPlants, setWithPlants] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("tracker_slots").select("slot_id, plant_name, status, date_planted, student_team").eq("user_id", user.id)
      .then(({ data }) => {
        const by = {};
        for (const r of data || []) if (!by[r.slot_id] || r.plant_name) by[r.slot_id] = r;
        setSlots(by);
      });
  }, [user?.id]);

  const planted = (id) => {
    const s = slots[id];
    return s?.plant_name && s.status !== "Empty" ? s : null;
  };

  return (
    <div className="space-y-6 pb-24">
      <style>{PRINT_CSS}</style>
      <div className="space-y-3">
        <Link to="/tracker" className="text-xs font-semibold text-teal-800 underline">← Slot Tracker</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🖨️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Print for your tower</h1>
            <p className="text-xs text-gray-600 mt-0.5">Label the real tower so it matches the app, slot for slot.</p>
          </div>
        </div>
      </div>

      <fieldset className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <legend className="text-sm font-bold text-gray-800 px-1">What to print</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["stickers", "🏷️ Slot stickers", "16 small labels (A1–B8). Stick one beside each slot, or on the Gardyn Cap of an empty slot."],
            ["map", "🗺️ Tower map", "One page showing what's planted in each slot. Post it next to the tower."],
          ].map(([v, title, hint]) => (
            <label key={v} className={`flex gap-3 rounded-2xl border-2 p-3 cursor-pointer ${mode === v ? "border-teal-700 bg-teal-50" : "border-gray-200 hover:border-teal-300"}`}>
              <input type="radio" name="print-mode" className="mt-1 accent-teal-700" checked={mode === v} onChange={() => setMode(v)} />
              <span>
                <span className="block text-sm font-bold text-gray-900">{title}</span>
                <span className="block text-xs text-gray-600">{hint}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === "stickers" && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="accent-teal-700" checked={withPlants} onChange={(e) => setWithPlants(e.target.checked)} />
            Add what's planted now (reprint when you replant)
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => window.print()}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-5 py-3">
            🖨️ Print
          </button>
          <p className="text-xs text-gray-500">
            {mode === "stickers" ? "Tip: print on label paper, or on card stock and tape them on." : "Tip: print in color so the sun levels show."}
          </p>
        </div>
      </fieldset>

      <div id="print-area" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
        {mode === "stickers" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Slot stickers">
            {SLOT_IDS.map((id) => {
              const z = getSlotLightZone(id);
              const m = LIGHT_ZONE_META[z];
              const p = withPlants ? planted(id) : null;
              return (
                <div key={id} className="flex overflow-hidden rounded-xl border-2 border-gray-800 bg-white" style={{ breakInside: "avoid", minHeight: "1in" }}>
                  <span className={`w-3 shrink-0 ${SUN_STRIPE[z]}`} aria-hidden="true" />
                  <div className="flex-1 px-2 py-1.5">
                    <p className="text-3xl font-bold text-gray-900 leading-none">{id}</p>
                    <p className="text-[11px] font-semibold text-gray-700 mt-1">{side(id)} column · {rowWords(id)}</p>
                    <p className={`text-[11px] font-bold ${m.text}`}>{m.label}</p>
                    {p && (
                      <p className="text-xs font-bold text-teal-900 mt-1 leading-tight">
                        {p.plant_name}
                        {p.date_planted && <span className="block text-[10px] font-semibold text-gray-600">planted {formatLocalDate(p.date_planted)}</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-center text-lg font-bold text-teal-900 mb-2">Our Gardyn Tower</h2>
            <TowerView
              caption={false}
              renderSlot={(id, m) => {
                const p = planted(id);
                const z = getSlotLightZone(id);
                return (
                  <div className="h-full min-h-[52px] flex overflow-hidden rounded-lg border border-gray-400 bg-white">
                    <span className={`w-1.5 shrink-0 ${SUN_STRIPE[z]}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0 px-1.5 py-1">
                      <p className="flex justify-between text-[10px] font-bold text-gray-600"><span>{id}</span><span className={m.text}>{m.short}</span></p>
                      <p className={`text-xs font-bold leading-tight ${p ? "text-gray-900" : "text-gray-400"}`}>{p ? p.plant_name : "Empty"}</p>
                      {p?.date_planted && <p className="text-[10px] text-gray-600">planted {formatLocalDate(p.date_planted)}</p>}
                      {p?.student_team && <p className="text-[10px] text-gray-600 truncate">👤 {p.student_team}</p>}
                    </div>
                  </div>
                );
              }}
            />
            <div className="flex flex-wrap justify-center gap-x-4 mt-3 text-[11px] text-gray-700">
              {Object.entries(LIGHT_ZONE_META).map(([z, m]) => (
                <span key={z} className="flex items-center gap-1.5"><span className={`w-1.5 h-4 rounded-sm ${SUN_STRIPE[z]}`} aria-hidden="true" /> {m.label}</span>
              ))}
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-2">As seen from the front of the tower · printed {formatLocalDate(todayLocal())}</p>
          </div>
        )}
      </div>
    </div>
  );
}
