import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";

const SLOT_IDS = ["A","B","C"].flatMap((c) =>
  [1,2,3,4,5,6,7,8,9,10].map((r) => `${c}${r}`)
);

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Main component ─────────────────────────────────────── */
export default function HarvestLog() {
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [entries,  setEntries]  = useState([]);
  const [plants,   setPlants]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    harvest_date: new Date().toISOString().split("T")[0],
    plant_name:   "",
    slot_id:      "",
    student_team: "",
    amount_grams: "",
    notes:        "",
  });

  /* ── Load data ───────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    const [logRes, plantRes] = await Promise.all([
      supabase
        .from("harvest_log")
        .select("*")
        .eq("user_id", user.id)
        .order("harvest_date", { ascending: false }),
      supabase
        .from("plants")
        .select("name, category")
        .order("name"),
    ]);

    if (logRes.error) {
      showToast({ title: "Failed to load harvest log", description: logRes.error.message, type: "error" });
    } else {
      setEntries(logRes.data || []);
    }

    if (!plantRes.error) {
      setPlants(plantRes.data || []);
    }

    setLoading(false);
  }, [user.id, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Submit new entry ────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.plant_name.trim()) {
      showToast({ title: "Please select a plant", type: "error" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("harvest_log").insert({
      user_id:      user.id,
      harvest_date: form.harvest_date,
      plant_name:   form.plant_name,
      slot_id:      form.slot_id   || null,
      student_team: form.student_team || null,
      amount_grams: form.amount_grams ? parseFloat(form.amount_grams) : null,
      notes:        form.notes     || null,
    });

    if (error) {
      showToast({ title: "Failed to log harvest", description: error.message, type: "error" });
    } else {
      showToast({ title: "Harvest logged!", type: "success" });
      setForm({
        harvest_date: new Date().toISOString().split("T")[0],
        plant_name: "", slot_id: "", student_team: "",
        amount_grams: "", notes: "",
      });
      setShowForm(false);
      loadData();
    }
    setSaving(false);
  }

  /* ── Delete entry ────────────────────────────────────────── */
  async function deleteEntry(id) {
    if (!confirm("Delete this harvest entry?")) return;
    const { error } = await supabase.from("harvest_log").delete().eq("id", id);
    if (error) {
      showToast({ title: "Failed to delete entry", description: error.message, type: "error" });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  /* ── Summary stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalGrams   = entries.reduce((s, e) => s + (e.amount_grams || 0), 0);
    const plantCounts  = {};
    entries.forEach((e) => {
      plantCounts[e.plant_name] = (plantCounts[e.plant_name] || 0) + 1;
    });
    const topPlant = Object.entries(plantCounts).sort((a, b) => b[1] - a[1])[0];
    return { count: entries.length, totalGrams, topPlant: topPlant?.[0] || null };
  }, [entries]);

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
            🌾
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
              Harvest Log
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track every yield from your Gardyn
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          aria-label={showForm ? "Cancel" : "Log a harvest"}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl
                     text-xs lg:text-sm font-semibold shadow-md min-h-[44px]
                     focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          {showForm ? "Cancel" : "+ Log Harvest"}
        </button>
      </div>

      {loading ? (
        <HarvestSkeleton />
      ) : (
        <>
          {/* ── Summary cards ──────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Harvests" value={stats.count} icon="📦" />
            <StatCard
              label="Total Yield"
              value={stats.totalGrams > 0 ? `${stats.totalGrams.toFixed(0)}g` : "—"}
              icon="⚖️"
            />
            <StatCard label="Top Plant" value={stats.topPlant || "—"} icon="🏆" small />
          </div>

          {/* ── Log form ───────────────────────────────────── */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-teal-200 rounded-3xl lg:rounded-2xl
                         p-6 shadow-md space-y-4 animate-fadeIn"
              aria-label="Log a harvest"
            >
              <h2 className="font-bold text-teal-800 text-base">Log a Harvest</h2>

              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label htmlFor="h-date" className="block text-xs font-semibold text-gray-600 mb-1">
                    Harvest Date
                  </label>
                  <input
                    id="h-date"
                    type="date"
                    value={form.harvest_date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm
                               shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
                    required
                  />
                </div>

                {/* Slot */}
                <div>
                  <label htmlFor="h-slot" className="block text-xs font-semibold text-gray-600 mb-1">
                    Slot (optional)
                  </label>
                  <select
                    id="h-slot"
                    value={form.slot_id}
                    onChange={(e) => setForm({ ...form, slot_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white
                               shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <option value="">— Any —</option>
                    {SLOT_IDS.map((id) => <option key={id}>{id}</option>)}
                  </select>
                </div>
              </div>

              {/* Plant */}
              <div>
                <label htmlFor="h-plant" className="block text-xs font-semibold text-gray-600 mb-1">
                  Plant *
                </label>
                <select
                  id="h-plant"
                  value={form.plant_name}
                  onChange={(e) => setForm({ ...form, plant_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white
                             shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
                  required
                >
                  <option value="">— Select plant —</option>
                  {plants.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Student / Team */}
                <div>
                  <label htmlFor="h-team" className="block text-xs font-semibold text-gray-600 mb-1">
                    Student / Team
                  </label>
                  <input
                    id="h-team"
                    type="text"
                    placeholder="e.g. Team Basil"
                    value={form.student_team}
                    onChange={(e) => setForm({ ...form, student_team: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm
                               shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="h-grams" className="block text-xs font-semibold text-gray-600 mb-1">
                    Amount (grams)
                  </label>
                  <input
                    id="h-grams"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={form.amount_grams}
                    onChange={(e) => setForm({ ...form, amount_grams: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm
                               shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="h-notes" className="block text-xs font-semibold text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  id="h-notes"
                  rows={2}
                  placeholder="Tasting notes, student reactions, next steps…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm
                             shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl
                           font-semibold text-sm disabled:opacity-50 transition-colors
                           focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                {saving ? "Saving…" : "Save Harvest"}
              </button>
            </form>
          )}

          {/* ── Entry list ─────────────────────────────────── */}
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🌾</p>
              <p className="text-sm">No harvests logged yet.</p>
              <p className="text-xs mt-1">Hit "+ Log Harvest" after your first pick.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-24">
              {entries.map((entry) => (
                <HarvestEntry key={entry.id} entry={entry} onDelete={deleteEntry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Harvest Entry Card ─────────────────────────────────── */
function HarvestEntry({ entry, onDelete }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4
                 flex items-start justify-between gap-3"
      role="group"
      aria-label={`Harvest: ${entry.plant_name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm lg:text-base">
            {entry.plant_name}
          </p>
          {entry.slot_id && (
            <span className="text-[10px] font-bold uppercase tracking-wider
                             bg-teal-50 text-teal-700 border border-teal-200
                             px-2 py-0.5 rounded-full">
              {entry.slot_id}
            </span>
          )}
          {entry.amount_grams != null && (
            <span className="text-[10px] font-bold text-gray-500">
              {entry.amount_grams}g
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
          <span>{formatDate(entry.harvest_date)}</span>
          {entry.student_team && <span>👤 {entry.student_team}</span>}
        </div>

        {entry.notes && (
          <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
            {entry.notes}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(entry.id)}
        aria-label={`Delete harvest of ${entry.plant_name}`}
        className="w-9 h-9 flex items-center justify-center rounded-xl
                   text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0
                   focus-visible:ring-2 focus-visible:ring-red-500"
      >
        🗑️
      </button>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, icon, small }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 text-center">
      <p className="text-lg" aria-hidden="true">{icon}</p>
      <p className={`font-bold text-teal-700 mt-1 ${small ? "text-sm leading-tight" : "text-xl lg:text-2xl"}`}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function HarvestSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading harvest log…" aria-busy="true">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      {[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
    </div>
  );
}
