import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";
import { Skeleton } from "../components/ui/Skeleton";
import { getStatus as getMaintenanceStatus } from "./Maintenance";
import { formatLocalDate } from "../utils/date";
import { isValidSlotId } from "../config/gardyn";

const MAINT_LABEL = {
  "overdue":    "Overdue",
  "due-today":  "Due Today",
  "needs-date": "Needs Date",
};
const MAINT_PRIORITY = { "overdue": 0, "due-today": 1, "needs-date": 2 };

function formatDate(iso) {
  if (!iso) return "—";
  return formatLocalDate(iso);
}

/* ─── Main component ─────────────────────────────────────── */
export default function GardynDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [data,    setData]    = useState({
    slots:       [],
    maintenance: [],
    harvests:    [],
    allWeights:  [],
  });

  const load = useCallback(async (isCancelled = () => false) => {
    setLoadError(null);
    const [slotRes, maintRes, harvestRes, weightRes] = await Promise.all([
      supabase
        .from("tracker_slots")
        .select("slot_id, plant_name, status, date_planted, student_team")
        .eq("user_id", user.id),
      supabase
        .from("maintenance_tasks")
        .select("task_name, frequency_days, last_completed, owner")
        .eq("user_id", user.id),
      supabase
        .from("harvest_log")
        .select("harvest_date, plant_name, amount_grams, student_team")
        .eq("user_id", user.id)
        .order("harvest_date", { ascending: false })
        .limit(5),
      // All-time total: fetch only the weight column.
      supabase
        .from("harvest_log")
        .select("amount_grams")
        .eq("user_id", user.id),
    ]);
    if (isCancelled()) return;

    const firstError = [slotRes, maintRes, harvestRes, weightRes].find((r) => r.error)?.error;
    if (firstError) {
      showToast({ title: "Couldn't load your dashboard", description: firstError.message, type: "error" });
      setLoadError(firstError.message);
      setLoading(false);
      return;
    }

    setData({
      slots:       (slotRes.data || []).filter((s) => isValidSlotId(s.slot_id)),
      maintenance: maintRes.data   || [],
      harvests:    harvestRes.data || [],
      allWeights:  weightRes.data  || [],
    });
    setLoading(false);
  }, [user.id, showToast]);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  function retryLoad() {
    setLoading(true);
    load();
  }

  /* ── Derived stats ───────────────────────────────────────── */
  const slots = data.slots;
  const active        = slots.filter((s) => s.status !== "Empty").length;
  const readyHarvest  = slots.filter((s) => s.status === "Ready to Harvest").length;
  const germinating   = slots.filter((s) => s.status === "Germinating").length;
  const emptySlots    = slots.filter((s) => s.status === "Empty").length;

  const maintStatuses = data.maintenance.map((t) => ({ task: t, status: getMaintenanceStatus(t) }));
  const dueCount       = maintStatuses.filter((m) => m.status === "overdue" || m.status === "due-today").length;
  const needsDateCount = maintStatuses.filter((m) => m.status === "needs-date").length;

  const totalHarvestGrams = data.allWeights.reduce((s, h) => s + (Number(h.amount_grams) || 0), 0);
  const totalHarvestCount = data.allWeights.length;

  const urgentMaint = maintStatuses
    .filter((m) => m.status in MAINT_PRIORITY)
    .sort((a, b) => MAINT_PRIORITY[a.status] - MAINT_PRIORITY[b.status])
    .slice(0, 3);

  const isNewTeacher = slots.length === 0;

  const readySlots = slots.filter((s) => s.status === "Ready to Harvest");

  return (
    <div className="space-y-6 pb-24">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 bg-teal-100 text-teal-700
                     rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
        >
          📊
        </div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
            Gardyn Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your classroom at a glance
          </p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3" role="alert">
          <p className="font-semibold text-red-800">We couldn't load your dashboard.</p>
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
          {isNewTeacher && <GetStartedCard />}

          {/* ── Stat grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DashCard
              icon="🌱"
              value={active}
              label="Active Slots"
              sub={`${emptySlots} empty`}
              color="teal"
              onClick={() => navigate("/tracker")}
            />
            <DashCard
              icon="🌾"
              value={readyHarvest}
              label="Ready to Harvest"
              sub="tap to view"
              color={readyHarvest > 0 ? "green" : "gray"}
              onClick={() => navigate("/tracker")}
              highlight={readyHarvest > 0}
            />
            <DashCard
              icon="🌀"
              value={germinating}
              label="Germinating"
              sub="early stage"
              color="blue"
              onClick={() => navigate("/tracker")}
            />
            <DashCard
              icon="🔧"
              value={dueCount}
              label="Maint. Due"
              sub={needsDateCount > 0 ? `${needsDateCount} need a date` : "overdue or today"}
              color={dueCount > 0 ? "red" : "gray"}
              onClick={() => navigate("/maintenance")}
              highlight={dueCount > 0}
            />
          </div>

          {/* ── Ready to Harvest alert ─────────────────────── */}
          {readySlots.length > 0 && (
            <button
              onClick={() => navigate("/tracker")}
              className="w-full bg-green-50 border border-green-300 rounded-2xl p-4
                         text-left hover:bg-green-100 transition-colors
                         focus-visible:ring-2 focus-visible:ring-green-500"
              aria-label="View slots ready to harvest"
            >
              <p className="font-bold text-green-800 text-sm flex items-center gap-2">
                🌾 Ready to Harvest
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {readySlots.length}
                </span>
              </p>
              <p className="text-xs text-green-700 mt-1">
                {readySlots.map((s) => `${s.slot_id}: ${s.plant_name}`).join(" · ")}
              </p>
            </button>
          )}

          {/* ── Urgent maintenance ─────────────────────────── */}
          {urgentMaint.length > 0 && (
            <section aria-label="Urgent maintenance">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-widest font-bold text-red-500">
                  ⚠️ Maintenance Needed
                </h2>
                <button
                  onClick={() => navigate("/maintenance")}
                  className="text-xs text-teal-700 underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {urgentMaint.map(({ task: t, status }) => (
                  <button
                    key={t.task_name}
                    onClick={() => navigate("/maintenance")}
                    className="w-full text-left bg-red-50 border border-red-200 rounded-xl
                               px-4 py-3 flex items-center justify-between
                               hover:bg-red-100 transition-colors
                               focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <span className="text-sm font-medium text-red-800">{t.task_name}</span>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                      {MAINT_LABEL[status]}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Recent harvests ────────────────────────────── */}
          <section aria-label="Recent harvests">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500">
                🌾 Recent Harvests
              </h2>
              <button
                onClick={() => navigate("/harvest")}
                className="text-xs text-teal-700 underline"
              >
                View all
              </button>
            </div>

            {data.harvests.length === 0 ? (
              <button
                onClick={() => navigate("/harvest")}
                className="w-full text-center py-8 bg-gray-50 border border-dashed
                           border-gray-200 rounded-2xl text-gray-500 text-sm
                           hover:bg-gray-100 transition-colors"
              >
                No harvests yet · Log your first one →
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-teal-700 text-white rounded-2xl px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {totalHarvestCount} harvest{totalHarvestCount !== 1 ? "s" : ""} all-time
                  </span>
                  {totalHarvestGrams > 0 && (
                    <span className="text-sm font-bold">
                      {totalHarvestGrams.toFixed(0)}g total
                    </span>
                  )}
                </div>
                {data.harvests.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => navigate("/harvest")}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl
                               px-4 py-2.5 flex items-center justify-between
                               hover:shadow-sm transition-shadow
                               focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-800">{h.plant_name}</span>
                      {h.student_team && (
                        <span className="text-xs text-gray-500 ml-2">· {h.student_team}</span>
                      )}
                    </div>
                    <div className="text-right">
                      {h.amount_grams != null && (
                        <span className="text-xs font-bold text-teal-700">{h.amount_grams}g</span>
                      )}
                      <span className="text-[10px] text-gray-500 block">
                        {formatDate(h.harvest_date)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Quick links ────────────────────────────────── */}
          <section aria-label="Quick navigation">
            <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">
              Quick Links
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🌱", label: "Plants",  path: "/plants"      },
                { icon: "🔬", label: "Lab",     path: "/lessons"     },
                { icon: "💬", label: "Q & A",   path: "/qa"          },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="bg-white border border-gray-200 rounded-2xl py-3 text-center
                             hover:border-teal-300 hover:shadow-sm transition-all
                             focus-visible:ring-2 focus-visible:ring-teal-700"
                >
                  <p className="text-xl" aria-hidden="true">{link.icon}</p>
                  <p className="text-[10px] font-semibold text-gray-600 mt-1 uppercase tracking-wide">
                    {link.label}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ─── Get Started (brand-new teacher) ───────────────────── */
function GetStartedCard() {
  const steps = [
    { to: "/tracker",     label: "Set up your tracker",            hint: "Add what's planted in each slot." },
    { to: "/maintenance", label: "Log your maintenance dates",     hint: "Enter when you last cleaned, dosed, and checked." },
    { to: "/plants",      label: "Browse the Plant Library",       hint: "See germination and harvest times." },
    { to: "/lessons",     label: "Try an investigation in Lesson Lab", hint: "Start from a ready-made template." },
  ];
  return (
    <section
      aria-labelledby="get-started-heading"
      className="bg-teal-50 border border-teal-200 rounded-3xl lg:rounded-2xl p-5 shadow-sm"
    >
      <h2 id="get-started-heading" className="font-bold text-teal-800 text-base lg:text-lg">
        👋 Welcome! Let's get your Gardyn classroom started
      </h2>
      <p className="text-xs text-teal-700 mt-1">A few quick steps and your dashboard will fill in.</p>
      <ol className="mt-4 space-y-2">
        {steps.map((s, i) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className="flex items-center gap-3 bg-white border border-teal-100 rounded-xl px-4 py-3
                         hover:border-teal-300 hover:shadow-sm transition-all
                         focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              <span className="w-7 h-7 flex-shrink-0 rounded-full bg-teal-700 text-white text-sm font-bold
                               flex items-center justify-center" aria-hidden="true">
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">{s.label}</span>
                <span className="block text-xs text-gray-600">{s.hint}</span>
              </span>
              <span className="text-teal-700" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─── Dash Card ──────────────────────────────────────────── */
function DashCard({ icon, value, label, sub, color, onClick, highlight }) {
  const COLORS = {
    teal:  "bg-teal-50  border-teal-200  text-teal-700",
    green: "bg-green-50 border-green-200 text-green-700",
    blue:  "bg-blue-50  border-blue-200  text-blue-700",
    red:   "bg-red-50   border-red-200   text-red-700",
    gray:  "bg-gray-50  border-gray-200  text-gray-500",
  };

  return (
    <button
      onClick={onClick}
      className={`border rounded-2xl p-3 text-center transition-all
                  hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-700
                  ${COLORS[color] || COLORS.gray}
                  ${highlight ? "ring-2 ring-offset-1 ring-current" : ""}`}
    >
      <p className="text-xl" aria-hidden="true">{icon}</p>
      <p className="text-xl lg:text-2xl font-bold mt-1">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">
        {label}
      </p>
      <p className="text-[10px] opacity-75 mt-0.5">{sub}</p>
    </button>
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading dashboard…" aria-busy="true">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      {[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    </div>
  );
}
