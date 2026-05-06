import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { PlantLibrarySkeleton } from "../components/ui/Skeleton";

/* ─── Light zone display helpers ─────────────────────────── */
const ZONE_META = {
  "Yellow (Low)":  { label: "Yellow · Low",  dot: "bg-yellow-400", text: "text-yellow-800", bg: "bg-yellow-50 border-yellow-200" },
  "Orange (Med)":  { label: "Orange · Med",  dot: "bg-orange-400", text: "text-orange-800", bg: "bg-orange-50 border-orange-200" },
  "Red (High)":    { label: "Red · High",    dot: "bg-red-400",    text: "text-red-800",    bg: "bg-red-50   border-red-200"    },
};

const CATEGORY_ICONS = {
  Greens:   "🥬",
  Herb:     "🌿",
  Fruiting: "🍅",
  Flower:   "🌸",
};

const CATEGORIES = ["All", "Greens", "Herb", "Fruiting", "Flower"];
const ZONES      = ["All", "Yellow (Low)", "Orange (Med)", "Red (High)"];

export default function PlantLibrary() {
  const { showToast } = useToast();

  const [plants,  setPlants]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");
  const [zone,    setZone]    = useState("All");
  const [expanded, setExpanded] = useState(null); // plant name or null

  /* ── Load plants ─────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("plants")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          showToast({ title: "Failed to load plants", description: error.message, type: "error" });
        } else {
          setPlants(data || []);
        }
      } catch (err) {
        showToast({ title: "Error loading plants", description: err.message, type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plants.filter((p) => {
      if (cat  !== "All" && p.category  !== cat)  return false;
      if (zone !== "All" && p.light_zone !== zone) return false;
      if (q && !p.name.toLowerCase().includes(q) &&
               !(p.lesson_hook || "").toLowerCase().includes(q) &&
               !(p.teacher_note || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [plants, search, cat, zone]);

  /* ── Category counts ─────────────────────────────────────── */
  const catCounts = useMemo(() => {
    const counts = { All: plants.length };
    plants.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [plants]);

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 bg-teal-100 text-teal-700
                     rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
        >
          🌱
        </div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
            Plant Library
          </h1>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {plants.length} plants · Gardyn yCube catalog
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <PlantLibrarySkeleton />
      ) : (
        <>
          {/* ── Search ───────────────────────────────────────── */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              aria-hidden="true"
            >
              🔍
            </span>
            <input
              type="search"
              placeholder="Search by name, lesson hook, or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200
                         shadow-sm text-sm lg:text-base focus-visible:ring-2
                         focus-visible:ring-teal-700 bg-white"
              aria-label="Search plants"
            />
          </div>

          {/* ── Category filter ──────────────────────────────── */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-semibold
                            border transition-colors focus-visible:ring-2
                            focus-visible:ring-teal-700
                            ${cat === c
                              ? "bg-teal-700 text-white border-teal-700"
                              : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                            }`}
              >
                {c !== "All" && CATEGORY_ICONS[c] && (
                  <span className="mr-1" aria-hidden="true">{CATEGORY_ICONS[c]}</span>
                )}
                {c}
                <span className="ml-1.5 opacity-60 text-[10px]">
                  {catCounts[c] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* ── Zone filter ──────────────────────────────────── */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by light zone"
          >
            {ZONES.map((z) => {
              const meta = ZONE_META[z];
              const active = zone === z;
              return (
                <button
                  key={z}
                  onClick={() => setZone(z)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                              lg:text-sm font-semibold border transition-colors
                              focus-visible:ring-2 focus-visible:ring-teal-700
                              ${active
                                ? "bg-teal-700 text-white border-teal-700"
                                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                              }`}
                >
                  {meta && (
                    <span
                      className={`w-2 h-2 rounded-full ${active ? "bg-white" : meta.dot}`}
                      aria-hidden="true"
                    />
                  )}
                  {z === "All" ? "All Zones" : meta?.label ?? z}
                </button>
              );
            })}
          </div>

          {/* ── Result count ─────────────────────────────────── */}
          {(search || cat !== "All" || zone !== "All") && (
            <p className="text-xs text-gray-500" aria-live="polite">
              {filtered.length === 0
                ? "No plants match your filters."
                : `${filtered.length} plant${filtered.length !== 1 ? "s" : ""} match your filters`}
            </p>
          )}

          {/* ── Plant cards ──────────────────────────────────── */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24"
            aria-label="Plant list"
          >
            {filtered.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                isExpanded={expanded === plant.name}
                onToggle={() =>
                  setExpanded(expanded === plant.name ? null : plant.name)
                }
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🌵</p>
              <p className="text-sm">No plants match your filters.</p>
              <button
                onClick={() => { setSearch(""); setCat("All"); setZone("All"); }}
                className="mt-4 text-teal-700 text-sm underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Plant Card ─────────────────────────────────────────── */
function PlantCard({ plant, isExpanded, onToggle }) {
  const zoneMeta = ZONE_META[plant.light_zone] || null;
  const catIcon  = CATEGORY_ICONS[plant.category] || "🌱";

  return (
    <div
      className={`bg-white rounded-3xl lg:rounded-2xl border shadow-md overflow-hidden
                  transition-shadow hover:shadow-lg
                  ${isExpanded ? "border-teal-300" : "border-gray-200"}`}
      role="region"
      aria-label={`${plant.name} plant card`}
    >
      {/* ── Card header ──────────────────────────────────────── */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left p-5 focus-visible:ring-2 focus-visible:ring-inset
                   focus-visible:ring-teal-700"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h2 className="font-bold text-gray-900 text-sm lg:text-base leading-tight">
              {plant.name}
            </h2>

            {/* Category + zone badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold
                               uppercase tracking-wider bg-teal-50 text-teal-700
                               border border-teal-200 px-2 py-0.5 rounded-full">
                <span aria-hidden="true">{catIcon}</span>
                {plant.category}
              </span>

              {zoneMeta && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold
                               uppercase tracking-wider border px-2 py-0.5 rounded-full
                               ${zoneMeta.bg} ${zoneMeta.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${zoneMeta.dot}`} aria-hidden="true" />
                  {zoneMeta.label}
                </span>
              )}
            </div>
          </div>

          {/* Timing summary */}
          <div className="text-right flex-shrink-0 space-y-1">
            {plant.germination_days != null && (
              <p className="text-[10px] text-gray-400">
                <span className="font-semibold text-gray-600">{plant.germination_days}d</span> germ.
              </p>
            )}
            {plant.harvest_days != null && (
              <p className="text-[10px] text-gray-400">
                <span className="font-semibold text-teal-600">{plant.harvest_days}d</span> harvest
              </p>
            )}
          </div>
        </div>

        {/* Teacher note (always visible) */}
        {plant.teacher_note && (
          <p className="text-xs text-gray-500 italic mt-3 line-clamp-2">
            {plant.teacher_note}
          </p>
        )}
      </button>

      {/* ── Expanded detail ──────────────────────────────────── */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 bg-gray-50">

          {/* Lesson hook */}
          {plant.lesson_hook && (
            <div className="flex items-start gap-2">
              <span className="text-teal-600 text-sm mt-0.5" aria-hidden="true">🔬</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">
                  Lesson Hook
                </p>
                <p className="text-xs lg:text-sm text-gray-700">{plant.lesson_hook}</p>
              </div>
            </div>
          )}

          {/* Best classroom use */}
          {plant.best_use && (
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-sm mt-0.5" aria-hidden="true">🎓</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                  Best Use
                </p>
                <p className="text-xs lg:text-sm text-gray-700">{plant.best_use}</p>
              </div>
            </div>
          )}

          {/* Timing details */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {plant.germination_days != null && (
              <StatPill label="Germinate" value={`${plant.germination_days}d`} />
            )}
            {plant.thin_to != null && (
              <StatPill label="Thin to" value={`${plant.thin_to}`} />
            )}
            {plant.harvest_days != null && (
              <StatPill label="1st Harvest" value={`${plant.harvest_days}d`} />
            )}
          </div>

          {/* Price */}
          {plant.price && (
            <p className="text-[10px] text-gray-400 pt-1">
              Gardyn yCube: <span className="font-semibold text-gray-600">{plant.price}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-2 py-2 text-center shadow-sm">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-teal-700 mt-0.5">{value}</p>
    </div>
  );
}
