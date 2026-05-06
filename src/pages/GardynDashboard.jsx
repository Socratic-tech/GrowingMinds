import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";

/* ─── Maintenance status helper (same logic as Maintenance.jsx) ── */
function getMaintenanceStatus(task) {
  if (!task.frequency_days || !task.last_completed) return "needs-date";
  const due = new Date(task.last_completed);
  due.setDate(due.getDate() + task.frequency_days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - today) / 86400000);
  if (daysLeft <= 0) return "overdue";
  if (daysLeft <= 2) return "due-soon";
  return "on-track";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ─── Main component ─────────────────────────────────────── */
export default function GardynDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState({
    slots:       [],
    maintenance: [],
    harvests:    [],
  });

  const load = useCallback(async () => {
    const [slotRes, maintRes, harvestRes] = await Promise.all([
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
    ]);

    setData({
      slots:       slotRes.data    || [],
      maintenance: maintRes.data   || [],
      harvests:    harvestRes.data || [],
    });
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived stats ───────────────────────────────────────── */
  const slots = data.slots;
  const active        = slots.filter((s) => s.status !== "Empty").length;
  const readyHarvest  = slots.filter((s) => s.status === "Ready to Harvest").length;
  const germinating   = slots.filter((s) => s.status === "Germinating").length;
  const emptySlots    = slots.filter((s) => s.status === "Empty").length;

  const overdueCount  = data.maintenance.filter(
    (t) => getMaintenanceStatus(t) === "overdue" || getMaintenanceStatus(t) === "needs-date"
  ).length;

  const totalHarvestGrams = data.harvests.reduce((s, h) => s + (h.amount_grams || 0), 0);

  const urgentMaint = data.maintenance
    .filter((t) => ["overdue","needs-date"].includes(getMaintenanceStatus(t)))
    .slice(0, 3);

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
      ) : (
        <>
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
              value={overdueCount}
              label="Maint. Due"
              sub="needs action"
              color={overdueCount > 0 ? "red" : "gray"}
              onClick={() => navigate("/maintenance")}
              highlight={overdueCount > 0}
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
                {urgentMaint.map((t) => (
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
                      {t.last_completed ? "Overdue" : "Needs Date"}
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
                           border-gray-200 rounded-2xl text-gray-400 text-sm
                           hover:bg-gray-100 transition-colors"
              >
                No harvests yet · Log your first one →
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-teal-700 text-white rounded-2xl px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {data.harvests.length} recent harvest{data.harvests.length !== 1 ? "s" : ""}
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
                        <span className="text-xs text-gray-400 ml-2">· {h.student_team}</span>
                      )}
                    </div>
                    <div className="text-right">
                      {h.amount_grams != null && (
                        <span className="text-xs font-bold text-teal-700">{h.amount_grams}g</span>
                      )}
                      <span className="text-[10px] text-gray-400 block">
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
      <p className="text-[9px] opacity-50 mt-0.5">{sub}</p>
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
