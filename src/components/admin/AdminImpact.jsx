import { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";

// Admin → Impact: statewide totals for grant reports and board updates,
// plus storage use against the Supabase plan. Data: impact_summary()
// (supabase_beta_wave2_2026-10.sql).

const PLANS = {
  free: { label: "Free", files: 1, db: 0.5 },
  pro: { label: "Pro", files: 100, db: 8 },
};
const PLAN_KEY = "gm-supabase-plan";
const nf = new Intl.NumberFormat("en-US");
const lb = (g) => (g / 453.592);
const fmtBytes = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const monthName = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString("en-US", { month: "short" });

function Tile({ value, label, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-2xl lg:text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

// Horizontal bars: one series, sorted, value labeled at the bar end.
function Bars({ rows, value, label, unit, caption }) {
  const max = Math.max(1, ...rows.map(value));
  return (
    <figure>
      <figcaption className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{caption}</figcaption>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={label(r)} className="grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] items-center gap-2 text-xs group">
            <span className="truncate text-gray-700 font-medium" title={label(r)}>{label(r)}</span>
            <span className="flex items-center gap-2" title={`${label(r)}: ${nf.format(Math.round(value(r)))}${unit}`}>
              <span className="h-4 rounded-r-[4px] bg-teal-700 group-hover:bg-teal-800 transition-colors" style={{ width: `${Math.max(1.5, (value(r) / max) * 100)}%` }} />
              <span className="tabular-nums text-gray-800 shrink-0">{nf.format(Math.round(value(r)))}{unit}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// Vertical monthly bars with a hover readout.
function Months({ rows }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...rows.map((r) => r.grams));
  return (
    <figure>
      <figcaption className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Grams harvested by month</figcaption>
      <div className="relative">
        <div className="flex items-end gap-1.5 h-36 border-b border-gray-200" role="img"
             aria-label={rows.map((r) => `${monthName(r.month)} ${Math.round(r.grams)} grams`).join(", ")}>
          {rows.map((r, i) => (
            <div key={r.month} className="flex-1 h-full flex items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className={`w-full rounded-t-[4px] ${hover === i ? "bg-teal-800" : "bg-teal-700"}`} style={{ height: `${Math.max(2, (r.grams / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {rows.map((r) => <span key={r.month} className="flex-1 text-center text-[10px] text-gray-500">{monthName(r.month)}</span>)}
        </div>
        {hover != null && (
          <div className="absolute top-0 right-0 rounded-lg bg-gray-900 text-white text-xs px-2 py-1">
            <b>{monthName(rows[hover].month)}</b> · {nf.format(Math.round(rows[hover].grams))} g · {rows[hover].harvests} harvests
          </div>
        )}
      </div>
    </figure>
  );
}

function Meter({ used, limitGb, label }) {
  const pct = Math.min(100, (used / (limitGb * 1e9)) * 100);
  const tone = pct >= 90 ? "bg-red-600" : pct >= 70 ? "bg-amber-500" : "bg-teal-700";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-700 mb-1">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums">{fmtBytes(used)} of {limitGb >= 1 ? `${limitGb} GB` : `${limitGb * 1000} MB`} ({pct < 1 ? "<1" : Math.round(pct)}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
      {pct >= 70 && <p className="text-[11px] text-amber-800 mt-1">⚠️ {pct >= 90 ? "Nearly full." : "Getting full."} Consider the Pro plan or lowering the photo limit.</p>}
    </div>
  );
}

export default function AdminImpact() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(() => { try { return localStorage.getItem(PLAN_KEY) || "free"; } catch { return "free"; } });

  useEffect(() => {
    supabase.rpc("impact_summary").then(({ data: d, error: e }) => (e ? setError(e.message) : setData(d)));
  }, []);

  function choosePlan(p) { setPlan(p); try { localStorage.setItem(PLAN_KEY, p); } catch { /* ignore */ } }

  function downloadCsv() {
    const lines = [["REMC", "Educators", "Active towers", "Harvests", "Grams", "Pounds"].join(",")];
    for (const r of data.by_remc) lines.push([`"${r.remc}"`, r.educators, r.active_towers, r.harvests, Math.round(r.grams), lb(r.grams).toFixed(1)].join(","));
    const t = data.totals;
    lines.push(["Total", t.educators, t.active_towers, t.harvests, Math.round(t.grams), lb(t.grams).toFixed(1)].join(","));
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" })),
      download: `growing-minds-impact-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
        The impact dashboard isn't set up yet. Run <b>supabase_beta_wave2_2026-10.sql</b> in the Supabase SQL Editor.
        <span className="block text-xs mt-1 opacity-80">{error}</span>
      </div>
    );
  }
  if (!data) return <p className="text-sm text-gray-500">Loading impact…</p>;

  const t = data.totals;
  const remcs = [...data.by_remc].sort((a, b) => b.grams - a.grams);
  // Fill empty months so the bars line up with the calendar.
  const months = (() => {
    const got = new Map((data.by_month || []).map((m) => [m.month, m]));
    if (!got.size) return [];
    const out = [];
    const d = new Date(`${[...got.keys()].sort()[0]}-01T12:00:00`), end = new Date();
    while (d <= end) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push(got.get(k) || { month: k, grams: 0, harvests: 0 });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  })();
  const limits = PLANS[plan];
  const photoAvg = t.photos ? data.storage.photo_bytes / t.photos : 200 * 1024;
  const photosLeft = Math.max(0, Math.floor((limits.files * 1e9 - data.storage.all_file_bytes) / photoAvg));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">Updated {new Date(data.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
        <button type="button" onClick={downloadCsv} className="text-xs font-semibold text-teal-800 underline">⬇ Download by REMC (CSV)</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile value={nf.format(Math.round(lb(t.grams)))} label="Pounds harvested" sub={`${nf.format(Math.round(t.grams))} g · ${nf.format(t.harvests)} harvests`} />
        <Tile value={nf.format(t.active_towers)} label="Active towers" sub={`${nf.format(t.educators)} approved educators`} />
        <Tile value={nf.format(t.growing_now)} label="Plants growing now" />
        <Tile value={nf.format(t.guides_completed)} label="Learn guides completed" />
        <Tile value={nf.format(t.photos)} label="Journal photos" sub="beta" />
        <Tile value={nf.format(t.measurements)} label="Student measurements" sub="beta" />
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-4 grid lg:grid-cols-2 gap-6">
        {remcs.length > 0 && <Bars caption="Grams harvested by REMC" rows={remcs} value={(r) => r.grams} label={(r) => r.remc} unit=" g" />}
        {months.length > 0 ? <Months rows={months} /> : <p className="text-sm text-gray-500">No harvests logged in the last 12 months yet.</p>}
      </section>

      {data.top_plants.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-4">
          <Bars caption="Top plants by grams harvested" rows={data.top_plants} value={(r) => r.grams} label={(r) => r.plant} unit=" g" />
        </section>
      )}

      <section aria-labelledby="storage-h" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="storage-h" className="font-bold text-gray-900">💾 Storage</h2>
          <div className="flex rounded-full border border-gray-300 p-0.5 text-xs font-semibold" role="group" aria-label="Your Supabase plan">
            {Object.entries(PLANS).map(([k, p]) => (
              <button key={k} type="button" aria-pressed={plan === k} onClick={() => choosePlan(k)}
                className={`px-3 py-1 rounded-full ${plan === k ? "bg-teal-700 text-white" : "text-gray-600"}`}>{p.label} plan</button>
            ))}
          </div>
        </div>
        <Meter used={data.storage.all_file_bytes} limitGb={limits.files} label="File storage (photos and post images)" />
        <Meter used={data.storage.database_bytes} limitGb={limits.db} label="Database" />
        <p className="text-xs text-gray-600">
          Journal photos use {fmtBytes(data.storage.photo_bytes)}. Room for about <b>{nf.format(photosLeft)}</b> more photos on the {limits.label} plan
          (each teacher is capped at 400). Student measurements are tiny: a full school year of weekly data for a whole tower is about 150 KB.
        </p>
      </section>
    </div>
  );
}
