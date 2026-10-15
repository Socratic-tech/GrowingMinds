import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "./ui/toast";
import { formatLocalDate, todayLocal } from "../utils/date";
import { plantDay, plantingKey } from "../utils/slotPhotos";
import MiniLineChart from "./MiniLineChart";

// Growth data (beta) for one planting in one slot: height and leaf-count
// charts, the full table, and a quick "add a measurement" form. Students
// add rows from the class station; teachers can add or delete here.
export default function GrowthPanel({ userId, slotId, planting }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ height: "", leaves: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("slot_measurements").select("*")
      .eq("user_id", userId).eq("slot_id", slotId).order("measured_on").order("created_at");
    setRows(error ? [] : data || []);
  }, [userId, slotId]);
  useEffect(() => { load(); }, [load]);

  if (rows === null) return null;
  const key = planting ? plantingKey(planting.plant_name, planting.date_planted) : null;
  const mine = rows.filter((r) => !key || plantingKey(r.plant_name, r.date_planted) === key);
  const day = (r) => plantDay({ date_planted: r.date_planted, taken_on: r.measured_on });
  const pts = (field) => mine.filter((r) => r[field] != null && day(r) != null)
    .map((r) => ({ x: day(r), y: Number(r[field]), label: r.team || (r.source === "station" ? "Class station" : "Teacher") }));

  async function add(e) {
    e.preventDefault();
    if (!planting?.plant_name) return;
    const height = form.height === "" ? null : Number(form.height);
    const leaves = form.leaves === "" ? null : Number(form.leaves);
    if (height == null && leaves == null && !form.note.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("slot_measurements").insert({
      user_id: userId, slot_id: slotId, plant_name: planting.plant_name, date_planted: planting.date_planted,
      measured_on: todayLocal(), height_cm: height, leaf_count: leaves, note: form.note.trim() || null,
    });
    setSaving(false);
    if (error) return showToast({ title: "Couldn't save the measurement", description: error.message, type: "error" });
    setForm({ height: "", leaves: "", note: "" });
    showToast({ title: "📏 Measurement saved", type: "success" });
    load();
  }

  async function remove(r) {
    const { error } = await supabase.from("slot_measurements").delete().eq("id", r.id);
    if (error) return showToast({ title: "Couldn't delete", description: error.message, type: "error" });
    setConfirm(null);
    load();
  }

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm";

  return (
    <section aria-labelledby="growth-data" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="growth-data" className="font-bold text-teal-800">📏 Growth data <span className="text-[10px] font-bold uppercase rounded-full bg-violet-200 text-violet-900 px-2 py-0.5 align-middle">Beta</span></h2>
        <span className="text-xs text-gray-500">{mine.length} measurement{mine.length === 1 ? "" : "s"}{planting?.plant_name ? ` · ${planting.plant_name}` : ""}</span>
      </div>

      {mine.length === 0 ? (
        <p className="text-sm text-gray-600">No measurements yet. Students can add them from the class station, or add one below.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pts("height_cm").length > 0 && <MiniLineChart title="Height (cm)" unit=" cm" points={pts("height_cm")} />}
          {pts("leaf_count").length > 0 && <MiniLineChart title="Leaf count" unit=" leaves" points={pts("leaf_count")} />}
        </div>
      )}

      {planting?.plant_name && (
        <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <label className="text-xs font-semibold text-gray-600">Height (cm)
            <input type="number" inputMode="decimal" min="0" max="300" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={input} />
          </label>
          <label className="text-xs font-semibold text-gray-600">Leaves
            <input type="number" inputMode="numeric" min="0" max="999" step="1" value={form.leaves} onChange={(e) => setForm({ ...form, leaves: e.target.value })} className={input} />
          </label>
          <label className="text-xs font-semibold text-gray-600 col-span-2 sm:col-span-1">Note
            <input type="text" maxLength={280} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={input} placeholder="optional" />
          </label>
          <button type="submit" disabled={saving} className="col-span-2 sm:col-span-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Add today"}
          </button>
        </form>
      )}

      {mine.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">All measurements</caption>
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th scope="col" className="py-1.5 pr-2 font-semibold">Date</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">Day</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold text-right">Height</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold text-right">Leaves</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">By</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">Note</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {[...mine].reverse().map((r) => (
                <tr key={r.id} className="border-b border-gray-100 align-top">
                  <td className="py-1.5 pr-2 whitespace-nowrap">{formatLocalDate(r.measured_on)}</td>
                  <td className="py-1.5 pr-2">{day(r) ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{r.height_cm != null ? `${Number(r.height_cm)} cm` : "—"}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{r.leaf_count ?? "—"}</td>
                  <td className="py-1.5 pr-2">{r.team || (r.source === "station" ? "Station" : "Teacher")}</td>
                  <td className="py-1.5 pr-2 text-gray-600">{r.note || ""}</td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    {confirm === r.id ? (
                      <>
                        <button type="button" onClick={() => remove(r)} className="text-[11px] font-semibold text-white bg-red-700 rounded px-1.5 py-0.5 mr-1">Delete</button>
                        <button type="button" onClick={() => setConfirm(null)} className="text-[11px] underline">Keep</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirm(r.id)} className="text-[11px] text-red-700 underline" aria-label={`Delete measurement from ${r.measured_on}`}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
