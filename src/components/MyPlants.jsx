import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "./ui/toast";
import { LIGHT_ZONE_META } from "../config/gardyn";
import { CUSTOM_CATEGORIES } from "../utils/customPlants";

// "My plants" on the Plants tab (every approved teacher): a teacher's
// own plants for their Tracker. Private to them; "Suggest for everyone"
// sends one to the Growing Minds admins for the shared catalog.
const EMPTY = { name: "", category: "Greens", light_zone: "", germination_days: "", harvest_days: "", notes: "" };
const SUGGESTION = {
  private: null,
  suggested: { text: "Suggested", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  added: { text: "Added to the catalog 🎉", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  declined: { text: "Kept private", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default function MyPlants({ userId, rows, reload, catalogNames, autoOpen }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(autoOpen || false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // id or null
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (autoOpen) { setOpen(true); ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } }, [autoOpen]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const num = (v) => (v === "" ? null : Math.round(Number(v)));

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    if (catalogNames.has(name.toLowerCase())) {
      return showToast({ title: `${name} is already in the plant list`, description: "Pick it from the list instead.", type: "error" });
    }
    setBusy(true);
    const row = {
      name, category: form.category || null, light_zone: form.light_zone || null,
      germination_days: num(form.germination_days), harvest_days: num(form.harvest_days), notes: form.notes.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("custom_plants").update(row).eq("id", editing)
      : await supabase.from("custom_plants").insert({ ...row, user_id: userId });
    setBusy(false);
    if (error) {
      return showToast({ title: "Couldn't save the plant", description: /duplicate/i.test(error.message) ? "You already have a plant with that name." : error.message, type: "error" });
    }
    showToast({ title: editing ? "Plant updated" : `🌱 ${name} added to your plants`, type: "success" });
    setForm(EMPTY); setEditing(null);
    reload();
  }

  async function suggest(p) {
    const { error } = await supabase.from("custom_plants").update({ suggestion: "suggested" }).eq("id", p.id);
    if (error) return showToast({ title: "Couldn't send the suggestion", description: error.message, type: "error" });
    showToast({ title: "Thanks! Sent to the Growing Minds team", type: "success" });
    reload();
  }

  async function remove(p) {
    const { error } = await supabase.from("custom_plants").delete().eq("id", p.id);
    if (error) return showToast({ title: "Couldn't delete", description: error.message, type: "error" });
    reload();
  }

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white";

  return (
    <section ref={ref} aria-labelledby="my-plants" className="bg-white border border-teal-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 id="my-plants" className="font-bold text-teal-800">🪴 My plants <span className="text-xs font-normal text-gray-500">({rows.length})</span></h2>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-xs font-semibold text-teal-800 underline">
          {open ? "Hide" : rows.length ? "Show / add" : "Add your own plant"}
        </button>
      </div>
      {!open ? (
        <p className="text-xs text-gray-600">Growing something that's not in the list? Add it here and it shows up in your Tracker's plant picker.</p>
      ) : (
        <>
          {rows.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {rows.map((p) => (
                <li key={p.id} className="py-2 flex flex-wrap items-center gap-2">
                  <span className="flex-1 min-w-[10rem]">
                    <span className="block text-sm font-semibold text-gray-900">{p.name}</span>
                    <span className="block text-xs text-gray-600">
                      {[p.category, LIGHT_ZONE_META[p.light_zone]?.label, p.germination_days != null && `${p.germination_days}d to sprout`, p.harvest_days != null && `${p.harvest_days}d to harvest`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {SUGGESTION[p.suggestion] && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${SUGGESTION[p.suggestion].cls}`}>{SUGGESTION[p.suggestion].text}</span>}
                  {p.suggestion === "private" && <button type="button" onClick={() => suggest(p)} className="text-xs underline text-teal-800">Suggest for everyone</button>}
                  <button type="button" onClick={() => { setEditing(p.id); setForm({ name: p.name, category: p.category || "Greens", light_zone: p.light_zone || "", germination_days: p.germination_days ?? "", harvest_days: p.harvest_days ?? "", notes: p.notes || "" }); }} className="text-xs underline text-gray-700">Edit</button>
                  <button type="button" onClick={() => remove(p)} className="text-xs underline text-red-700">Delete</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={save} className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="col-span-2 sm:col-span-3 text-xs font-bold text-gray-700">{editing ? "Edit plant" : "Add a plant"}</p>
            <label className="col-span-2 sm:col-span-1 text-xs font-semibold text-gray-600">Name
              <input value={form.name} onChange={set("name")} maxLength={60} required className={input} placeholder="e.g. Grandma's tomato" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Category
              <select value={form.category} onChange={set("category")} className={input}>
                {CUSTOM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600">Light it needs
              <select value={form.light_zone} onChange={set("light_zone")} className={input}>
                <option value="">Not sure</option>
                {Object.entries(LIGHT_ZONE_META).map(([z, m]) => <option key={z} value={z}>{m.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600">Days to sprout
              <input type="number" min="0" max="120" value={form.germination_days} onChange={set("germination_days")} className={input} placeholder="e.g. 7" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Days to first harvest
              <input type="number" min="0" max="400" value={form.harvest_days} onChange={set("harvest_days")} className={input} placeholder="e.g. 45" />
            </label>
            <label className="col-span-2 sm:col-span-3 text-xs font-semibold text-gray-600">Notes (optional)
              <input value={form.notes} onChange={set("notes")} maxLength={500} className={input} placeholder="Where the seeds came from, tips…" />
            </label>
            <div className="col-span-2 sm:col-span-3 flex gap-2">
              <button type="submit" disabled={busy} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-50">{editing ? "Save changes" : "Add plant"}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="text-sm underline text-gray-700">Cancel</button>}
            </div>
          </form>
          <p className="text-[11px] text-gray-500">Days and light level power the Tracker's harvest dates and light-match tips. Only you see your plants unless you suggest one.</p>
        </>
      )}
    </section>
  );
}
