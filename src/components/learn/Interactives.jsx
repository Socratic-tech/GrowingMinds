import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthProvider";
import { useToast } from "../ui/toast";
import { todayLocal } from "../../utils/date";
import {
  GARDYN_COLUMNS, GARDYN_ROWS, SLOT_IDS, LIGHT_ZONE_META,
  getSlotLightZone, getLightMatch, MATCH_COPY,
} from "../../config/gardyn";

/* ─── Light map (read-only) ─────────────────────────────── */
export function LightMap() {
  return (
    <div className="flex gap-3 justify-center" aria-label="Light level of each slot, row 1 at the top">
      {GARDYN_COLUMNS.map((col) => (
        <div key={col} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold text-center text-gray-600 tracking-widest">COLUMN {col}</p>
          {GARDYN_ROWS.map((r) => {
            const id = `${col}${r}`;
            const m = LIGHT_ZONE_META[getSlotLightZone(id)];
            return (
              <div key={id} className={`flex items-center justify-between gap-3 w-32 px-3 py-1 rounded-lg border text-xs font-semibold ${m.badge}`}>
                <span className="text-gray-800">{id}</span>
                <span>{m.short}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Slot placer ───────────────────────────────────────── */
const FALLBACK_PLANTS = [
  { name: "Cherry Tomatoes", light_zone: "Red (High)" },
  { name: "Sweet Peppers", light_zone: "Red (High)" },
  { name: "Green Beans", light_zone: "Red (High)" },
  { name: "Butterhead", light_zone: "Orange (Med)" },
  { name: "Kale", light_zone: "Orange (Med)" },
  { name: "Basil", light_zone: "Orange (Med)" },
  { name: "Mint", light_zone: "Yellow (Low)" },
  { name: "Cilantro", light_zone: "Yellow (Low)" },
  { name: "Arugula", light_zone: "Yellow (Low)" },
];

const MATCH_RING = {
  best: "border-emerald-500 bg-emerald-50",
  okay: "border-amber-400 bg-amber-50",
  poor: "border-red-400 bg-red-50",
  unknown: "border-gray-300 bg-white",
};

export function SlotPlacer({ onComplete }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plants, setPlants] = useState(FALLBACK_PLANTS);
  const [picked, setPicked] = useState(null);
  const [plan, setPlan] = useState({}); // slotId -> plant
  const [showAll, setShowAll] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("plants").select("name, light_zone, category").not("light_zone", "is", null).order("name")
      .then(({ data }) => { if (data?.length) setPlants(data); });
  }, []);

  const byZone = useMemo(() => {
    const g = {};
    for (const p of plants) (g[p.light_zone] ||= []).push(p);
    return g;
  }, [plants]);

  const placed = Object.keys(plan).length;
  const good = Object.entries(plan).filter(([id, p]) => getLightMatch(getSlotLightZone(id), p.light_zone) === "best").length;

  useEffect(() => { if (placed >= 4) onComplete?.(); }, [placed, onComplete]);

  function tapSlot(id) {
    if (picked) {
      setPlan((pl) => ({ ...pl, [id]: picked }));
      setSaved(false);
    } else if (plan[id]) {
      setPlan((pl) => { const n = { ...pl }; delete n[id]; return n; });
      setSaved(false);
    }
  }

  async function saveToTracker() {
    if (!user?.id || placed === 0) return;
    setSaving(true);
    const { data: rows, error } = await supabase.from("tracker_slots").select("id, slot_id, plant_name").eq("user_id", user.id);
    if (error) {
      setSaving(false);
      showToast({ title: "Couldn't reach your Tracker", description: error.message, type: "error" });
      return;
    }
    const existing = Object.fromEntries((rows || []).map((r) => [r.slot_id, r]));
    const today = todayLocal();
    let added = 0, skipped = 0, failed = 0;
    for (const [slot, p] of Object.entries(plan)) {
      const row = existing[slot];
      const fields = { plant_name: p.name, date_planted: today, status: "Germinating" };
      if (row?.plant_name) { skipped++; continue; }
      const res = row
        ? await supabase.from("tracker_slots").update(fields).eq("id", row.id)
        : await supabase.from("tracker_slots").insert({ user_id: user.id, slot_id: slot, ...fields });
      if (res.error) failed++; else added++;
    }
    setSaving(false);
    if (failed) showToast({ title: `Saved ${added}, ${failed} couldn't be saved`, type: "error" });
    else {
      setSaved(true);
      showToast({
        title: `Saved ${added} plant${added === 1 ? "" : "s"} to your Tracker`,
        description: skipped ? `${skipped} slot${skipped === 1 ? " already has" : "s already have"} a plant, so we left ${skipped === 1 ? "it" : "them"} alone.` : undefined,
        type: "success",
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Plant palette */}
      <div className="space-y-3">
        {Object.keys(LIGHT_ZONE_META).map((zone) => {
          const list = byZone[zone] || [];
          if (!list.length) return null;
          const meta = LIGHT_ZONE_META[zone];
          const visible = showAll[zone] ? list : list.slice(0, 6);
          return (
            <div key={zone}>
              <p className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5 ${meta.text}`}>
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" /> {meta.label} plants
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visible.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    aria-pressed={picked?.name === p.name}
                    onClick={() => setPicked(picked?.name === p.name ? null : p)}
                    className={`text-xs font-semibold px-3 py-2 rounded-full border min-h-[36px]
                      ${picked?.name === p.name ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"}`}
                  >
                    {p.name}
                  </button>
                ))}
                {list.length > 6 && (
                  <button type="button" onClick={() => setShowAll((s) => ({ ...s, [zone]: !s[zone] }))} className="text-xs underline text-gray-600 px-2">
                    {showAll[zone] ? "Fewer" : `+${list.length - 6} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm font-semibold text-teal-800" role="status">
        {picked ? `Now tap a slot for ${picked.name}.` : "Tap a plant above. Tap a filled slot to clear it."}
      </p>

      {/* Slots */}
      <div className="flex gap-3 justify-center">
        {GARDYN_COLUMNS.map((col) => (
          <div key={col} className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-center text-gray-600 tracking-widest">COLUMN {col}</p>
            {GARDYN_ROWS.map((r) => {
              const id = `${col}${r}`;
              const zone = getSlotLightZone(id);
              const meta = LIGHT_ZONE_META[zone];
              const p = plan[id];
              const match = p ? getLightMatch(zone, p.light_zone) : "unknown";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => tapSlot(id)}
                  aria-label={`Slot ${id}, ${meta.label}${p ? `, ${p.name}, ${MATCH_COPY[match]}` : ", empty"}`}
                  className={`w-40 sm:w-48 min-h-[44px] px-2.5 py-1.5 rounded-xl border-2 text-left transition-colors ${p ? MATCH_RING[match] : "border-dashed border-gray-300 bg-white hover:border-teal-400"}`}
                >
                  <span className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                    <span>{id}</span>
                    <span className={`inline-flex items-center gap-1 ${meta.text}`}><span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />{meta.short}</span>
                  </span>
                  {p && <span className="block text-xs font-semibold text-gray-800 truncate">{p.name}</span>}
                  {p && match !== "best" && <span className={`block text-[10px] font-bold ${match === "poor" ? "text-red-700" : "text-amber-800"}`}>{MATCH_COPY[match]}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50 border border-teal-100 rounded-2xl p-3">
        <p className="text-sm text-gray-700">
          <b>{placed}</b> of {SLOT_IDS.length} planned · <b>{good}</b> great light match{good === 1 ? "" : "es"}
        </p>
        <button
          type="button"
          onClick={saveToTracker}
          disabled={saving || placed === 0 || saved}
          className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2 disabled:opacity-50"
        >
          {saved ? "✓ Saved to Tracker" : saving ? "Saving…" : "I planted these today: save to Tracker"}
        </button>
      </div>
      {placed < 4 && <p className="text-xs text-gray-500">Place at least 4 plants to continue. Saving is optional: skip it if you haven't planted yet.</p>}
    </div>
  );
}

/* ─── Sprout picker ─────────────────────────────────────── */
const SPROUTS = [
  { id: "leggy", label: "Tall, thin and pale", h: 150, lean: 14, color: "#b7d98b", leaf: 16,
    why: "Tall and pale means it stretched for light. It's weak, not strong. Snip it." },
  { id: "strong", label: "Short, sturdy and deep green", h: 95, lean: 0, color: "#2f8a3e", leaf: 26, correct: true,
    why: "Yes! A thick stem and deep green leaves: this is the healthiest sprout. Keep it and snip the rest." },
  { id: "tiny", label: "Tiny, just coming up", h: 40, lean: -4, color: "#5aa55a", leaf: 10,
    why: "It came up late, so it's already behind. Snip it." },
  { id: "yellow", label: "Bent with yellow leaves", h: 85, lean: -22, color: "#d4c24a", leaf: 18,
    why: "Yellowing and bent: it's struggling. Snip it." },
];

function SproutSvg({ s }) {
  const topX = 40 + s.lean;
  const topY = 170 - s.h;
  return (
    <svg viewBox="0 0 80 175" width="80" height="175" aria-hidden="true">
      <path d={`M40 170 Q ${40 + s.lean / 2} ${170 - s.h / 2} ${topX} ${topY}`} stroke={s.color} strokeWidth={s.id === "strong" ? 6 : 3} fill="none" strokeLinecap="round" />
      <ellipse cx={topX - s.leaf * 0.7} cy={topY} rx={s.leaf} ry={s.leaf * 0.45} fill={s.color} transform={`rotate(-25 ${topX - s.leaf * 0.7} ${topY})`} />
      <ellipse cx={topX + s.leaf * 0.7} cy={topY} rx={s.leaf} ry={s.leaf * 0.45} fill={s.color} transform={`rotate(25 ${topX + s.leaf * 0.7} ${topY})`} />
    </svg>
  );
}

export function SproutPicker({ onComplete }) {
  const [choice, setChoice] = useState(null);
  const chosen = SPROUTS.find((s) => s.id === choice);
  return (
    <div className="space-y-3">
      <div className="bg-sky-50 rounded-2xl pt-4 overflow-hidden">
        <div className="flex justify-center gap-1 sm:gap-4">
          {SPROUTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setChoice(s.id); if (s.correct) onComplete?.(); }}
              aria-pressed={choice === s.id}
              aria-label={`Sprout: ${s.label}`}
              className={`rounded-2xl px-1 pt-1 transition-colors focus-visible:ring-2 focus-visible:ring-teal-600
                ${choice === s.id ? (s.correct ? "bg-emerald-100 ring-2 ring-emerald-500" : "bg-red-50 ring-2 ring-red-300") : "hover:bg-white/70"}`}
            >
              <SproutSvg s={s} />
            </button>
          ))}
        </div>
        <div className="h-10 mx-auto w-3/4 bg-[#c9b79c] rounded-t-lg border-t-4 border-[#b39f82]" aria-hidden="true" />
        <p className="text-center text-[11px] text-gray-600 bg-[#c9b79c] pb-1" aria-hidden="true">rockwool yCube</p>
      </div>
      {chosen && (
        <p role="status" className={`text-sm font-semibold rounded-xl px-4 py-3 ${chosen.correct ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>
          {chosen.why}{!chosen.correct && " Try again."}
        </p>
      )}
    </div>
  );
}

/* ─── Harvest plant ─────────────────────────────────────── */
const OUTER = [0, 60, 120, 180, 240, 300];
const INNER = [30, 150, 270];
const TOTAL = OUTER.length + INNER.length;

export function HarvestPlant({ onComplete }) {
  const [cut, setCut] = useState(() => new Set());
  const [msg, setMsg] = useState(null);
  const left = TOTAL - cut.size;

  useEffect(() => { if (cut.size >= 3) onComplete?.(); }, [cut.size, onComplete]);

  function snip(key, inner) {
    if (cut.has(key)) return;
    if (inner) {
      setMsg({ ok: false, text: "Leave the small inner leaves: they're what keeps the plant growing back." });
      return;
    }
    if (left - 1 < Math.ceil(TOTAL / 3)) {
      setMsg({ ok: false, text: "Stop there! Always leave at least one-third of the plant." });
      return;
    }
    const next = new Set(cut); next.add(key); setCut(next);
    setMsg({ ok: true, text: next.size >= 3 ? "Nice harvest. The center will keep growing new leaves." : "Snip! Keep going with the outer leaves." });
  }

  const leaf = (angle, inner) => {
    const key = `${inner ? "i" : "o"}${angle}`;
    const gone = cut.has(key);
    const len = inner ? 52 : 92;
    const w = inner ? 20 : 34;
    const act = () => snip(key, inner);
    return (
      <g
        key={key}
        transform={`rotate(${angle} 120 120)`}
        role="button"
        tabIndex={gone ? -1 : 0}
        aria-label={`${inner ? "Inner" : "Outer"} leaf${gone ? ", harvested" : ""}`}
        onClick={act}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } }}
        style={{ cursor: gone ? "default" : "pointer", outline: "none" }}
        opacity={gone ? 0.12 : 1}
      >
        <ellipse cx="120" cy={120 - len / 2 - 6} rx={w / 2} ry={len / 2} fill={inner ? "#a8d672" : "#4f9a3a"} stroke="#2f6b25" strokeWidth="2" />
        <line x1="120" y1="118" x2="120" y2={120 - len} stroke="#2f6b25" strokeWidth="1.5" opacity="0.6" />
      </g>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center bg-emerald-50/60 rounded-2xl py-3">
        <svg viewBox="0 0 240 240" width="260" height="260" aria-label="Lettuce plant seen from above">
          {OUTER.map((a) => leaf(a, false))}
          {INNER.map((a) => leaf(a, true))}
          <circle cx="120" cy="120" r="9" fill="#c8e6a0" />
        </svg>
      </div>
      <p className="text-sm text-gray-700 text-center">
        Harvested <b>{cut.size}</b> of {TOTAL} leaves · <b>{left}</b> left on the plant
      </p>
      {msg && (
        <p role="status" className={`text-sm font-semibold rounded-xl px-4 py-3 ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
