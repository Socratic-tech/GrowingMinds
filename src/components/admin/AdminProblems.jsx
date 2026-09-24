import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase/client";
import { useToast } from "../ui/toast";
import { displayName } from "../../utils/displayName";

// Admin → Problems: failed saves/loads and crashes that educators hit,
// recorded automatically by utils/reportError.js. Identical problems are
// grouped so one broken page shows as one row with a count.

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function browserName(ua = "") {
  if (/Edg\//.test(ua)) return "Edge";
  if (/CriOS|Chrome\//.test(ua)) return /Mobile/.test(ua) ? "Chrome (phone)" : "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return /iPhone|iPad/.test(ua) ? "Safari (iPhone/iPad)" : "Safari";
  return "Other browser";
}

export default function AdminProblems({ users, onCountChange }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [openKey, setOpenKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("client_errors").select("*").order("created_at", { ascending: false }).limit(500);
    if (!showResolved) q = q.eq("resolved", false);
    const { data, error } = await q;
    if (error) {
      if (/client_errors|relation|schema cache/i.test(error.message || "")) setMissingTable(true);
      else showToast({ title: "Couldn't load problems", description: error.message, type: "error" });
      setRows([]);
    } else {
      setMissingTable(false);
      setRows(data || []);
      if (!showResolved) onCountChange?.((data || []).length);
    }
    setLoading(false);
  }, [showResolved, showToast, onCountChange]);

  useEffect(() => { load(); }, [load]);

  const people = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u])), [users]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const key = `${r.action}|${r.message}|${r.resolved}`;
      if (!m.has(key)) m.set(key, { key, action: r.action, message: r.message, resolved: r.resolved, items: [] });
      m.get(key).items.push(r);
    }
    return [...m.values()];
  }, [rows]);

  async function resolve(group, value) {
    const ids = group.items.map((r) => r.id);
    const { error } = await supabase.from("client_errors").update({ resolved: value }).in("id", ids);
    if (error) {
      showToast({ title: "Couldn't update", description: error.message, type: "error" });
      return;
    }
    showToast({ title: value ? `Marked ${ids.length} as fixed` : "Reopened", type: "success" });
    load();
  }

  if (missingTable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">The problems log isn't set up yet.</p>
        <p>Run <code className="bg-white px-1 rounded">supabase_admin_tools_2026-09.sql</code> in the Supabase SQL Editor, then reload this page.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="problems-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 id="problems-title" className="text-xs lg:text-sm uppercase tracking-widest font-bold text-red-700">
            ⚠️ {showResolved ? "All problems" : "Open problems"} ({groups.length}{rows.length !== groups.length ? `, ${rows.length} reports` : ""})
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Recorded automatically when an educator sees an error. Identical problems are grouped.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={showResolved}
            onClick={() => setShowResolved((v) => !v)}
            className="text-xs font-semibold rounded-xl px-3 py-2 border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            {showResolved ? "Hide fixed" : "Show fixed"}
          </button>
          <button
            type="button"
            onClick={load}
            className="text-xs font-semibold rounded-xl px-3 py-2 border bg-white text-teal-800 border-teal-200 hover:bg-teal-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Loading…</p>}

      {!loading && groups.length === 0 && (
        <p className="text-sm text-gray-500 italic pl-1">No problems reported. 🎉</p>
      )}

      {!loading && groups.map((g) => {
        const latest = g.items[0];
        const who = [...new Set(g.items.map((r) => r.user_id))];
        const open = openKey === g.key;
        return (
          <div key={g.key} className={`bg-white rounded-2xl border shadow-sm ${g.resolved ? "border-gray-200 opacity-75" : "border-red-200"}`}>
            <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-gray-800 text-sm">
                  {g.action || "Error"}
                  {g.items.length > 1 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold">×{g.items.length}</span>
                  )}
                  {g.resolved && <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-bold">fixed</span>}
                </p>
                <p className="text-sm text-gray-700 break-words">{g.message}</p>
                <p className="text-xs text-gray-500">
                  Last seen {fmt(latest.created_at)} on <b>{latest.page || "/"}</b> ·{" "}
                  {who.length === 1 ? displayName(people[who[0]]) || "an educator" : `${who.length} educators`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenKey(open ? null : g.key)}
                  className="text-xs font-semibold rounded-xl px-3 py-2 border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  {open ? "Hide details" : "Details"}
                </button>
                <button
                  type="button"
                  onClick={() => resolve(g, !g.resolved)}
                  className="text-xs font-semibold rounded-xl px-3 py-2 text-white bg-teal-700 hover:bg-teal-800"
                >
                  {g.resolved ? "Reopen" : "Mark fixed"}
                </button>
              </div>
            </div>
            {open && (
              <ul className="border-t border-gray-100 divide-y divide-gray-100 text-xs text-gray-600">
                {g.items.slice(0, 25).map((r) => {
                  const p = people[r.user_id];
                  return (
                    <li key={r.id} className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{fmt(r.created_at)}</span>
                      <span className="font-semibold text-gray-700">{p ? displayName(p) : "Unknown"}</span>
                      {p?.email && <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>}
                      <span>{r.page}</span>
                      <span>{browserName(r.user_agent)}</span>
                      {r.details && <code className="bg-gray-50 px-1 rounded break-all">{JSON.stringify(r.details)}</code>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
