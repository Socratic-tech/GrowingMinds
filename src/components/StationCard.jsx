import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "./ui/toast";

// Tracker card (beta): the teacher's class code for the student data
// station, a link to open on a classroom tablet, on/off, and a CSV export.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
function newCode() {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return [...a].map((n) => ALPHABET[n % ALPHABET.length]).join("");
}
const stationUrl = (code) => `${window.location.origin}${window.location.pathname}#/station?code=${code}`;

function toCsv(rows) {
  const cols = ["measured_on", "slot_id", "plant_name", "date_planted", "height_cm", "leaf_count", "team", "note", "source"];
  const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export default function StationCard({ userId }) {
  const { showToast } = useToast();
  const [station, setStation] = useState(undefined); // undefined = loading, null = none
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    supabase.from("class_stations").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data, error }) => { setStation(error ? null : data); setLabel(data?.label || ""); });
  }, [userId]);

  async function save(patch, okMsg) {
    setBusy(true);
    for (let tries = 0; tries < 3; tries++) {
      const row = { user_id: userId, code: station?.code || newCode(), active: true, label: label.trim() || null, ...station && { active: station.active }, ...patch };
      const { data, error } = await supabase.from("class_stations").upsert(row).select().single();
      if (!error) { setStation(data); setBusy(false); if (okMsg) showToast({ title: okMsg, type: "success" }); return; }
      if (!/duplicate|unique/i.test(error.message)) { setBusy(false); return showToast({ title: "Couldn't update the station", description: error.message, type: "error" }); }
      patch = { ...patch, code: newCode() }; // code collision: try another
    }
    setBusy(false);
  }

  async function download() {
    const { data, error } = await supabase.from("slot_measurements").select("*").eq("user_id", userId).order("measured_on");
    if (error) return showToast({ title: "Couldn't load your data", description: error.message, type: "error" });
    const blob = new Blob([toCsv(data || [])], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `growing-minds-growth-data-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (station === undefined) return null;

  return (
    <section aria-labelledby="station-heading" className="bg-white border border-violet-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="station-heading" className="font-bold text-teal-800">
          🔬 Student data station <span className="text-[10px] font-bold uppercase rounded-full bg-violet-200 text-violet-900 px-2 py-0.5 align-middle">Beta</span>
        </h2>
        <button type="button" onClick={download} className="text-xs font-semibold text-teal-800 underline">⬇ Download growth data (CSV)</button>
      </div>

      {!station ? (
        <>
          <p className="text-sm text-gray-700">Put a tablet by the tower so students can log plant height, leaf counts and observations. No student accounts needed: they use a class code.</p>
          <button type="button" disabled={busy} onClick={() => save({ code: newCode(), active: true }, "Station ready")}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-50">
            Set up my class station
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Class code</p>
              <p className={`text-3xl font-bold tracking-[0.25em] ${station.active ? "text-gray-900" : "text-gray-400 line-through"}`}>{station.code}</p>
            </div>
            <div className="flex-1 min-w-[12rem] space-y-1">
              <p className="text-xs text-gray-600">On the classroom tablet, open:</p>
              <p className="text-xs font-mono break-all bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">{stationUrl(station.code)}</p>
            </div>
          </div>
          <label className="block text-xs font-semibold text-gray-600">Station name students see
            <input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => label !== (station.label || "") && save({}, "Name saved")}
              maxLength={60} placeholder="e.g. Room 12's tower" className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigator.clipboard?.writeText(stationUrl(station.code)).then(() => showToast({ title: "Link copied", type: "success" }))}
              className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50">Copy link</button>
            <button type="button" disabled={busy} onClick={() => save({ active: !station.active }, station.active ? "Station paused" : "Station on")}
              className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50 disabled:opacity-50">
              {station.active ? "⏸ Pause station" : "▶ Turn station on"}
            </button>
            <button type="button" disabled={busy} onClick={() => save({ code: newCode() }, "New code made. The old one stops working.")}
              className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50 disabled:opacity-50">🔁 New code</button>
          </div>
          <p className="text-[11px] text-gray-500">Students' entries show up in each slot's journal. If a code gets shared outside class, tap New code.</p>
        </>
      )}
    </section>
  );
}
