import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";

/* ─── Slot layout: 3 columns × 10 rows (A–C, 1–10) ─────── */
const COLUMNS = ["A", "B", "C"];
const ROWS    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ALL_SLOT_IDS = COLUMNS.flatMap((col) => ROWS.map((row) => `${col}${row}`));

const STATUSES = ["Empty", "Germinating", "Growing", "Ready to Harvest", "Monitor"];

const STATUS_STYLE = {
  "Empty":             { bg: "bg-gray-100",    text: "text-gray-400",   border: "border-gray-200",   dot: "bg-gray-400"   },
  "Germinating":       { bg: "bg-blue-50",     text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-400"   },
  "Growing":           { bg: "bg-teal-50",     text: "text-teal-700",   border: "border-teal-200",   dot: "bg-teal-500"   },
  "Ready to Harvest":  { bg: "bg-green-50",    text: "text-green-700",  border: "border-green-300",  dot: "bg-green-500"  },
  "Monitor":           { bg: "bg-amber-50",    text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400"  },
};

/* ─── Date helpers ───────────────────────────────────────── */
function addDays(dateStr, days) {
  if (!dateStr || days == null) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  return diff;
}

/* ─── Main component ─────────────────────────────────────── */
export default function Tracker() {
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [slots,      setSlots]      = useState({});   // { slotId: slot }
  const [plants,     setPlants]     = useState([]);   // plant catalog
  const [loading,    setLoading]    = useState(true);
  const [editSlot,   setEditSlot]   = useState(null); // slot_id string | null
  const [viewMode,   setViewMode]   = useState("grid"); // "grid" | "list"

  /* ── Load plants + slots ─────────────────────────────────── */
  const loadData = useCallback(async () => {
    const [plantRes, slotRes] = await Promise.all([
      supabase.from("plants").select("name, germination_days, harvest_days, category, light_zone").order("name"),
      supabase.from("tracker_slots").select("*").eq("user_id", user.id),
    ]);

    if (plantRes.error) {
      showToast({ title: "Failed to load plant catalog", type: "error" });
    } else {
      setPlants(plantRes.data || []);
    }

    if (slotRes.error) {
      showToast({ title: "Failed to load tracker", description: slotRes.error.message, type: "error" });
      setLoading(false);
      return;
    }

    // Build slot map — seed any missing slots as Empty
    const existing = {};
    (slotRes.data || []).forEach((s) => { existing[s.slot_id] = s; });

    const toInsert = ALL_SLOT_IDS
      .filter((id) => !existing[id])
      .map((id) => ({ user_id: user.id, slot_id: id, status: "Empty" }));

    if (toInsert.length > 0) {
      const { data: seeded, error: seedErr } = await supabase
        .from("tracker_slots")
        .insert(toInsert)
        .select();
      if (!seedErr && seeded) {
        seeded.forEach((s) => { existing[s.slot_id] = s; });
      }
    }

    setSlots(existing);
    setLoading(false);
  }, [user.id, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

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
      setEditSlot(null);
    }
  }

  /* ── Summary counts ──────────────────────────────────────── */
  const slotList = Object.values(slots);
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = slotList.filter((sl) => sl.status === s).length;
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
              30 slots · Gardyn yCube (A–C × 1–10)
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

          {/* ── Grid view ──────────────────────────────────── */}
          {viewMode === "grid" && (
            <div className="space-y-4">
              {COLUMNS.map((col) => (
                <div key={col}>
                  <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    Column {col}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ROWS.map((row) => {
                      const id    = `${col}${row}`;
                      const slot  = slots[id];
                      const style = STATUS_STYLE[slot?.status] || STATUS_STYLE["Empty"];
                      const plant = plantMap[slot?.plant_name];
                      const harvestEta = plant && slot?.date_planted
                        ? addDays(slot.date_planted, plant.harvest_days)
                        : null;

                      return (
                        <button
                          key={id}
                          onClick={() => setEditSlot(editSlot === id ? null : id)}
                          aria-expanded={editSlot === id}
                          aria-label={`Slot ${id}: ${slot?.status || "Empty"}${slot?.plant_name ? ` · ${slot.plant_name}` : ""}`}
                          className={`text-left p-3 rounded-2xl border transition-all
                                      hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-700
                                      ${style.bg} ${style.border}
                                      ${editSlot === id ? "ring-2 ring-teal-400 shadow-md" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-400">{id}</span>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                          </div>
                          <p className={`text-xs font-semibold leading-tight ${style.text} line-clamp-2`}>
                            {slot?.plant_name || "Empty"}
                          </p>
                          {harvestEta && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              🌾 {formatDate(harvestEta)}
                            </p>
                          )}
                          {slot?.student_team && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
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
                const harvestEta = plant && slot?.date_planted
                  ? addDays(slot.date_planted, plant.harvest_days)
                  : null;

                return (
                  <button
                    key={id}
                    onClick={() => setEditSlot(editSlot === id ? null : id)}
                    aria-expanded={editSlot === id}
                    aria-label={`Slot ${id}`}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3
                                rounded-2xl border transition-all hover:shadow-sm
                                focus-visible:ring-2 focus-visible:ring-teal-700
                                ${style.bg} ${style.border}
                                ${editSlot === id ? "ring-2 ring-teal-400" : ""}`}
                  >
                    <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0">{id}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
                    <span className={`text-sm font-semibold flex-1 ${style.text}`}>
                      {slot?.plant_name || <span className="text-gray-400 font-normal">Empty</span>}
                    </span>
                    {slot?.student_team && (
                      <span className="text-[10px] text-gray-400 hidden sm:inline">
                        {slot.student_team}
                      </span>
                    )}
                    {harvestEta && (
                      <span className="text-[10px] text-gray-400">
                        🌾 {formatDate(harvestEta)}
                      </span>
                    )}
                    {slot?.date_planted && (
                      <span className="text-[10px] text-gray-400 hidden sm:inline">
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
              slotId={editSlot}
              slot={slots[editSlot]}
              plants={plants}
              plantMap={plantMap}
              onSave={saveSlot}
              onClose={() => setEditSlot(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─── Slot Edit Panel ────────────────────────────────────── */
function SlotEditPanel({ slotId, slot, plants, plantMap, onSave, onClose }) {
  const [form, setForm] = useState({
    plant_name:        slot.plant_name || "",
    date_planted:      slot.date_planted || "",
    student_team:      slot.student_team || "",
    status:            slot.status || "Empty",
    observation_notes: slot.observation_notes || "",
  });
  const [saving, setSaving] = useState(false);

  const selectedPlant = plantMap[form.plant_name];
  const germEta       = selectedPlant && form.date_planted
    ? addDays(form.date_planted, selectedPlant.germination_days)
    : null;
  const harvestEta    = selectedPlant && form.date_planted
    ? addDays(form.date_planted, selectedPlant.harvest_days)
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
    <div
      className="bg-white border border-teal-200 rounded-3xl lg:rounded-2xl
                 shadow-xl p-6 space-y-4 animate-fadeIn"
      role="dialog"
      aria-label={`Edit slot ${slotId}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-teal-800 text-base lg:text-lg">
          Edit Slot {slotId}
        </h2>
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
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Calculated ETAs */}
        {selectedPlant && form.date_planted && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
              <p className="text-blue-400 uppercase font-bold tracking-wide text-[10px]">Germination</p>
              <p className="font-semibold text-blue-700 mt-0.5">{formatDate(germEta)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center">
              <p className="text-green-400 uppercase font-bold tracking-wide text-[10px]">Harvest ETA</p>
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
            max={new Date().toISOString().split("T")[0]}
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
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function TrackerSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading tracker…" aria-busy="true">
      <div className="flex gap-2">
        {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
      </div>
      {["A","B","C"].map((col) => (
        <div key={col} className="space-y-2">
          <Skeleton className="h-4 w-16 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ROWS.map((r) => <Skeleton key={r} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
