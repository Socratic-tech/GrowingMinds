import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";
import { isValidSlotId, LIGHT_ZONE_META, getSlotLightZone } from "../config/gardyn";
import { formatLocalDate } from "../utils/date";
import { useBeta } from "../utils/beta";
import { listSlotPhotos, signedUrls, deleteSlotPhoto, plantDay, groupPlantings } from "../utils/slotPhotos";
import { supabase } from "../supabase/client";

// Photo journal (beta): a timelapse of one Tracker slot, one planting at a time.
const SPEEDS = [["Slow", 1500], ["Normal", 800], ["Fast", 350]];

export default function SlotJournal() {
  const { slotId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const beta = useBeta(user?.id, "photo_journal");
  const [rows, setRows] = useState(null);
  const [urls, setUrls] = useState({});
  const [plantingKey, setPlantingKey] = useState(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await listSlotPhotos(user.id, slotId);
      setRows(r);
      setUrls(await signedUrls(r.map((p) => p.storage_path)));
    } catch {
      setRows([]);
    }
  }, [user?.id, slotId]);
  useEffect(() => { if (user?.id && isValidSlotId(slotId)) load(); }, [load, user?.id, slotId]);

  const plantings = useMemo(() => groupPlantings(rows || []), [rows]);
  const current = plantings.find((p) => p.key === plantingKey) || plantings[0];
  const photos = current?.photos || [];
  const shown = photos[Math.min(frame, Math.max(photos.length - 1, 0))];

  // Preload so playback doesn't flicker.
  useEffect(() => { for (const p of photos) { const u = urls[p.storage_path]; if (u) { const i = new Image(); i.src = u; } } }, [photos, urls]);

  useEffect(() => {
    if (!playing || photos.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % photos.length), speed);
    return () => clearInterval(t);
  }, [playing, speed, photos.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, button")) return;
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "ArrowRight") { setPlaying(false); setFrame((f) => Math.min(f + 1, photos.length - 1)); }
      if (e.key === "ArrowLeft") { setPlaying(false); setFrame((f) => Math.max(f - 1, 0)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);

  async function remove(p) {
    try {
      await deleteSlotPhoto(p);
      setConfirmDelete(null);
      setFrame(0);
      await load();
      showToast({ title: "Photo deleted", type: "success" });
    } catch (e) {
      showToast({ title: "Couldn't delete the photo", description: e.message, type: "error" });
    }
  }

  async function saveCaption(p, caption) {
    const { error } = await supabase.from("slot_photos").update({ caption: caption.trim() || null }).eq("id", p.id);
    if (error) return showToast({ title: "Couldn't save the caption", description: error.message, type: "error" });
    setEditingCaption(null);
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, caption: caption.trim() || null } : r)));
  }

  if (!isValidSlotId(slotId)) return <p className="text-sm text-gray-600">That slot doesn't exist. <Link className="underline" to="/tracker">Back to the Tracker</Link></p>;

  const zone = LIGHT_ZONE_META[getSlotLightZone(slotId)];
  const label = (p) => [plantDay(p) ? `Day ${plantDay(p)}` : null, formatLocalDate(p.taken_on, { month: "short", day: "numeric", year: "numeric" })].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5 pb-24">
      <div className="space-y-2">
        <Link to="/tracker" className="text-xs font-semibold text-teal-800 underline">← Slot Tracker</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-violet-100 text-violet-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">📷</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
              Slot {slotId} photo journal <span className="align-middle text-[10px] font-bold uppercase rounded-full bg-violet-200 text-violet-900 px-2 py-0.5">Beta</span>
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">{zone.label} · add photos from the slot's editor in the Tracker</p>
          </div>
        </div>
      </div>

      {rows === null ? (
        <p className="text-sm text-gray-500">Loading photos…</p>
      ) : !photos.length ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-3xl" aria-hidden="true">🌱</p>
          <p className="font-semibold text-gray-800">No photos of {slotId} yet.</p>
          <p className="text-sm text-gray-600">
            {beta ? <>Open slot {slotId} in the <Link className="underline font-semibold text-teal-800" to="/tracker">Tracker</Link> and tap “Add this week's photo”.</>
                  : "The photo journal is a beta feature. Ask your Growing Minds admin to turn it on for you."}
          </p>
        </div>
      ) : (
        <>
          {plantings.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a planting">
              {plantings.map((p) => (
                <button key={p.key} type="button" aria-pressed={p.key === current.key}
                  onClick={() => { setPlantingKey(p.key); setFrame(0); setPlaying(false); }}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${p.key === current.key ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-700 border-gray-300"}`}>
                  {p.plant_name || "Unlabeled"}{p.date_planted ? ` · planted ${formatLocalDate(p.date_planted)}` : ""} ({p.photos.length})
                </button>
              ))}
            </div>
          )}

          {/* Player */}
          <section aria-label="Timelapse" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="relative bg-gray-900 aspect-[4/3]">
              {urls[shown.storage_path]
                ? <img src={urls[shown.storage_path]} alt={`${current.plant_name || "Plant"} in ${slotId}, ${label(shown)}`} className="absolute inset-0 w-full h-full object-contain" />
                : <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Photo unavailable</div>}
              <div className="absolute left-3 top-3 rounded-xl bg-black/60 text-white px-3 py-1.5">
                <p className="text-lg font-bold leading-tight">{plantDay(shown) ? `Day ${plantDay(shown)}` : formatLocalDate(shown.taken_on)}</p>
                <p className="text-[11px] opacity-90">{current.plant_name || "Plant"} · {slotId} · {formatLocalDate(shown.taken_on, { month: "short", day: "numeric" })}</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <input type="range" min={0} max={Math.max(photos.length - 1, 0)} value={Math.min(frame, photos.length - 1)}
                onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }}
                className="w-full accent-teal-700" aria-label="Photo" aria-valuetext={label(shown)} />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setPlaying(false); setFrame((f) => Math.max(f - 1, 0)); }} className="px-3 py-2 rounded-xl border border-gray-300 text-sm" aria-label="Previous photo">⏮</button>
                <button type="button" onClick={() => { if (frame >= photos.length - 1) setFrame(0); setPlaying((p) => !p); }} disabled={photos.length < 2}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm disabled:opacity-40">
                  {playing ? "⏸ Pause" : "▶ Play timelapse"}
                </button>
                <button type="button" onClick={() => { setPlaying(false); setFrame((f) => Math.min(f + 1, photos.length - 1)); }} className="px-3 py-2 rounded-xl border border-gray-300 text-sm" aria-label="Next photo">⏭</button>
                <label className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  Speed
                  <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs">
                    {SPEEDS.map(([t, ms]) => <option key={ms} value={ms}>{t}</option>)}
                  </select>
                </label>
                <span className="text-xs text-gray-500">{Math.min(frame, photos.length - 1) + 1} / {photos.length}</span>
              </div>
              {shown.caption && <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2">“{shown.caption}”</p>}
            </div>
          </section>

          {/* All photos */}
          <section aria-labelledby="all-photos" className="space-y-2">
            <h2 id="all-photos" className="text-xs uppercase tracking-widest font-bold text-gray-500">All photos of this planting</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <li key={p.id} className={`bg-white border rounded-2xl overflow-hidden ${i === frame ? "border-teal-500 ring-2 ring-teal-200" : "border-gray-200"}`}>
                  <button type="button" onClick={() => { setPlaying(false); setFrame(i); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="block w-full aspect-[4/3] bg-gray-100">
                    {urls[p.storage_path] && <img src={urls[p.storage_path]} alt={`${label(p)}`} className="w-full h-full object-cover" />}
                  </button>
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-bold text-gray-800">{label(p)}</p>
                    {editingCaption === p.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); saveCaption(p, e.currentTarget.caption.value); }} className="space-y-1">
                        <input name="caption" defaultValue={p.caption || ""} maxLength={280} autoFocus placeholder="What changed this week?"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs" aria-label="Caption" />
                        <div className="flex gap-1">
                          <button type="submit" className="text-[11px] font-semibold bg-teal-700 text-white rounded-lg px-2 py-1">Save</button>
                          <button type="button" onClick={() => setEditingCaption(null)} className="text-[11px] border border-gray-300 rounded-lg px-2 py-1">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-[11px] text-gray-600 line-clamp-2">{p.caption || <span className="italic text-gray-400">No caption</span>}</p>
                    )}
                    {confirmDelete === p.id ? (
                      <div className="flex gap-1 items-center">
                        <span className="text-[11px] text-red-800 font-semibold">Delete?</span>
                        <button type="button" onClick={() => remove(p)} className="text-[11px] font-semibold bg-red-700 text-white rounded-lg px-2 py-1">Yes</button>
                        <button type="button" onClick={() => setConfirmDelete(null)} className="text-[11px] border border-gray-300 rounded-lg px-2 py-1">No</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {editingCaption !== p.id && <button type="button" onClick={() => setEditingCaption(p.id)} className="text-[11px] font-semibold text-teal-800 underline">Caption</button>}
                        <button type="button" onClick={() => setConfirmDelete(p.id)} className="text-[11px] font-semibold text-red-700 underline">Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
