import { useState } from "react";
import { Link } from "react-router-dom";
import TowerView, { SUN_STRIPE } from "./TowerView";
import { SLOT_COUNT, getSlotLightZone, getLightMatch, MATCH_COPY } from "../config/gardyn";
import { STATUS_STYLE } from "../pages/Tracker";
import { parseLocalDate, addDays, formatLocalDate } from "../utils/date";
import { useIsMobile } from "../hooks/useIsMobile";

// The Gardyn tab's tower at a glance: view only, same picture as the
// Tracker. Tapping a slot opens it in the Tracker (#/tracker?slot=A3).
// Starts collapsed to its summary line on phones.

const OPEN_KEY = "gm.towerGlance.open";
const readOpen = () => { try { return localStorage.getItem(OPEN_KEY); } catch { return null; } };
const saveOpen = (v) => { try { localStorage.setItem(OPEN_KEY, v ? "1" : "0"); } catch { /* private window */ } };

const isGrowing = (s) => s?.plant_name && s.status !== "Empty";

export default function TowerGlance({ slots, plantMap, seedPods = 0 }) {
  const isMobile = useIsMobile();
  // Until the teacher picks, follow the screen size.
  const [pref, setPref] = useState(() => { const v = readOpen(); return v == null ? null : v === "1"; });
  const open = pref ?? !isMobile;
  const toggle = () => { setPref(!open); saveOpen(!open); };

  const bySlot = Object.fromEntries(slots.map((s) => [s.slot_id, s]));
  const growing = slots.filter(isGrowing);
  const ready = growing.filter((s) => s.status === "Ready to Harvest");
  const openCount = SLOT_COUNT - growing.length;

  // Next expected harvest among pods not ready yet.
  const next = growing
    .filter((s) => s.status !== "Ready to Harvest" && s.date_planted && plantMap[s.plant_name]?.harvest_days != null)
    .map((s) => { const d = parseLocalDate(s.date_planted); return { s, at: d && addDays(d, plantMap[s.plant_name].harvest_days) }; })
    .filter((x) => x.at)
    .sort((a, b) => a.at - b.at)[0];

  const summary = [
    `${growing.length} of ${SLOT_COUNT} growing`,
    ready.length > 0 && `${ready.length} ready to harvest`,
    !ready.length && next && `next harvest ${next.s.plant_name}, ${formatLocalDate(next.at)}`,
  ].filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="tower-glance" className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id="tower-glance" className="font-bold text-teal-800 text-sm">🗼 Your tower</h2>
          <p className="text-xs text-gray-600">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {openCount > 0 && seedPods > 0 && (
            <Link to="/tracker?plan=1" className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-1.5">
              Plan {openCount} open slot{openCount === 1 ? "" : "s"}
            </Link>
          )}
          <button type="button" onClick={toggle} aria-expanded={open} aria-controls="tower-glance-map"
            className="text-xs font-semibold text-teal-800 underline">
            {open ? "Hide tower" : "Show tower"}
          </button>
        </div>
      </div>

      {open && (
        <div id="tower-glance-map">
          <TowerView caption={false} renderSlot={(id, zoneMeta) => {
            const s = bySlot[id];
            const grow = isGrowing(s);
            const style = STATUS_STYLE[s?.status] || STATUS_STYLE.Empty;
            const zone = getSlotLightZone(id);
            const plant = grow ? plantMap[s.plant_name] : null;
            const match = plant ? getLightMatch(zone, plant.light_zone) : "unknown";
            const isReady = s?.status === "Ready to Harvest";
            return (
              <Link to={`/tracker?slot=${id}`}
                aria-label={`Slot ${id}, ${zoneMeta.label}: ${grow ? `${s.plant_name}, ${s.status}${match === "poor" ? `, ${MATCH_COPY.poor}` : ""}` : "empty"}. Open in the Tracker.`}
                className={`w-full h-full min-h-[38px] flex overflow-hidden rounded-lg border transition-all hover:shadow
                            focus-visible:ring-2 focus-visible:ring-teal-700
                            ${grow ? `${style.bg} ${style.border}` : "bg-white border-dashed border-gray-300"}
                            ${isReady ? "ring-2 ring-green-400" : ""}`}>
                <span className={`w-1 shrink-0 ${SUN_STRIPE[zone]}`} aria-hidden="true" />
                <span className="flex-1 min-w-0 px-1.5 py-0.5 flex flex-col justify-center">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 leading-none">
                    {id}
                    {grow && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />}
                    {isReady && <span aria-hidden="true">🌾</span>}
                    {match === "poor" && <span aria-hidden="true" title={MATCH_COPY.poor}>⚠️</span>}
                  </span>
                  <span className={`block text-[11px] sm:text-xs font-semibold leading-tight truncate ${grow ? style.text : "text-gray-400"}`}>
                    {grow ? s.plant_name : "Empty"}
                  </span>
                </span>
              </Link>
            );
          }} />
          <p className="text-[11px] text-gray-500 text-center mt-2">Tap a slot to open it in the Tracker.</p>
        </div>
      )}
    </section>
  );
}
