import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase/client";
import { useToast } from "../ui/toast";
import { displayName } from "../../utils/displayName";
import { normalizeCode } from "../../utils/eventCode";

// Admin → Codes: event join codes. Educators who enter an active code at
// sign-up (or on the Pending page) are approved immediately.
// Needs supabase_event_codes_2026-09.sql.

const inputCls = "w-full p-3 rounded-xl border border-gray-300 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600 bg-white";

// No 0/O or 1/I so codes read clearly off a projector.
function randomCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `GROW-${s}`;
}

function endOfTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  return d;
}

// <input type="datetime-local"> wants local time without a zone.
function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}

function status(c) {
  if (!c.active) return { label: "Off", cls: "bg-gray-100 text-gray-600" };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: "Expired", cls: "bg-gray-100 text-gray-600" };
  if (c.max_uses && c.uses >= c.max_uses) return { label: "Used up", cls: "bg-amber-100 text-amber-900" };
  return { label: "Live", cls: "bg-emerald-100 text-emerald-800" };
}

export default function AdminEventCodes({ users }) {
  const { showToast } = useToast();
  const [codes, setCodes] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => ({ code: randomCode(), label: "", expires: toLocalInput(endOfTomorrow()), max: "60" }));
  const [saving, setSaving] = useState(false);

  const people = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u])), [users]);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      supabase.from("event_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("event_code_redemptions").select("*").order("redeemed_at", { ascending: false }).limit(100),
    ]);
    if (c.error) {
      if (/event_codes|relation|schema cache/i.test(c.error.message || "")) setMissingTable(true);
      else showToast({ title: "Couldn't load event codes", description: c.error.message, type: "error" });
    } else {
      setMissingTable(false);
      setCodes(c.data || []);
      setRedemptions(r.data || []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    const code = normalizeCode(form.code);
    if (!/^[A-Z0-9-]{4,32}$/.test(code)) {
      showToast({ title: "Codes are 4–32 letters, numbers or dashes", type: "error" });
      return;
    }
    const max = form.max === "" ? null : Number(form.max);
    if (max !== null && (!Number.isInteger(max) || max < 1)) {
      showToast({ title: "Use limit must be a whole number", type: "error" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("event_codes").insert({
      code,
      label: form.label.trim() || null,
      expires_at: form.expires ? new Date(form.expires).toISOString() : null,
      max_uses: max,
    });
    setSaving(false);
    if (error) {
      showToast({
        title: "Couldn't create code",
        description: /duplicate|unique/i.test(error.message) ? "That code already exists. Try another." : error.message,
        type: "error",
      });
      return;
    }
    showToast({ title: `Code ${code} is live`, type: "success" });
    setCreating(false);
    setForm({ code: randomCode(), label: "", expires: toLocalInput(endOfTomorrow()), max: "60" });
    load();
  }

  async function toggle(c) {
    const { error } = await supabase.from("event_codes").update({ active: !c.active }).eq("code", c.code);
    if (error) showToast({ title: "Couldn't update code", description: error.message, type: "error" });
    else load();
  }

  if (missingTable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">Event codes aren't set up yet.</p>
        <p>Run <code className="bg-white px-1 rounded">supabase_event_codes_2026-09.sql</code> in the Supabase SQL Editor, then reload this page.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="codes-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 id="codes-title" className="text-xs lg:text-sm uppercase tracking-widest font-bold text-teal-700">🎟️ Event codes</h2>
          <p className="text-xs text-gray-600 mt-1">
            Educators who enter a live code at sign-up, or on the waiting screen, are approved right away.
          </p>
        </div>
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2">
            + New code
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={create} className="bg-white border border-teal-200 rounded-2xl shadow-md p-5 space-y-3" aria-label="New event code">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-gray-600 space-y-1">
              <span>Code</span>
              <div className="flex gap-2">
                <input className={`${inputCls} uppercase tracking-widest font-bold`} value={form.code} maxLength={32}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, code: randomCode() }))}
                  className="px-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                  New
                </button>
              </div>
            </label>
            <label className="text-xs font-semibold text-gray-600 space-y-1">
              <span>Label (for you)</span>
              <input className={inputCls} value={form.label} maxLength={120} placeholder="e.g. Calhoun ISD PD, Sept 29"
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-gray-600 space-y-1">
              <span>Stops working</span>
              <input type="datetime-local" className={inputCls} value={form.expires}
                onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-gray-600 space-y-1">
              <span>Most people who can use it</span>
              <input className={inputCls} inputMode="numeric" value={form.max} placeholder="No limit"
                onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} />
            </label>
          </div>
          <p className="text-xs text-gray-500">Set the limit a little above the number of people in the room, so a code that gets shared can't let in the whole state.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
              {saving ? "Creating…" : "Create code"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading && <p className="text-center text-gray-500">Loading…</p>}
      {!loading && codes.length === 0 && !creating && (
        <p className="text-sm text-gray-500 italic pl-1">No codes yet. Make one before your next training.</p>
      )}

      <ul className="space-y-2">
        {codes.map((c) => {
          const st = status(c);
          return (
            <li key={c.code} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-lg tracking-widest">
                  {c.code}
                  <span className={`ml-2 align-middle px-1.5 py-0.5 rounded text-[11px] font-bold tracking-normal ${st.cls}`}>{st.label}</span>
                </p>
                {c.label && <p className="text-sm text-gray-700">{c.label}</p>}
                <p className="text-xs text-gray-500">
                  Used by {c.uses}{c.max_uses ? ` of ${c.max_uses}` : ""}
                  {c.expires_at && ` · stops ${fmt(c.expires_at)}`}
                </p>
              </div>
              <button type="button" onClick={() => toggle(c)}
                className={`shrink-0 text-xs font-semibold rounded-xl px-3 py-2 border ${c.active ? "text-red-700 border-red-200 hover:bg-red-50" : "text-teal-800 border-teal-200 hover:bg-teal-50"}`}>
                {c.active ? "Turn off" : "Turn on"}
              </button>
            </li>
          );
        })}
      </ul>

      {redemptions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest font-bold text-gray-600 pt-2">Joined with a code</h3>
          <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm">
            {redemptions.map((r) => {
              const p = people[r.user_id];
              return (
                <li key={r.id} className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-semibold text-gray-800">{p ? displayName(p) : "Educator"}</span>
                  {p?.school && <span className="text-gray-600">{p.school}</span>}
                  <span className="text-gray-500">{r.code}</span>
                  <span className="text-gray-500">{fmt(r.redeemed_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
