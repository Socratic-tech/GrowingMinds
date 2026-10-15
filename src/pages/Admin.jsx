import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import AdminPlants from "../components/admin/AdminPlants";
import AdminProblems from "../components/admin/AdminProblems";
import AdminImpact from "../components/admin/AdminImpact";
import AdminPlantSuggestions from "../components/admin/AdminPlantSuggestions";
import AdminEventCodes from "../components/admin/AdminEventCodes";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { displayName } from "../utils/displayName";
import { missingProfileFields } from "../config/app";
import { TUTORIALS } from "../data/tutorials";

// Statewide rollout means hundreds of educators across many districts.
// This panel is built to scan and approve them quickly without mistakes:
// every row shows who the person says they are, lists are searchable and
// filterable by REMC, and bulk/destructive actions ask first.

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function looksLikeSchoolEmail(email = "") {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return domain.endsWith(".org") || domain.endsWith(".edu") || domain.endsWith(".us") || domain.includes("k12");
}

const isIncomplete = (u) => missingProfileFields(u).length > 0;

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [query, setQuery] = useState("");
  const [remcFilter, setRemcFilter] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [params, setParams] = useSearchParams();
  const tab = ["plants", "codes", "problems", "impact"].includes(params.get("tab")) ? params.get("tab") : "educators";
  const setTab = (t) => setParams(t === "educators" ? {} : { tab: t }, { replace: true });
  const [problemCount, setProblemCount] = useState(0);
  const [learnDone, setLearnDone] = useState({}); // user id -> guides finished
  const [betaIds, setBetaIds] = useState(null); // Map user id -> feature switches; null = table not set up
  const [betaBusy, setBetaBusy] = useState(null);
  const [betaSetupError, setBetaSetupError] = useState(null);
  const reloadTimer = useRef(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      showToast({ title: "Failed to load users", description: error.message, type: "error" });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") loadUsers();
  }, [authLoading, profile?.role, loadUsers]);

  // Learn guides finished per educator (quietly empty until the table exists).
  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;
    supabase
      .from("learn_progress")
      .select("user_id")
      .not("completed_at", "is", null)
      .then(({ data, error }) => {
        if (error || !data) return;
        const m = {};
        for (const r of data) m[r.user_id] = (m[r.user_id] || 0) + 1;
        setLearnDone(m);
      });
  }, [authLoading, profile?.role]);

  // Beta testers (quietly hidden until supabase_photo_journal_2026-10.sql is run).
  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;
    supabase.from("beta_testers").select("user_id, features").then(({ data, error }) => {
      if (!error && data) setBetaIds(new Map(data.map((r) => [r.user_id, r.features || []])));
      else if (error) setBetaSetupError(error.message);
    });
  }, [authLoading, profile?.role]);

  // Per-educator switches, all stored in beta_testers.features.
  const SWITCHES = [
    { id: "beta", label: "🧪 Beta", hint: "photo journal + student station", keys: ["photo_journal", "student_station"] },
    { id: "custom", label: "🪴 Custom plants", hint: "on request", keys: ["custom_plants"] },
    { id: "towers", label: "🗼 Multiple towers", hint: "on request", keys: ["multi_tower"] },
  ];
  const hasSwitch = (u, sw) => sw.keys.every((k) => (betaIds?.get(u.id) || []).includes(k));

  async function toggleSwitch(u, sw) {
    const cur = betaIds.get(u.id) || [];
    const on = hasSwitch(u, sw);
    const next = on ? cur.filter((k) => !sw.keys.includes(k)) : [...new Set([...cur, ...sw.keys])];
    setBetaBusy(`${u.id}:${sw.id}`);
    const { error } = next.length
      ? await supabase.from("beta_testers").upsert({ user_id: u.id, features: next })
      : await supabase.from("beta_testers").delete().eq("user_id", u.id);
    setBetaBusy(null);
    if (error) return showToast({ title: "Couldn't change that switch", description: error.message, type: "error" });
    setBetaIds((m) => { const n = new Map(m); next.length ? n.set(u.id, next) : n.delete(u.id); return n; });
    showToast({ title: `${sw.label} ${on ? "off" : "on"} for ${displayName(u)}`, type: "success" });
  }

  // Badge on the Problems tab (quietly 0 until the problems log exists).
  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;
    supabase
      .from("client_errors")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false)
      .then(({ count, error }) => { if (!error) setProblemCount(count || 0); });
  }, [authLoading, profile?.role]);

  // Keep the pending list live as new educators sign up.
  useEffect(() => {
    if (profile?.role !== "admin") return;
    // Debounced: a bulk approve of 100 people fires 100 change events.
    const reload = () => {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(loadUsers, 1500);
    };
    const channel = supabase
      .channel("admin-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, reload)
      .subscribe();
    return () => {
      clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [profile?.role, loadUsers]);

  const setApproval = useCallback(
    async (ids, value) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_approved: value })
        .in("id", ids)
        .select("id");
      if (error || !data?.length) {
        showToast({
          title: "Couldn't update educator(s)",
          description: error?.message || "No rows were changed — check your admin permissions.",
          type: "error",
        });
        return false;
      }
      // Update locally so the list doesn't jump while realtime catches up.
      const changed = new Set(data.map((r) => r.id));
      setUsers((us) => us.map((u) => (changed.has(u.id) ? { ...u, is_approved: value } : u)));
      return data.length;
    },
    [showToast]
  );

  async function approveOne(u) {
    setBusyIds((s) => new Set(s).add(u.id));
    const n = await setApproval([u.id], true);
    if (n) showToast({ title: `Approved ${displayName(u)}`, type: "success" });
    setBusyIds((s) => { const x = new Set(s); x.delete(u.id); return x; });
  }

  async function restrictOne(u) {
    if (!window.confirm(`Remove access for ${displayName(u)} (${u.email})?\n\nTheir posts and classroom data are kept; they'll see the "awaiting approval" screen until re-approved.`)) return;
    setBusyIds((s) => new Set(s).add(u.id));
    const n = await setApproval([u.id], false);
    if (n) showToast({ title: `Access removed for ${displayName(u)}`, type: "success" });
    setBusyIds((s) => { const x = new Set(s); x.delete(u.id); return x; });
  }

  async function approveMany(list) {
    if (list.length === 0) return;
    const preview = list.slice(0, 8).map((u) => `• ${displayName(u)} — ${u.email}`).join("\n");
    const more = list.length > 8 ? `\n…and ${list.length - 8} more` : "";
    if (!window.confirm(`Approve ${list.length} educator${list.length === 1 ? "" : "s"}?\n\n${preview}${more}`)) return;
    setBulkApproving(true);
    const n = await setApproval(list.map((u) => u.id), true);
    if (n) showToast({ title: `Approved ${n} educator${n === 1 ? "" : "s"}`, type: "success" });
    setBulkApproving(false);
  }

  function exportCsv() {
    const cols = ["full_name", "email", "school", "district", "remc", "role", "is_approved", "created_at"];
    const rows = [cols.join(","), ...users.map((u) => cols.map((c) => csvEscape(u[c])).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `growing-minds-educators-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const remcOptions = useMemo(
    () => [...new Set(users.map((u) => u.remc?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (remcFilter && (u.remc?.trim() || "") !== remcFilter) return false;
      if (!q) return true;
      return [u.full_name, u.email, u.school, u.district, u.remc].some((v) => v?.toLowerCase().includes(q));
    });
  }, [users, query, remcFilter]);

  if (authLoading) return <div className="text-center p-10">Loading…</div>;
  if (!profile || profile.role !== "admin") return <Navigate to="/feed" replace />;

  // Oldest pending first: they've been waiting longest.
  const pending = filtered.filter((u) => !u.is_approved && u.role !== "admin").reverse();
  const allApproved = filtered.filter((u) => u.is_approved || u.role === "admin");
  const approvedIncomplete = allApproved.filter(isIncomplete);
  const approved = incompleteOnly ? approvedIncomplete : allApproved;
  const totalIncomplete = users.filter((u) => (u.is_approved || u.role === "admin") && isIncomplete(u)).length;

  async function copyIncompleteEmails() {
    const emails = approvedIncomplete.filter((u) => u.id !== profile.id).map((u) => u.email).filter(Boolean);
    if (emails.length === 0) return;
    const text = emails.join(", ");
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        title: `Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`,
        description: "Paste into the BCC line of a reminder email.",
        type: "success",
      });
    } catch {
      window.prompt("Copy these addresses (Ctrl/Cmd+C):", text);
    }
  }
  const totalPending = users.filter((u) => !u.is_approved && u.role !== "admin").length;
  const filtering = query.trim() || remcFilter;

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center shadow">🛡️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Admin Panel</h1>
            <p className="text-xs text-gray-500">
              {users.length} accounts · {totalPending} pending · {totalIncomplete} active with incomplete details
            </p>
          </div>
        </div>
        {tab === "educators" && <button
          type="button"
          onClick={exportCsv}
          disabled={!users.length}
          className="text-xs font-semibold text-teal-800 bg-white border border-teal-200 rounded-xl px-3 py-2 hover:bg-teal-50 disabled:opacity-50"
        >
          ⬇ Export CSV
        </button>}
      </div>

      {/* TABS */}
      <div role="tablist" aria-label="Admin sections" className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {[
          ["educators", "👩‍🏫 Educators", totalPending],
          ["plants", "🌱 Plants", 0],
          ["codes", "🎟️ Codes", 0],
          ["problems", "⚠️ Problems", problemCount],
          ["impact", "📈 Impact", 0],
        ].map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 px-1 text-xs sm:text-sm font-semibold rounded-xl py-2.5 min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-600
              ${tab === id ? "bg-white shadow text-teal-800" : "text-gray-600 hover:text-gray-800"}`}
          >
            {label}
            {n > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${id === "problems" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
                {n}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "plants" && <><AdminPlantSuggestions users={users} /><AdminPlants /></>}
      {tab === "codes" && <AdminEventCodes users={users} />}
      {tab === "problems" && <AdminProblems users={users} onCountChange={setProblemCount} />}
      {tab === "impact" && <AdminImpact />}

      {tab === "educators" && betaSetupError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-900" role="status">
          <b>Feature switches (Beta, Custom plants, Multiple towers) aren't set up yet.</b> In the Supabase SQL Editor, run
          {" "}<code>supabase_photo_journal_2026-10.sql</code>, then <code>supabase_beta_wave2_2026-10.sql</code>
          {" "}(and <code>supabase_towers_custom_plants_2026-10.sql</code> for towers and custom plants). They'll appear on each active educator.
          <span className="block text-xs mt-1 opacity-80">{betaSetupError}</span>
        </div>
      )}
      {tab === "educators" && (<>
      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="admin-search" className="sr-only">Search educators</label>
        <input
          id="admin-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, school, district…"
          className="flex-1 p-3 rounded-xl border border-gray-300 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600"
        />
        <label htmlFor="admin-remc" className="sr-only">Filter by REMC</label>
        <select
          id="admin-remc"
          value={remcFilter}
          onChange={(e) => setRemcFilter(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 text-sm bg-white"
        >
          <option value="">All REMCs</option>
          {remcOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading && <p className="text-center text-gray-500">Loading educators…</p>}

      {/* PENDING */}
      {!loading && (
        <section aria-labelledby="pending-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="pending-title" className="text-xs lg:text-sm uppercase tracking-widest font-bold text-amber-700">
              ⏳ Pending approval ({pending.length}{filtering ? ` of ${totalPending}` : ""})
            </h2>
            {pending.length > 1 && (
              <Button
                disabled={bulkApproving}
                className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl shadow-md text-xs lg:text-sm font-bold disabled:opacity-60"
                onClick={() => approveMany(pending)}
              >
                {bulkApproving ? "Approving…" : `Approve ${filtering ? "shown" : "all"} (${pending.length})`}
              </Button>
            )}
          </div>

          {pending.length === 0 && (
            <p className="text-sm text-gray-500 italic pl-1">
              {filtering ? "No pending educators match your search." : "No one is waiting for approval. 🎉"}
            </p>
          )}

          {pending.map((u) => {
            const busy = busyIds.has(u.id);
            const incomplete = isIncomplete(u);
            return (
              <div
                key={u.id}
                role="group"
                aria-label={`Pending educator ${displayName(u)}`}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-md flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-semibold text-gray-800 truncate">
                    {u.full_name || <span className="italic text-gray-500">No name given</span>}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {[u.school, u.district].filter(Boolean).join(" · ") || <span className="italic text-gray-500">School/district not given</span>}
                    {u.remc && <span className="text-gray-500"> · {u.remc}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {u.email}
                    {!looksLikeSchoolEmail(u.email) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">personal email?</span>
                    )}
                    {incomplete && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">details incomplete</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Signed up {fmtDate(u.created_at)}</p>
                </div>
                <Button
                  aria-label={`Approve ${displayName(u)}`}
                  disabled={busy}
                  className="bg-teal-700 hover:bg-teal-800 text-white py-2.5 px-5 rounded-xl shadow text-sm font-bold disabled:opacity-60 shrink-0"
                  onClick={() => approveOne(u)}
                >
                  {busy ? "…" : "Approve"}
                </Button>
              </div>
            );
          })}
        </section>
      )}

      {/* ACTIVE */}
      {!loading && (
        <section aria-labelledby="active-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="active-title" className="text-xs lg:text-sm uppercase tracking-widest font-bold text-teal-700">
              ✔ Active educators ({approved.length}{incompleteOnly ? ` of ${allApproved.length}` : ""})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                aria-pressed={incompleteOnly}
                onClick={() => setIncompleteOnly((v) => !v)}
                className={`text-xs font-semibold rounded-xl px-3 py-2 border focus-visible:ring-2 focus-visible:ring-teal-600
                  ${incompleteOnly ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                Incomplete details ({approvedIncomplete.length})
              </button>
              {incompleteOnly && approvedIncomplete.length > 0 && (
                <button
                  type="button"
                  onClick={copyIncompleteEmails}
                  className="text-xs font-semibold text-teal-800 bg-white border border-teal-200 rounded-xl px-3 py-2 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  📋 Copy emails
                </button>
              )}
            </div>
          </div>
          {incompleteOnly && approved.length === 0 && (
            <p className="text-sm text-gray-500 italic pl-1">Everyone shown has filled in their name, school and district. 🎉</p>
          )}
          {approved.map((u) => {
            const isSelf = u.id === profile.id;
            const isAdminRow = u.role === "admin";
            return (
              <div
                key={u.id}
                role="group"
                aria-label={`Active educator ${displayName(u)}`}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {displayName(u)}
                    {isAdminRow && <span className="ml-2 text-[11px] uppercase font-bold text-teal-700">admin</span>}
                  </p>
                  {isIncomplete(u) && (
                    <p className="mt-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-semibold">
                        missing {missingProfileFields(u).map((f) => f.label.toLowerCase()).join(", ")}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-600 truncate">
                    {[u.school, u.district, u.remc].filter(Boolean).join(" · ") || u.email}
                  </p>
                  {(u.school || u.district) && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                  {learnDone[u.id] > 0 && (
                    <p className="text-[11px] text-teal-800 font-semibold">🎓 {learnDone[u.id]} of {TUTORIALS.length} Learn guides done</p>
                  )}
                  {betaIds && (
                    <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={`Feature switches for ${displayName(u)}`}>
                      {SWITCHES.map((sw) => {
                        const on = hasSwitch(u, sw);
                        return (
                          <button key={sw.id} type="button" onClick={() => toggleSwitch(u, sw)} disabled={betaBusy === `${u.id}:${sw.id}`}
                            aria-pressed={on} title={sw.hint}
                            className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 disabled:opacity-50
                              ${on ? "bg-violet-100 border-violet-300 text-violet-900" : "bg-white border-gray-300 text-gray-600 hover:border-violet-400"}`}>
                            {sw.label}: {on ? "on" : "off"}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!isSelf && !isAdminRow && (
                  <button
                    type="button"
                    aria-label={`Remove access for ${displayName(u)}`}
                    disabled={busyIds.has(u.id)}
                    onClick={() => restrictOne(u)}
                    className="shrink-0 text-xs font-semibold text-red-700 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                  >
                    Remove access
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}
      </>)}
    </div>
  );
}
