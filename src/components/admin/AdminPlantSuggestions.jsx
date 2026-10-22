import { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";
import { useToast } from "../ui/toast";
import { displayName } from "../../utils/displayName";
import { LIGHT_ZONE_META } from "../../config/gardyn";

// Admin → Plants: teachers' "Suggest for everyone" custom plants.
// "Add to catalog" copies it into the shared plants table (for everyone);
// "Keep private" leaves it with that teacher.
export default function AdminPlantSuggestions({ users = [], onAdded }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);

  async function load() {
    const { data, error } = await supabase.from("custom_plants").select("*").eq("suggestion", "suggested").order("created_at");
    setRows(error ? [] : data || []);
  }
  useEffect(() => { load(); }, []);

  if (!rows || rows.length === 0) return null;
  const who = (id) => { const u = users.find((x) => x.id === id); return u ? displayName(u) : "A teacher"; };

  async function add(p) {
    setBusy(p.id);
    const { error } = await supabase.from("plants").insert({
      name: p.name.trim(), category: p.category, light_zone: p.light_zone,
      germination_days: p.germination_days, harvest_days: p.harvest_days,
      teacher_note: p.notes, in_gardyn_store: false,
    });
    if (error && !/duplicate/i.test(error.message)) { setBusy(null); return showToast({ title: "Couldn't add to the catalog", description: error.message, type: "error" }); }
    await supabase.from("custom_plants").update({ suggestion: "added" }).eq("id", p.id);
    setBusy(null);
    showToast({ title: `${p.name} added for everyone`, type: "success" });
    load(); onAdded?.();
  }

  async function decline(p) {
    setBusy(p.id);
    await supabase.from("custom_plants").update({ suggestion: "declined" }).eq("id", p.id);
    setBusy(null);
    load();
  }

  return (
    <section aria-labelledby="plant-suggestions" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
      <h2 id="plant-suggestions" className="font-bold text-amber-900">🌱 Teacher plant suggestions ({rows.length})</h2>
      <ul className="divide-y divide-amber-200">
        {rows.map((p) => (
          <li key={p.id} className="py-2 flex flex-wrap items-center gap-2">
            <span className="flex-1 min-w-[12rem]">
              <span className="block text-sm font-semibold text-gray-900">{p.name}</span>
              <span className="block text-xs text-gray-700">
                {[p.category, LIGHT_ZONE_META[p.light_zone]?.label, p.germination_days != null && `${p.germination_days}d sprout`, p.harvest_days != null && `${p.harvest_days}d harvest`].filter(Boolean).join(" · ")}
                {" · from "}{who(p.user_id)}
              </span>
              {p.notes && <span className="block text-xs text-gray-600 italic">“{p.notes}”</span>}
            </span>
            <button type="button" disabled={busy === p.id} onClick={() => add(p)} className="text-xs font-semibold bg-teal-700 text-white rounded-xl px-3 py-1.5 disabled:opacity-50">Add to catalog</button>
            <button type="button" disabled={busy === p.id} onClick={() => decline(p)} className="text-xs underline text-gray-700">Keep private</button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-amber-900">Added plants are marked “not in the Gardyn store”, so the weekly Gardyn sync leaves them alone.</p>
    </section>
  );
}
