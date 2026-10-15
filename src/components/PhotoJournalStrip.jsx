import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "./ui/toast";
import { addSlotPhoto, listSlotPhotos, signedUrls, plantDay, plantingKey } from "../utils/slotPhotos";
import { todayLocal } from "../utils/date";

// Photo journal (beta) inside a Tracker slot's editor: this planting's
// photos so far, a button to add this week's, and a link to the timelapse.
export default function PhotoJournalStrip({ userId, slotId, slot, onChange }) {
  const { showToast } = useToast();
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const planted = Boolean(slot?.plant_name) && slot?.status !== "Empty";
  const key = plantingKey(slot?.plant_name, slot?.date_planted);

  async function refresh() {
    try {
      const rows = (await listSlotPhotos(userId, slotId)).filter((r) => plantingKey(r.plant_name, r.date_planted) === key);
      setPhotos(rows);
      setUrls(await signedUrls(rows.slice(-6).map((r) => r.storage_path)));
    } catch { /* feature not set up yet: show nothing */ }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId, slotId, key]);

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await addSlotPhoto({ userId, slotId, plantName: slot.plant_name, datePlanted: slot.date_planted, file });
      showToast({ title: `📷 Photo added to ${slotId}`, type: "success" });
      await refresh();
      onChange?.();
    } catch (err) {
      showToast({ title: "Couldn't add the photo", description: err.message, type: "error" });
    } finally {
      setBusy(false);
    }
  }

  const recent = photos.slice(-6);

  return (
    <section aria-labelledby={`pj-${slotId}`} className="border border-violet-200 bg-violet-50/60 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id={`pj-${slotId}`} className="text-xs font-bold uppercase tracking-wide text-violet-900">
          📷 Photo journal <span className="ml-1 rounded-full bg-violet-200 px-1.5 py-0.5 text-[9px]">Beta</span>
        </h3>
        {photos.length > 0 && (
          <Link to={`/tracker/journal/${slotId}`} className="text-xs font-semibold text-violet-900 underline">
            Timelapse ({photos.length}) →
          </Link>
        )}
      </div>

      {!planted ? (
        <p className="text-xs text-gray-600">Save a plant in this slot first, then add a photo each week to build its timelapse.</p>
      ) : (
        <>
          {recent.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Recent photos">
              {recent.map((p) => (
                <li key={p.id} className="shrink-0 text-center">
                  {urls[p.storage_path]
                    ? <img src={urls[p.storage_path]} alt={`${slotId} ${p.plant_name || ""} on ${p.taken_on}`} className="w-16 h-16 object-cover rounded-lg border border-violet-200 bg-white" />
                    : <div className="w-16 h-16 rounded-lg bg-violet-100" aria-hidden="true" />}
                  <span className="block text-[10px] font-semibold text-violet-900 mt-0.5">{plantDay(p) ? `Day ${plantDay(p)}` : p.taken_on}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-700">No photos yet. Snap one today: it becomes Day {plantDay({ date_planted: slot.date_planted, taken_on: todayLocal() }) ?? 1} of the timelapse.</p>
          )}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick}
                 aria-label={`Add a photo of slot ${slotId}`} tabIndex={-1} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="w-full py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-sm disabled:opacity-50">
            {busy ? "Uploading…" : "📷 Add this week's photo"}
          </button>
          <p className="text-[11px] text-gray-600">Tip: shoot from the same spot each week. Plants only, please: no student faces.</p>
        </>
      )}
    </section>
  );
}
