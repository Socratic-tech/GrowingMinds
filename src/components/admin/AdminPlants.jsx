import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase/client";
import { useToast } from "../ui/toast";
import { LIGHT_ZONE_META } from "../../config/gardyn";

// Admin → Plants: add, edit and remove the plants educators pick from in
// the Tracker and see in the Plant Library. Renaming a plant also renames
// it in every tracker slot and harvest entry (database trigger in
// supabase_admin_tools_2026-09.sql).

const CATEGORIES = ["Greens", "Herbs", "Fruits & Veggies", "Flowers"];
const ZONES = Object.keys(LIGHT_ZONE_META);

const EMPTY = {
  name: "", category: "Greens", light_zone: "", germination_days: "", harvest_days: "",
  thin_to: "", teacher_note: "", lesson_hook: "", best_use: "",
};

const toNum = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
};

const needsInfo = (p) => !p.light_zone || p.germination_days == null;

const inputCls = "w-full p-3 rounded-xl border border-gray-300 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600 bg-white";

export default function AdminPlants() {
  const { showToast } = useToast();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | plant id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("plants").select("*").order("name");
    if (error) showToast({ title: "Couldn't load plants", description: error.message, type: "error" });
    else setPlants(data || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const missingCount = plants.filter(needsInfo).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plants.filter((p) => {
      if (onlyMissing && !needsInfo(p)) return false;
      return !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    });
  }, [plants, query, onlyMissing]);

  function startEdit(p) {
    setEditing(p ? p.id : "new");
    setForm(p ? {
      name: p.name || "", category: p.category || "Greens", light_zone: p.light_zone || "",
      germination_days: p.germination_days ?? "", harvest_days: p.harvest_days ?? "",
      thin_to: p.thin_to ?? "", teacher_note: p.teacher_note || "", lesson_hook: p.lesson_hook || "",
      best_use: p.best_use || "",
    } : EMPTY);
    requestAnimationFrame(() => document.getElementById("plant-form-name")?.focus());
  }

  function cancel() {
    setEditing(null);
    setForm(EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showToast({ title: "Give the plant a name", type: "error" });
      return;
    }
    const dupe = plants.find((p) => p.name?.trim().toLowerCase() === name.toLowerCase() && p.id !== editing);
    if (dupe) {
      showToast({ title: `"${dupe.name}" is already in the list`, description: "Edit that one instead.", type: "error" });
      return;
    }
    const germ = toNum(form.germination_days);
    const harv = toNum(form.harvest_days);
    if (Number.isNaN(germ) || Number.isNaN(harv)) {
      showToast({ title: "Days must be whole numbers", type: "error" });
      return;
    }
    const original = editing !== "new" ? plants.find((p) => p.id === editing) : null;
    if (original && original.name !== name &&
        !window.confirm(`Rename "${original.name}" to "${name}"?\n\nEvery teacher's tracker slots and harvest entries using this plant will be renamed too.`)) {
      return;
    }
    const payload = {
      name,
      category: form.category,
      light_zone: form.light_zone || null,
      germination_days: germ,
      harvest_days: harv,
      thin_to: form.thin_to === "" ? null : form.thin_to,
      teacher_note: form.teacher_note.trim() || null,
      lesson_hook: form.lesson_hook.trim() || null,
      best_use: form.best_use.trim() || null,
    };
    setSaving(true);
    const res = editing === "new"
      ? await supabase.from("plants").insert(payload).select().single()
      : await supabase.from("plants").update(payload).eq("id", editing).select().single();
    setSaving(false);
    if (res.error) {
      showToast({ title: "Couldn't save plant", description: res.error.message, type: "error" });
      return;
    }
    showToast({ title: editing === "new" ? `Added ${name}` : `Saved ${name}`, type: "success" });
    setPlants((ps) => {
      const next = editing === "new" ? [...ps, res.data] : ps.map((p) => (p.id === editing ? res.data : p));
      return next.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    cancel();
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}" from the plant list?\n\nTeachers who already planted it keep it in their tracker, but it won't be in the list to pick anymore.`)) return;
    const { data, error } = await supabase.from("plants").delete().eq("id", p.id).select("id");
    if (error || !data?.length) {
      showToast({ title: "Couldn't delete plant", description: error?.message || "No permission.", type: "error" });
      return;
    }
    setPlants((ps) => ps.filter((x) => x.id !== p.id));
    showToast({ title: `Deleted ${p.name}`, type: "success" });
    if (editing === p.id) cancel();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const formEl = (
    <form onSubmit={save} className="bg-white border border-teal-200 rounded-2xl shadow-md p-5 space-y-4" aria-label={editing === "new" ? "Add a plant" : "Edit plant"}>
      <h3 className="font-bold text-teal-800">{editing === "new" ? "Add a plant" : `Edit ${form.name || "plant"}`}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-gray-600 space-y-1 sm:col-span-2">
          <span>Name</span>
          <input id="plant-form-name" className={inputCls} value={form.name} onChange={set("name")} maxLength={80} required />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1">
          <span>Category</span>
          <select className={inputCls} value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            {!CATEGORIES.includes(form.category) && form.category && <option>{form.category}</option>}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1">
          <span>Light zone</span>
          <select className={inputCls} value={form.light_zone} onChange={set("light_zone")}>
            <option value="">Not set</option>
            {ZONES.map((z) => <option key={z} value={z}>{LIGHT_ZONE_META[z].label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1">
          <span>Days to germinate</span>
          <input className={inputCls} inputMode="numeric" value={form.germination_days} onChange={set("germination_days")} placeholder="e.g. 7" />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1">
          <span>Days to first harvest</span>
          <input className={inputCls} inputMode="numeric" value={form.harvest_days} onChange={set("harvest_days")} placeholder="e.g. 45" />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1">
          <span>Thin to</span>
          <input className={inputCls} value={form.thin_to} onChange={set("thin_to")} placeholder="e.g. 1" />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1 sm:col-span-2">
          <span>Teacher note</span>
          <textarea className={inputCls} rows={2} value={form.teacher_note} onChange={set("teacher_note")} />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1 sm:col-span-2">
          <span>Lesson hook</span>
          <textarea className={inputCls} rows={2} value={form.lesson_hook} onChange={set("lesson_hook")} placeholder="A question that gets students curious" />
        </label>
        <label className="text-xs font-semibold text-gray-600 space-y-1 sm:col-span-2">
          <span>Best classroom use</span>
          <textarea className={inputCls} rows={2} value={form.best_use} onChange={set("best_use")} />
        </label>
      </div>
      <p className="text-xs text-gray-500">Price, care level and the Gardyn store link come from the Gardyn catalog refresh and aren't edited here.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
          {saving ? "Saving…" : "Save plant"}
        </button>
        <button type="button" onClick={cancel} className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
      </div>
    </form>
  );

  return (
    <section aria-labelledby="plants-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="plants-title" className="text-xs lg:text-sm uppercase tracking-widest font-bold text-teal-700">
          🌱 Plants ({plants.length})
        </h2>
        <button type="button" onClick={() => startEdit(null)} className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2">
          + Add plant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="plant-search" className="sr-only">Search plants</label>
        <input id="plant-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plants…" className={`${inputCls} flex-1`} />
        <button
          type="button"
          aria-pressed={onlyMissing}
          onClick={() => setOnlyMissing((v) => !v)}
          className={`text-xs font-semibold rounded-xl px-3 py-2 border whitespace-nowrap
            ${onlyMissing ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
        >
          Needs light zone or germination ({missingCount})
        </button>
      </div>

      {editing === "new" && formEl}
      {loading && <p className="text-center text-gray-500">Loading plants…</p>}
      {!loading && shown.length === 0 && <p className="text-sm text-gray-500 italic pl-1">No plants match.</p>}

      <ul className="space-y-2">
        {shown.map((p) => (
          <li key={p.id}>
            {editing === p.id ? formEl : (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {p.name}
                    {p.in_gardyn_store === false && <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-semibold">not in store</span>}
                  </p>
                  <p className="text-xs text-gray-600">
                    {[p.category, LIGHT_ZONE_META[p.light_zone]?.label, p.germination_days != null && `${p.germination_days}d germ.`, p.harvest_days != null && `${p.harvest_days}d harvest`].filter(Boolean).join(" · ")}
                  </p>
                  {needsInfo(p) && (
                    <p className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
                        missing {[!p.light_zone && "light zone", p.germination_days == null && "germination days"].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`} className="text-xs font-semibold text-teal-800 border border-teal-200 rounded-xl px-3 py-2 hover:bg-teal-50">Edit</button>
                  <button type="button" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="text-xs font-semibold text-red-700 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50">Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
