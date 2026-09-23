import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";
import {
  todayLocal, parseLocalDate, addDays, daysBetween, isValidDateString, formatLocalDate,
} from "../utils/date";

/* ─── Default task templates ─────────────────────────────── */
const DEFAULT_TASKS = [
  { task_name: "Tank Refresh / Cleaning",            frequency_days: 14, owner: "Teacher",        sort_order: 0  },
  { task_name: "HydroBoost Dose",                    frequency_days: 14, owner: "Teacher",        sort_order: 1  },
  { task_name: "Root inspection",                    frequency_days: 14, owner: "Teacher",        sort_order: 2  },
  { task_name: "Inventory seeds / supplies",         frequency_days: 30, owner: "Teacher",        sort_order: 3  },
  { task_name: "Pump / flow check",                  frequency_days: 7,  owner: "Student helper", sort_order: 4  },
  { task_name: "pH check",                           frequency_days: 7,  owner: "Student helper", sort_order: 5  },
  { task_name: "Light inspection",                   frequency_days: 7,  owner: "Student helper", sort_order: 6  },
  { task_name: "Prune / thin crowded plants",        frequency_days: 7,  owner: "Student helper", sort_order: 7  },
  { task_name: "Harvest + sanitize tools",           frequency_days: 7,  owner: "Student helper", sort_order: 8  },
  { task_name: "Wipe surfaces / cleanup",            frequency_days: 7,  owner: "Student helper", sort_order: 9  },
  { task_name: "Pollination support for fruiting",   frequency_days: 3,  owner: "Student helper", sort_order: 10 },
];

/* ─── Status helpers (shared with GardynDashboard) ────────── */
/** Whole days until the task is next due (negative = overdue), or null. */
export function daysUntilDue(task) {
  if (!task.frequency_days || !task.last_completed) return null;
  const last = parseLocalDate(task.last_completed);
  if (!last) return null;
  return daysBetween(new Date(), addDays(last, task.frequency_days));
}

/**
 * "reminder" | "needs-date" | "overdue" | "due-today" | "due-soon" | "on-track".
 * "needs-date" is NOT overdue - it just means no completion date is logged yet.
 */
export function getStatus(task) {
  if (!task.frequency_days) return "reminder";
  const days = daysUntilDue(task);
  if (days === null) return "needs-date";
  if (days < 0)  return "overdue";
  if (days === 0) return "due-today";
  if (days <= 2) return "due-soon";
  return "on-track";
}

const STATUS_META = {
  "overdue":    { label: "Overdue",     dot: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50   border-red-200"    },
  "due-today":  { label: "Due Today",   dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  "due-soon":   { label: "Due Soon",    dot: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50  border-amber-200"  },
  "on-track":   { label: "On Track",    dot: "bg-teal-500",   text: "text-teal-700",   bg: "bg-teal-50   border-teal-200"   },
  "needs-date": { label: "Needs Date",  dot: "bg-gray-400",   text: "text-gray-600",   bg: "bg-gray-50   border-gray-200"   },
  "reminder":   { label: "Reminder",    dot: "bg-blue-400",   text: "text-blue-700",   bg: "bg-blue-50   border-blue-200"   },
};

function formatDate(iso) {
  if (!iso) return null;
  return formatLocalDate(iso, { month: "short", day: "numeric", year: "numeric" });
}

/* ─── First-visit seeding ────────────────────────────────── */
// Module-level in-flight guard: StrictMode double effects / quick remounts
// share one seed request per user instead of inserting twice.
const seedInFlight = new Map();

async function seedMissingTasks(userId, existingNames) {
  const missing = DEFAULT_TASKS
    .filter((t) => !existingNames.has(t.task_name))
    .map((t) => ({ ...t, user_id: userId }));
  if (missing.length === 0) return null;

  const { error } = await supabase
    .from("maintenance_tasks")
    .upsert(missing, { onConflict: "user_id,task_name", ignoreDuplicates: true });
  if (!error) return null;
  if (!/no unique or exclusion constraint/i.test(error.message || "")) return error;

  // Unique constraint not migrated yet: re-select, then insert only what's still missing.
  const { data: current, error: selErr } = await supabase
    .from("maintenance_tasks")
    .select("task_name")
    .eq("user_id", userId);
  if (selErr) return selErr;
  const have = new Set((current || []).map((r) => r.task_name));
  const stillMissing = missing.filter((t) => !have.has(t.task_name));
  if (stillMissing.length === 0) return null;
  const { error: insErr } = await supabase.from("maintenance_tasks").insert(stillMissing);
  return insErr || null;
}

function seedOnce(userId, existingNames) {
  if (!seedInFlight.has(userId)) {
    const p = seedMissingTasks(userId, existingNames).finally(() => seedInFlight.delete(userId));
    seedInFlight.set(userId, p);
  }
  return seedInFlight.get(userId);
}

function rowTime(r) {
  return Date.parse(r.updated_at || r.created_at || "") || 0;
}

/** Keep one row per task_name (most recently updated/created wins). */
function dedupeTasks(rows) {
  const byName = new Map();
  for (const r of rows) {
    const prev = byName.get(r.task_name);
    // Prefer the most recent last_completed (matches the SQL dedupe), then newest row.
    const a = r.last_completed || "", b = prev?.last_completed || "";
    if (!prev || a > b || (a === b && rowTime(r) >= rowTime(prev))) byName.set(r.task_name, r);
  }
  return [...byName.values()].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/* ─── Main component ─────────────────────────────────────── */
export default function Maintenance() {
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); // task id being saved

  const [loadError, setLoadError] = useState(null);

  /* ── Load or seed tasks ──────────────────────────────────── */
  const loadTasks = useCallback(async (isCancelled = () => false) => {
    setLoadError(null);
    const selectAll = () => supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    let { data, error } = await selectAll();
    if (isCancelled()) return;

    if (error) {
      showToast({ title: "Failed to load maintenance tasks", description: error.message, type: "error" });
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // First visit - seed default tasks for this user (guarded against double insert)
      const seedErr = await seedOnce(user.id, new Set());
      if (isCancelled()) return;
      if (seedErr) {
        showToast({ title: "Could not create maintenance tasks", description: seedErr.message, type: "error" });
        setLoadError(seedErr.message);
        setLoading(false);
        return;
      }
      ({ data, error } = await selectAll());
      if (isCancelled()) return;
      if (error) {
        showToast({ title: "Failed to load maintenance tasks", description: error.message, type: "error" });
        setLoadError(error.message);
        setLoading(false);
        return;
      }
    }

    setTasks(dedupeTasks(data || []));
    setLoading(false);
  }, [user.id, showToast]);

  useEffect(() => {
    let cancelled = false;
    loadTasks(() => cancelled);
    return () => { cancelled = true; };
  }, [loadTasks]);

  function retryLoad() {
    setLoading(true);
    loadTasks();
  }

  /* ── Mark complete (set last_completed = today) ──────────── */
  async function markComplete(task) {
    setSaving(task.id);
    const today = todayLocal();

    const { error } = await supabase
      .from("maintenance_tasks")
      .update({ last_completed: today })
      .eq("id", task.id);

    if (error) {
      showToast({ title: "Failed to update task", description: error.message, type: "error" });
    } else {
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, last_completed: today } : t)
      );
      showToast({ title: `"${task.task_name}" marked complete`, type: "success" });
    }
    setSaving(null);
  }

  /* ── Update last_completed via date input ─────────────────── */
  async function updateDate(task, dateVal) {
    if ((dateVal || null) === (task.last_completed || null)) return true;
    if (dateVal && !isValidDateString(dateVal)) {
      showToast({
        title: "Please enter a valid date",
        description: "Use a real date from 2020 up to today (no future dates).",
        type: "error",
      });
      return false;
    }
    setSaving(task.id);
    const { error } = await supabase
      .from("maintenance_tasks")
      .update({ last_completed: dateVal || null })
      .eq("id", task.id);

    if (error) {
      showToast({ title: "Failed to update date", description: error.message, type: "error" });
    } else {
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, last_completed: dateVal || null } : t)
      );
      showToast({ title: `"${task.task_name}" date saved`, type: "success" });
    }
    setSaving(null);
    return !error;
  }

  /* ── Summary stats ───────────────────────────────────────── */
  const overdue  = tasks.filter((t) => getStatus(t) === "overdue" || getStatus(t) === "due-today").length;
  const dueSoon  = tasks.filter((t) => getStatus(t) === "due-soon").length;
  const onTrack  = tasks.filter((t) => getStatus(t) === "on-track").length;
  const needsDate = tasks.filter((t) => getStatus(t) === "needs-date").length;

  /* ── Group by owner ──────────────────────────────────────── */
  const teacherTasks  = tasks.filter((t) => t.owner === "Teacher");
  const studentTasks  = tasks.filter((t) => t.owner === "Student helper");

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 bg-teal-100 text-teal-700
                     rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
        >
          🔧
        </div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
            Maintenance
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gardyn system care schedule
          </p>
        </div>
      </div>

      {loading ? (
        <MaintenanceSkeleton />
      ) : loadError && tasks.length === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3" role="alert">
          <p className="font-semibold text-red-800">We couldn't load your maintenance schedule.</p>
          <p className="text-xs text-red-700">{loadError}</p>
          <button
            onClick={retryLoad}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm
                       font-semibold min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ── Summary row ────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryPill
              label="Action Needed"
              value={overdue}
              color={overdue > 0 ? "red" : "gray"}
            />
            <SummaryPill
              label="Due Soon"
              value={dueSoon}
              color={dueSoon > 0 ? "amber" : "gray"}
            />
            <SummaryPill
              label="On Track"
              value={onTrack}
              color="teal"
            />
          </div>

          {needsDate > 0 && (
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              {needsDate} task{needsDate !== 1 ? "s need" : " needs"} a starting date. Tap 📅 on a task
              to enter when it was last done, or tap Done if you did it today.
            </p>
          )}

          {/* ── Teacher tasks ──────────────────────────────── */}
          <TaskGroup
            title="Teacher Tasks"
            icon="👩‍🏫"
            tasks={teacherTasks}
            saving={saving}
            onMarkComplete={markComplete}
            onDateChange={updateDate}
          />

          {/* ── Student tasks ──────────────────────────────── */}
          <TaskGroup
            title="Student Helper Tasks"
            icon="🧑‍🎓"
            tasks={studentTasks}
            saving={saving}
            onMarkComplete={markComplete}
            onDateChange={updateDate}
          />
        </>
      )}
    </div>
  );
}

/* ─── Task Group ─────────────────────────────────────────── */
function TaskGroup({ title, icon, tasks, saving, onMarkComplete, onDateChange }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        {title}
        <span className="text-gray-400 font-normal normal-case tracking-normal">
          ({tasks.length})
        </span>
      </h2>

      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          saving={saving === task.id}
          onMarkComplete={onMarkComplete}
          onDateChange={onDateChange}
        />
      ))}
    </section>
  );
}

/* ─── Task Row ───────────────────────────────────────────── */
function TaskRow({ task, saving, onMarkComplete, onDateChange }) {
  const [showDate, setShowDate] = useState(false);
  const [draftDate, setDraftDate] = useState(task.last_completed || "");

  // Keep the draft in sync when the saved value changes (e.g. "Done" pressed).
  useEffect(() => { setDraftDate(task.last_completed || ""); }, [task.last_completed]);

  async function commitDate() {
    const ok = await onDateChange(task, draftDate);
    if (!ok) setDraftDate(task.last_completed || "");
  }
  const status = getStatus(task);
  const meta   = STATUS_META[status];
  const days   = daysUntilDue(task);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                  transition-shadow hover:shadow-md ${meta.bg}`}
      role="group"
      aria-label={`Task: ${task.task_name}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* Status dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${meta.dot}`}
            aria-hidden="true"
          />

          <div className="flex-1 min-w-0">
            {/* Task name */}
            <p className="font-semibold text-sm lg:text-base text-gray-900">
              {task.task_name}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Status badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>
                {meta.label}
                {days !== null && (
                  <span className="ml-1 font-normal lowercase">
                    {days < 0
                      ? `(${Math.abs(days)}d ago)`
                      : days === 0
                      ? "(today)"
                      : `(in ${days}d)`}
                  </span>
                )}
              </span>

              {/* Frequency */}
              {task.frequency_days && (
                <span className="text-[10px] text-gray-500">
                  every {task.frequency_days}d
                </span>
              )}

              {/* Last completed */}
              {task.last_completed && (
                <span className="text-[10px] text-gray-500">
                  last: {formatDate(task.last_completed)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Calendar toggle */}
            <button
              onClick={() => setShowDate(!showDate)}
              aria-label={`Set date for ${task.task_name}`}
              aria-expanded={showDate}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         text-gray-400 hover:text-teal-600 hover:bg-teal-50
                         focus-visible:ring-2 focus-visible:ring-teal-700 text-sm"
            >
              📅
            </button>

            {/* Mark done */}
            <button
              onClick={() => onMarkComplete(task)}
              disabled={saving}
              aria-label={`Mark ${task.task_name} complete`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide
                          transition-colors focus-visible:ring-2 focus-visible:ring-teal-700
                          disabled:opacity-50
                          ${status === "on-track"
                            ? "bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-700"
                            : "bg-teal-700 text-white hover:bg-teal-800"}`}
            >
              {saving ? "…" : "Done"}
            </button>
          </div>
        </div>

        {/* Date picker (expandable) */}
        {showDate && (
          <div className="mt-3 flex items-center gap-2">
            <label
              htmlFor={`date-${task.id}`}
              className="text-xs text-gray-500 flex-shrink-0"
            >
              Last completed:
            </label>
            <input
              id={`date-${task.id}`}
              type="date"
              value={draftDate}
              min="2020-01-01"
              max={todayLocal()}
              disabled={saving}
              onChange={(e) => setDraftDate(e.target.value)}
              onBlur={commitDate}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1
                         focus-visible:ring-2 focus-visible:ring-teal-700 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Summary pill ───────────────────────────────────────── */
function SummaryPill({ label, value, color }) {
  const colors = {
    red:   "bg-red-50   border-red-200   text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    teal:  "bg-teal-50  border-teal-200  text-teal-700",
    gray:  "bg-gray-50  border-gray-200  text-gray-500",
  };
  return (
    <div className={`border rounded-2xl p-3 text-center ${colors[color]}`}>
      <p className="text-xl lg:text-2xl font-bold">{value}</p>
      <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wide mt-0.5 opacity-80">
        {label}
      </p>
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function MaintenanceSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading maintenance tasks…" aria-busy="true">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      {[1,2,3,4,5,6].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}
