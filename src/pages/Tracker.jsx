import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";
import { todayLocal, toLocalISODate, parseLocalDate, addDays, daysBetween, formatLocalDate } from "../utils/date";
import {
  GARDYN_MODEL, GARDYN_COLUMNS, GARDYN_ROWS, SLOT_IDS, SLOT_COUNT, isValidSlotId,
  LIGHT_ZONE_META, getSlotLightZone, getLightMatch, MATCH_COPY, MATCH_TEXT, MATCH_BOX,
} from "../config/gardyn";

/* ─── Slot layout: see src/config/gardyn.js ─────────────── */
const COLUMNS = GARDYN_COLUMNS;
const ROWS    = GARDYN_ROWS;
const ALL_SLOT_IDS = SLOT_IDS;

const STATUSES = ["Empty", "Germinating", "Growing", "Ready to Harvest", "Monitor"];

const STATUS_STYLE = {
  "Empty":             { bg: "bg-gray-100",    text: "text-gray-500",   border: "border-gray-200",   dot: "bg-gray-400"   },
  "Germinating":       { bg: "bg-blue-50",     text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-400"   },
  "Growing":           { bg: "bg-teal-50",     text: "text-teal-700",   border: "border-teal-200",   dot: "bg-teal-500"   },
  "Ready to Harvest":  { bg: "bg-green-50",    text: "text-green-700",  border: "border-green-300",  dot: "bg-green-500"  },
  "Monitor":           { bg: "bg-amber-50",    text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400"  },
};

/* ─── Date helpers (local calendar dates) ───────────────── */
function etaDate(dateStr, days) {
  if (!dateStr || days == null) return null;
  const d = parseLocalDate(dateStr);
  return d ? toLocalISODate(addDays(d, days)) : null;
}

function formatDate(iso) {
  if (!iso) return "—";
  return formatLocalDate(iso);
}

function daysAgo(iso) {
  const d = parseLocalDate(iso);
  return d ? daysBetween(d, new Date()) : null;
}

/* ─── First-visit seeding ────────────────────────────────── */
// Module-level in-flight guard so StrictMode double effects / quick remounts
// share a single seed request per user.
const seedInFlight = new Map();

async function seedMissingSlots(userId, missingIds) {
  const rows = missingIds.map((id) => ({ user_id: userId, slot_id: id, status: "Empty" }));
  if (rows.length === 0) return null;

  const { error } = await supabase
    .from("tracker_slots")
    .upsert(rows, { onConflict: "user_id,slot_id", ignoreDuplicates: true });
  if (!error) return null;
  if (!/no unique or exclusion constraint/i.test(error.message || "")) return error;

  // Unique constraint not migrated yet: re-select, then insert only what's still missing.
  const { data: current, error: selErr } = await supabase
    .from("tracker_slots")
    .select("slot_id")
    .eq("user_id", userId);
  if (selErr) return selErr;
  const have = new Set((current || []).map((r) => r.slot_id));
  const stillMissing = rows.filter((r) => !have.has(r.slot_id));
  if (stillMissing.length === 0) return null;
  const { error: insErr } = await supabase.from("tracker_slots").insert(stillMissing);
  return insErr || null;
}

function seedOnce(userId, missingIds) {
  if (!seedInFlight.has(userId)) {
    const p = seedMissingSlots(userId, missingIds).finally(() => seedInFlight.delete(userId));
    seedInFlight.set(userId, p);
  }
  return seedInFlight.get(userId);
}

function hasMissingSlots(bySlot) {
  return ALL_SLOT_IDS.some((id) => !bySlot[id]);
}

function rowTime(r) {
  return Date.parse(r.updated_at || r.created_at || "") || 0;
}

// How much a teacher has filled in on a row - so a duplicate empty seed row
// never hides the real one. Matches the dedupe order in the Sept 2026 SQL.
function rowRichness(r) {
  return (r.plant_name ? 4 : 0) + (r.date_planted ? 2 : 0) + (r.observation_notes ? 1 : 0);
}

/** One row per slot_id: the most filled-in row wins, then the newest. */
function dedupeSlots(rows) {
  const bySlot = {};
  for (const r of rows) {
    // Ignore leftover rows from the old 30-slot layout (C1–C10, A9, …).
    if (!isValidSlotId(r.slot_id)) continue;
    const prev = bySlot[r.slot_id];
    if (
      !prev ||
      rowRichness(r) > rowRichness(prev) ||
      (rowRichness(r) === rowRichness(prev) && rowTime(r) >= rowTime(prev))
    ) {
      bySlot[r.slot_id] = r;
    }
  }
  return bySlot;
}

/* ─── Main component ─────────────────────────────────────── */
export default function Tracker() {
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [slots,      setSlots]      = useState({});
  const [plants,     setPlants]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editSlot,   setEditSlot]   = useState(null);
  const [viewMode,   setViewMode]   = useState("grid");

  const [loadError,  setLoadError]  = useState(null);
  const lastTriggerRef = useRef(null);

  /* ── Load plants + slots ─────────────────────────────────── */
  const loadData = useCallback(async (isCancelled = () => false) => {
    setLoadError(null);
    const selectSlots = () => supabase.from("tracker_slots").select("*").eq("user_id", user.id);

    const [plantRes, slotRes] = await Promise.all([
      supabase.from("plants").select("name, germination_days, harvest_days, category, light_zone").order("name"),
      selectSlots(),
    ]);
    if (isCancelled()) return;

    if (plantRes.error) {
      showToast({ title: "Failed to load plant catalog", type: "error" });
    } else {
      setPlants(plantRes.data || []);
    }

    if (slotRes.error) {
      showToast({ title: "Failed to load tracker", description: slotRes.error.message, type: "error" });
      setLoadError(slotRes.error.message);
      setLoading(false);
      return;
    }

    let rows = slotRes.data || [];
    const have = new Set(rows.map((s) => s.slot_id));
    const missingIds = ALL_SLOT_IDS.filter((id) => !have.has(id));

    if (missingIds.length > 0) {
      const seedErr = await seedOnce(user.id, missingIds);
      if (isCancelled()) return;
      if (seedErr) {
        showToast({ title: "Couldn't set up your slots", description: seedErr.message, type: "error" });
        setLoadError(seedErr.message);
      }
      // Always re-read from the DB so we show exactly what's stored.
      const again = await selectSlots();
      if (isCancelled()) return;
      if (again.error) {
        showToast({ title: "Failed to load tracker", description: again.error.message, type: "error" });
        setLoadError(again.error.message);
      } else {
        rows = again.data || [];
      }
    }

    const bySlot = dedupeSlots(rows);
    if (!hasMissingSlots(bySlot)) {
      setLoadError(null);
    } else {
      // Seed "succeeded" but rows are still missing (e.g. blocked by RLS) - don't fail silently.
      setLoadError((prev) => prev || "Some slots are missing from your tracker.");
    }
    setSlots(bySlot);
    setLoading(false);
  }, [user.id, showToast]);

  useEffect(() => {
    let cancelled = false;
    loadData(() => cancelled);
    return () => { cancelled = true; };
  }, [loadData]);

  function retryLoad() {
    setLoading(true);
    loadData();
  }

  function openEditor(id, trigger) {
    lastTriggerRef.current = trigger;
    setEditSlot(id);
  }

  function closeEditor() {
    setEditSlot(null);
    const el = lastTriggerRef.current;
    requestAnimationFrame(() => el?.focus?.());
  }

  /* ── Save slot edits ─────────────────────────────────────── */
  async function saveSlot(slotId, updates) {
    const slot = slots[slotId];
    if (!slot?.id) return;

    const { data, error } = await supabase
      .from("tracker_slots")
      .update(updates)
      .eq("id", slot.id)
      .select()
      .single();

    if (error) {
      showToast({ title: "Failed to save slot", description: error.message, type: "error" });
    } else {
      setSlots((prev) => ({ ...prev, [slotId]: data }));
      showToast({ title: `Slot ${slotId} updated`, type: "success" });
      closeEditor();
    }
  }

  /* ── Summary counts ──────────────────────────────────────── */
  const slotList = Object.values(slots);
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = slotList.filter((sl) => sl.status === s).length;
    return acc;
  }, {});

  const lightCounts = ALL_SLOT_IDS.reduce((acc, id) => {
    const z = getSlotLightZone(id);
    acc[z] = (acc[z] || 0) + 1;
    return acc;
  }, {});

  /* ── Plant lookup map ────────────────────────────────────── */
  const plantMap = plants.reduce((m, p) => { m[p.name] = p; return m; }, {});

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="w-10 h-10 bg-teal-100 text-teal-700
                       rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
          >
            📋
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
              Slot Tracker
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {SLOT_COUNT} slots · {GARDYN_MODEL} (A–B × 1–8)
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[["grid","⊞"],["list","≡"]].map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-label={`${mode} view`}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center
                          transition-colors focus-visible:ring-2 focus-visible:ring-teal-700
                          ${viewMode === mode
                            ? "bg-white shadow text-teal-700"
                            : "text-gray-400 hover:text-gray-600"}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TrackerSkeleton />
      ) : (
        <>
          {loadError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" role="alert">
              <div>
                <p className="font-semibold text-red-800 text-sm">Some slots couldn't be loaded or set up.</p>
                <p className="text-xs text-red-700 mt-0.5">{loadError}</p>
              </div>
              <button
                onClick={retryLoad}
                className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm
                           font-semibold min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Status summary ─────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const style = STATUS_STYLE[s];
              return (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
                               ${style.bg} ${style.text} ${style.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                  {s}: {counts[s]}
                </div>
              );
            })}
          </div>

          {/* ── Light legend ───────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(LIGHT_ZONE_META).map(([zone, meta]) => (
                <span key={zone} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${meta.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  {meta.label}: {lightCounts[zone] || 0}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Each slot shows how much light it gets (row 1 is the top of the column). When you pick a plant,
              the tracker checks it against the slot and suggests better open slots.
            </p>
          </div>

          {/* ── Grid view ──────────────────────────────────── */}
          {viewMode === "grid" && (
            <div className="space-y-4">
              {COLUMNS.map((col) => (
                <div key={col}>
                  <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">
                    Column {col}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROWS.map((row) => {
                      const id    = `${col}${row}`;
                      const slot  = slots[id];
                      const style = STATUS_STYLE[slot?.status] || STATUS_STYLE["Empty"];
                      const plant = plantMap[slot?.plant_name];
                      const zoneMeta = LIGHT_ZONE_META[getSlotLightZone(id)];
                      const match = plant ? getLightMatch(getSlotLightZone(id), plant.light_zone) : "unknown";

                      const harvestEta = plant && slot?.date_planted
                        ? etaDate(slot.date_planted, plant.harvest_days)
                        : null;

                      return (
                        <button
                          key={id}
                          onClick={(e) => openEditor(id, e.currentTarget)}
                          disabled={!slot}
                          aria-haspopup="dialog"
                          aria-label={`Slot ${id}: ${slot?.status || "Empty"}${slot?.plant_name ? ` · ${slot.plant_name}` : ""} · ${zoneMeta.label}${plant ? ` · ${MATCH_COPY[match]}` : ""}`}
                          className={`text-left p-3 rounded-2xl border transition-all
                                      hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-teal-700
                                      ${style.bg} ${style.border}
                                      ${editSlot === id ? "ring-2 ring-teal-400 shadow-md" : match === "poor" ? "ring-2 ring-red-300" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500">{id}</span>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                          </div>

                          <p className={`text-xs font-semibold leading-tight ${style.text} line-clamp-2`}>
                            {slot?.plant_name || "Empty"}
                          </p>

                          {slot?.status && slot.status !== "Empty" && (
                            <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${style.text}`}>
                              {slot.status}
                            </p>
                          )}

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full border text-[9px] font-bold uppercase tracking-wide ${zoneMeta.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${zoneMeta.dot}`} aria-hidden="true" />
                            {zoneMeta.short} sun
                          </span>

                          {plant && match !== "unknown" && (
                            <p className={`text-[9px] mt-1 font-bold uppercase tracking-wide ${MATCH_TEXT[match]}`}>
                              {MATCH_COPY[match]}
                            </p>
                          )}

                          {harvestEta && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              🌾 {formatDate(harvestEta)}
                            </p>
                          )}

                          {slot?.student_team && (
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                              👤 {slot.student_team}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── List view ──────────────────────────────────── */}
          {viewMode === "list" && (
            <div className="space-y-2">
              {ALL_SLOT_IDS.map((id) => {
                const slot  = slots[id];
                const style = STATUS_STYLE[slot?.status] || STATUS_STYLE["Empty"];
                const plant = plantMap[slot?.plant_name];
                const zoneMeta = LIGHT_ZONE_META[getSlotLightZone(id)];
                const match = plant ? getLightMatch(getSlotLightZone(id), plant.light_zone) : "unknown";

                const harvestEta = plant && slot?.date_planted
                  ? etaDate(slot.date_planted, plant.harvest_days)
                  : null;

                return (
                  <button
                    key={id}
                    onClick={(e) => openEditor(id, e.currentTarget)}
                    disabled={!slot}
                    aria-haspopup="dialog"
                    aria-label={`Slot ${id}: ${slot?.status || "Empty"}${slot?.plant_name ? ` · ${slot.plant_name}` : ""} · ${zoneMeta.label}${plant ? ` · ${MATCH_COPY[match]}` : ""}`}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3
                                rounded-2xl border transition-all hover:shadow-sm
                                disabled:opacity-50 disabled:cursor-not-allowed
                                focus-visible:ring-2 focus-visible:ring-teal-700
                                ${style.bg} ${style.border}
                                ${editSlot === id ? "ring-2 ring-teal-400" : match === "poor" ? "ring-2 ring-red-300" : ""}`}
                  >
                    <span className="text-xs font-bold text-gray-500 w-6 flex-shrink-0">{id}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />

                    <span className={`text-sm font-semibold flex-1 ${style.text}`}>
                      {slot?.plant_name || <span className="text-gray-500 font-normal">Empty</span>}
                    </span>

                    {slot?.status && slot.status !== "Empty" && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${style.text}`}>
                        {slot.status}
                      </span>
                    )}

                    <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${zoneMeta.text}`}>
                      {zoneMeta.short}
                    </span>

                    {plant && match !== "unknown" && (
                      <span className={`text-[10px] font-bold uppercase hidden sm:inline ${MATCH_TEXT[match]}`}>
                        {MATCH_COPY[match]}
                      </span>
                    )}

                    {slot?.student_team && (
                      <span className="text-[10px] text-gray-500 hidden sm:inline">
                        {slot.student_team}
                      </span>
                    )}

                    {harvestEta && (
                      <span className="text-[10px] text-gray-500">
                        🌾 {formatDate(harvestEta)}
                      </span>
                    )}

                    {slot?.date_planted && (
                      <span className="text-[10px] text-gray-500 hidden sm:inline">
                        day {daysAgo(slot.date_planted)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Edit panel ─────────────────────────────────── */}
          {editSlot && slots[editSlot] && (
            <SlotEditPanel
              key={editSlot}
              slotId={editSlot}
              slot={slots[editSlot]}
              plants={plants}
              plantMap={plantMap}
              onSave={saveSlot}
              onClose={closeEditor}
              slots={slots}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─── Slot Edit Panel ────────────────────────────────────── */
function SlotEditPanel({ slotId, slot, slots, plants, plantMap, onSave, onClose }) {
  const [form, setForm] = useState({
    plant_name:        slot.plant_name || "",
    date_planted:      slot.date_planted || "",
    student_team:      slot.student_team || "",
    status:            slot.status || "Empty",
    observation_notes: slot.observation_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const headingRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const headingId  = `slot-edit-heading-${slotId}`;

  // Focus the heading on open, close on Escape, lock background scroll.
  // (Runs once per mount; onClose is read via ref so parent re-renders
  // don't steal focus back to the heading.)
  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const selectedPlant = plantMap[form.plant_name];
  const slotZone   = getSlotLightZone(slotId);
  const slotMeta   = LIGHT_ZONE_META[slotZone];
  const plantMeta  = LIGHT_ZONE_META[selectedPlant?.light_zone];
  const lightMatch = selectedPlant ? getLightMatch(slotZone, selectedPlant.light_zone) : "unknown";
  // Other empty slots whose light suits this plant.
  const betterSlots = selectedPlant && lightMatch !== "best"
    ? SLOT_IDS.filter((id) =>
        id !== slotId &&
        getLightMatch(getSlotLightZone(id), selectedPlant.light_zone) === "best" &&
        (!slots[id]?.plant_name || slots[id]?.status === "Empty"))
    : [];
  const germEta       = selectedPlant && form.date_planted
    ? etaDate(form.date_planted, selectedPlant.germination_days)
    : null;
  const harvestEta    = selectedPlant && form.date_planted
    ? etaDate(form.date_planted, selectedPlant.harvest_days)
    : null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(slotId, {
      plant_name:        form.plant_name || null,
      date_planted:      form.date_planted || null,
      student_team:      form.student_team || null,
      status:            form.status,
      observation_notes: form.observation_notes || null,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
    <div
      className="relative w-full md:max-w-lg max-h-[85vh] overflow-y-auto
                 bg-white border border-teal-200 rounded-t-3xl md:rounded-2xl
                 shadow-2xl p-6 space-y-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="font-bold text-teal-800 text-base lg:text-lg focus:outline-none"
          >
            Edit Slot {slotId}
          </h2>

          <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${slotMeta.badge}`}>
            <span className={`w-2 h-2 rounded-full ${slotMeta.dot}`} aria-hidden="true" />
            {slotMeta.label}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close edit panel"
          className="w-8 h-8 flex items-center justify-center rounded-xl
                     text-gray-400 hover:text-gray-600 hover:bg-gray-100
                     focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Plant select */}
        <div>
          <label htmlFor={`plant-${slotId}`} className="block text-xs font-semibold text-gray-600 mb-1">
            Plant
          </label>
          <select
            id={`plant-${slotId}`}
            value={form.plant_name}
            onChange={(e) => setForm({ ...form, plant_name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white
                       shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <option value="">— Empty —</option>
            {plants.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}{LIGHT_ZONE_META[p.light_zone] ? ` · ${LIGHT_ZONE_META[p.light_zone].label}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Light match */}
        {selectedPlant && lightMatch !== "unknown" && (
          <div className={`border rounded-2xl p-3 space-y-1.5 ${MATCH_BOX[lightMatch]}`} role="status">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-bold uppercase tracking-wide">{MATCH_COPY[lightMatch]}</p>
              {plantMeta && <span className="text-[10px] font-semibold">Prefers {plantMeta.label.toLowerCase()}</span>}
            </div>
            {lightMatch === "poor" && (
              <p className="text-xs leading-relaxed">
                {selectedPlant.name} usually does better in a different light zone. You can still track it here.
              </p>
            )}
            {betterSlots.length > 0 && (
              <p className="text-xs">
                <span className="font-semibold">Better open slots:</span> {betterSlots.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Calculated ETAs */}
        {selectedPlant && form.date_planted && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
              <p className="text-blue-600 uppercase font-bold tracking-wide text-[10px]">Germination</p>
              <p className="font-semibold text-blue-700 mt-0.5">{formatDate(germEta)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center">
              <p className="text-green-600 uppercase font-bold tracking-wide text-[10px]">Harvest ETA</p>
              <p className="font-semibold text-green-700 mt-0.5">{formatDate(harvestEta)}</p>
            </div>
          </div>
        )}

        {/* Date planted */}
        <div>
          <label htmlFor={`date-${slotId}`} className="block text-xs font-semibold text-gray-600 mb-1">
            Date Planted
          </label>
          <input
            id={`date-${slotId}`}
            type="date"
            value={form.date_planted}
            max={todayLocal()}
            onChange={(e) => setForm({ ...form, date_planted: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm
                       shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </div>

        {/* Student / Team */}
        <div>
          <label htmlFor={`team-${slotId}`} className="block text-xs font-semibold text-gray-600 mb-1">
            Student / Team
          </label>
          <input
            id={`team-${slotId}`}
            type="text"
            placeholder="e.g. Team Basil"
            value={form.student_team}
            onChange={(e) => setForm({ ...form, student_team: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm
                       shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor={`status-${slotId}`} className="block text-xs font-semibold text-gray-600 mb-1">
            Status
          </label>
          <select
            id={`status-${slotId}`}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white
                       shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor={`notes-${slotId}`} className="block text-xs font-semibold text-gray-600 mb-1">
            Observation Notes
          </label>
          <textarea
            id={`notes-${slotId}`}
            rows={3}
            placeholder="Student observations, germination progress, issues…"
            value={form.observation_notes}
            onChange={(e) => setForm({ ...form, observation_notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl text-sm
                       shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl
                       font-semibold text-sm disabled:opacity-50 focus-visible:ring-2
                       focus-visible:ring-teal-700 transition-colors"
          >
            {saving ? "Saving…" : "Save Slot"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl
                       hover:bg-gray-50 text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function TrackerSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading tracker…" aria-busy="true">
      <div className="flex gap-2">
        {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
      </div>
      {COLUMNS.map((col) => (
        <div key={col} className="space-y-2">
          <Skeleton className="h-4 w-16 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROWS.map((r) => <Skeleton key={r} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
