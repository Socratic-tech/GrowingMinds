import { useState } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "./ui/toast";
import { useTowers } from "../utils/towers";

// Tower picker for teachers with the 'multi_tower' switch (all Studios).
// Shows nothing for everyone else. `manage` adds rename / add / remove.
export default function TowerSwitcher({ userId, manage = false, label = "Tower" }) {
  const t = useTowers(userId);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null); // tower key
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  if (!t.ready || !t.enabled) return null;
  const keyOf = (x) => (x.is_primary ? "primary" : x.id);

  // The primary tower needs a towers row before others can be added/renamed.
  async function ensurePrimaryRow(name) {
    const p = t.towers[0];
    if (p.rowId) return true;
    const { error } = await supabase.from("towers").insert({ user_id: userId, name: name || p.name, is_primary: true, sort_order: 0 });
    if (error && !/duplicate/i.test(error.message)) { showToast({ title: "Couldn't set up towers", description: error.message, type: "error" }); return false; }
    return true;
  }

  async function add(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    if (await ensurePrimaryRow()) {
      const { data, error } = await supabase.from("towers")
        .insert({ user_id: userId, name, sort_order: t.towers.length }).select().single();
      if (error) showToast({ title: "Couldn't add the tower", description: /duplicate/i.test(error.message) ? "You already have a tower with that name." : error.message, type: "error" });
      else {
        setNewName("");
        await t.reload();
        t.setCurrent({ id: data.id, is_primary: false });
        showToast({ title: `🗼 ${name} added`, type: "success" });
      }
    }
    setBusy(false);
  }

  async function rename(tower, name) {
    name = name.trim();
    setRenaming(null);
    if (!name || name === tower.name) return;
    setBusy(true);
    let error;
    if (tower.is_primary && !tower.rowId) {
      ({ error } = await supabase.from("towers").insert({ user_id: userId, name, is_primary: true, sort_order: 0 }));
    } else {
      ({ error } = await supabase.from("towers").update({ name }).eq("id", tower.rowId));
    }
    if (error) showToast({ title: "Couldn't rename", description: /duplicate/i.test(error.message) ? "You already have a tower with that name." : error.message, type: "error" });
    await t.reload();
    setBusy(false);
  }

  async function remove(tower) {
    setBusy(true);
    const [slots, photos] = await Promise.all([
      supabase.from("tracker_slots").select("id", { count: "exact", head: true }).eq("tower_id", tower.id).not("plant_name", "is", null).neq("status", "Empty"),
      supabase.from("slot_photos").select("id", { count: "exact", head: true }).eq("tower_id", tower.id),
    ]);
    if ((slots.count || 0) > 0 || (photos.count || 0) > 0) {
      setBusy(false);
      setConfirmRemove(null);
      return showToast({ title: `${tower.name} still has plants or photos`, description: "Recycle its slots and delete its photos first.", type: "error" });
    }
    const { error } = await supabase.from("towers").delete().eq("id", tower.id);
    setBusy(false);
    setConfirmRemove(null);
    if (error) return showToast({ title: "Couldn't remove the tower", description: error.message, type: "error" });
    if (keyOf(t.current) === tower.id) t.setCurrent(t.towers[0]);
    await t.reload();
    showToast({ title: `${tower.name} removed`, type: "success" });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Choose a ${label.toLowerCase()}`}>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">🗼 {label}</span>
        {t.towers.map((x) => (
          <button key={keyOf(x)} type="button" onClick={() => t.setCurrent(x)} aria-pressed={keyOf(x) === t.currentKey}
            className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold min-h-[36px]
              ${keyOf(x) === t.currentKey ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"}`}>
            {x.name}
          </button>
        ))}
        {manage && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="text-xs font-semibold text-teal-800 underline min-h-[36px]">{open ? "Done" : "Manage towers"}</button>
        )}
      </div>

      {manage && open && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-2">
          <ul className="space-y-1.5">
            {t.towers.map((x) => (
              <li key={keyOf(x)} className="flex items-center gap-2">
                {renaming === keyOf(x) ? (
                  <form className="flex-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); rename(x, e.currentTarget.tname.value); }}>
                    <input name="tname" defaultValue={x.name} maxLength={40} autoFocus aria-label={`New name for ${x.name}`}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                    <button type="submit" className="text-xs font-semibold bg-teal-700 text-white rounded-lg px-3">Save</button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-gray-800">{x.name}{x.is_primary && <span className="ml-1 text-[10px] text-gray-500">(first tower)</span>}</span>
                    <button type="button" disabled={busy} onClick={() => setRenaming(keyOf(x))} className="text-xs underline text-teal-800">Rename</button>
                    {!x.is_primary && (confirmRemove === x.id ? (
                      <span className="text-xs">
                        <button type="button" disabled={busy} onClick={() => remove(x)} className="font-semibold text-white bg-red-700 rounded px-2 py-0.5 mr-1">Remove</button>
                        <button type="button" onClick={() => setConfirmRemove(null)} className="underline">Keep</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmRemove(x.id)} className="text-xs underline text-red-700">Remove</button>
                    ))}
                  </>
                )}
              </li>
            ))}
          </ul>
          {t.towers.length < 10 && (
            <form onSubmit={add} className="flex gap-2 pt-1">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} placeholder="New tower name, e.g. Library"
                aria-label="New tower name" className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              <button type="submit" disabled={busy || !newName.trim()} className="bg-teal-700 text-white text-sm font-semibold rounded-xl px-4 disabled:opacity-50">Add tower</button>
            </form>
          )}
          <p className="text-[11px] text-gray-500">Each tower gets its own 16 slots, maintenance list, photos, growth data and station code. A tower can be removed once it's empty.</p>
        </div>
      )}
    </div>
  );
}
