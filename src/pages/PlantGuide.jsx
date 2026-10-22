import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { LIGHT_ZONE_META, SLOT_LIGHT_ZONES } from "../config/gardyn";
import { CATEGORY_ICONS, CATEGORY_ORDER, SKILLS, normalizeCategory, skillOf } from "../utils/plantMeta";
import { nutritionFor, scale, highlights, NUTRIENT_LABELS } from "../data/nutrition";
import { formatLocalDate, todayLocal } from "../utils/date";

// Printable Plant Guide: every plant in the `plants` table (synced weekly
// from the Gardyn yCube catalog) on paper, so it's always current.
//
// The guide renders twice: once as an on-screen preview inside the app, and
// once in a portal on <body>. When printing, #root is hidden and only the
// portal copy prints, so long guides flow across pages without the app
// shell's layout getting in the way.

const PRINT_ID = "plant-guide-print";
const PRINT_CSS = `
#${PRINT_ID} { display: none; }
@media print {
  @page { size: letter; margin: 0.45in; }
  html, body { background: #fff !important; }
  #root { display: none !important; }
  #${PRINT_ID} { display: block !important; font-size: 9.5pt; }
  #${PRINT_ID} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

const ZONE_ORDER = ["Yellow (Low)", "Orange (Med)", "Red (High)"];
const SLOTS_BY_ZONE = ZONE_ORDER.reduce((acc, z) => {
  acc[z] = Object.keys(SLOT_LIGHT_ZONES).filter((s) => SLOT_LIGHT_ZONES[s] === z);
  return acc;
}, {});
const ZONE_BORDER = { "Yellow (Low)": "#facc15", "Orange (Med)": "#fb923c", "Red (High)": "#ef4444" };

const LABEL = Object.fromEntries(NUTRIENT_LABELS.map(([k, l]) => [k, l]));
const byName = (a, b) => a.name.localeCompare(b.name);

/* Top nutrition highlights for one typical serving, as short text. */
function nutritionLine(plant) {
  const info = nutritionFor(plant);
  if (info.none) return null;
  const [servingLabel, grams] = info.serving;
  const tops = highlights(scale(info.food.per100g, grams)).slice(0, 3);
  if (!tops.length) return { serving: servingLabel, text: "Small amounts per serving (a flavor plant)." };
  const text = tops
    .map((h) => {
      const n = LABEL[h.key];
      return `${n.startsWith("Vitamin") ? n : n.toLowerCase()} ${h.pct}% DV`;
    })
    .join(" · ");
  return { serving: servingLabel, text };
}

function harvestText(p) {
  if (p.harvest_days != null) return `${p.harvest_days} days`;
  return p.first_harvest || "—";
}

export default function PlantGuide() {
  const { showToast } = useToast();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [layout, setLayout] = useState("cards"); // cards | table
  const [groupBy, setGroupBy] = useState("category"); // category | name
  const [which, setWhich] = useState("All");
  const [showNutrition, setShowNutrition] = useState(true);
  const [showPrices, setShowPrices] = useState(false);
  const [showTeacher, setShowTeacher] = useState(true);
  const [onlyInStore, setOnlyInStore] = useState(false);

  useEffect(() => {
    supabase
      .from("plants")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) showToast({ title: "Failed to load plants", description: error.message, type: "error" });
        else setPlants(data || []);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => {
    const present = new Set(plants.map((p) => normalizeCategory(p.category)));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extra = [...present].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
    return [...ordered, ...extra];
  }, [plants]);

  const selected = useMemo(
    () =>
      plants
        .filter((p) => which === "All" || normalizeCategory(p.category) === which)
        .filter((p) => !onlyInStore || p.in_gardyn_store !== false)
        .sort(byName),
    [plants, which, onlyInStore]
  );

  // [{ title, icon, plants }] — one group for A–Z, one per category otherwise.
  const groups = useMemo(() => {
    if (groupBy === "name") return [{ title: null, plants: selected }];
    return categories
      .map((c) => ({ title: c, icon: CATEGORY_ICONS[c], plants: selected.filter((p) => normalizeCategory(p.category) === c) }))
      .filter((g) => g.plants.length);
  }, [selected, categories, groupBy]);

  // "Accurate as of": the most recent date the weekly Gardyn sync checked
  // these plants. Falls back to today if no plant has been checked yet.
  const asOf = useMemo(() => {
    const dates = plants.map((p) => p.gardyn_checked_at).filter(Boolean).map((d) => String(d).slice(0, 10)).sort();
    return dates.length ? dates[dates.length - 1] : todayLocal();
  }, [plants]);

  const opts = { layout, groupBy, showNutrition, showPrices, showTeacher };
  const guide = <Guide groups={groups} count={selected.length} which={which} opts={opts} asOf={asOf} />;

  return (
    <div className="space-y-6 pb-24">
      <style>{PRINT_CSS}</style>

      <div className="space-y-3">
        <Link to="/plants" className="text-xs font-semibold text-teal-800 underline">← Plant Library</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🖨️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Plant Guide</h1>
            <p className="text-xs text-gray-600 mt-0.5">Every plant and everything we know about it, ready to print.</p>
          </div>
        </div>
      </div>

      <fieldset className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <legend className="text-sm font-bold text-gray-800 px-1">Set up your guide</legend>

        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["cards", "📇 Full guide", "A card for each plant: timing, light, lesson hook, classroom use, and nutrition."],
            ["table", "📋 Quick reference", "One row per plant on a few pages. Good to post next to the tower."],
          ].map(([v, title, hint]) => (
            <label key={v} className={`flex gap-3 rounded-2xl border-2 p-3 cursor-pointer ${layout === v ? "border-teal-700 bg-teal-50" : "border-gray-200 hover:border-teal-300"}`}>
              <input type="radio" name="guide-layout" className="mt-1 accent-teal-700" checked={layout === v} onChange={() => setLayout(v)} />
              <span>
                <span className="block text-sm font-bold text-gray-900">{title}</span>
                <span className="block text-xs text-gray-600">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            Plants
            <select value={which} onChange={(e) => setWhich(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-700">
              <option value="All">All plants</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            Order
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-700">
              <option value="category">By category</option>
              <option value="name">A–Z</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
          {layout === "cards" && (
            <>
              <Check checked={showNutrition} onChange={setShowNutrition}>Nutrition highlights</Check>
              <Check checked={showTeacher} onChange={setShowTeacher}>Teacher notes</Check>
            </>
          )}
          <Check checked={showPrices} onChange={setShowPrices}>Gardyn prices</Check>
          <Check checked={onlyInStore} onChange={setOnlyInStore}>Only plants sold by Gardyn now</Check>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => window.print()} disabled={loading || !selected.length}
            className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3">
            🖨️ Print {selected.length ? `${selected.length} plants` : ""}
          </button>
          <p className="text-xs text-gray-500">
            Tip: print in color so the sun levels show. Choose “Save as PDF” to keep a copy.
          </p>
        </div>
      </fieldset>

      {loading ? (
        <p className="text-sm text-gray-500">Loading plants…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:p-6" aria-label="Print preview">
          {guide}
        </div>
      )}

      {!loading && createPortal(<div id={PRINT_ID}>{guide}</div>, document.body)}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" className="accent-teal-700" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

/* ─── The printable guide ────────────────────────────────── */
function Guide({ groups, count, which, opts, asOf }) {
  return (
    <div className="text-gray-900" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
      <header className="border-b-2 border-teal-800 pb-2 mb-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-teal-900 leading-tight">🌱 Growing Minds Plant Guide</h2>
            <p className="text-xs text-gray-600">
              {which === "All" ? "All plants" : which} · {count} plant{count === 1 ? "" : "s"} · Gardyn yCube catalog
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-teal-900">Accurate as of {formatLocalDate(asOf, { month: "long", day: "numeric", year: "numeric" })}</p>
            <p className="text-[11px] text-gray-500">Printed {formatLocalDate(todayLocal(), { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        <Legend />
      </header>

      {count === 0 && <p className="text-sm text-gray-500">No plants match these settings.</p>}

      {groups.map((g, i) => (
        <section key={g.title || "all"} className={i ? "mt-5" : ""}>
          {g.title && (
            <h3 className="text-lg font-bold text-teal-900 border-b border-teal-200 mb-2 pb-0.5" style={{ breakAfter: "avoid" }}>
              <span aria-hidden="true">{g.icon}</span> {g.title}
              <span className="ml-2 text-xs font-semibold text-gray-500">{g.plants.length}</span>
            </h3>
          )}
          {opts.layout === "table" ? (
            <PlantTable plants={g.plants} opts={opts} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5">
              {g.plants.map((p) => <GuideCard key={p.id} plant={p} opts={opts} />)}
            </div>
          )}
        </section>
      ))}

      <p className="mt-4 text-[10px] text-gray-500 leading-snug">
        Plant list accurate as of {formatLocalDate(asOf, { month: "long", day: "numeric", year: "numeric" })}, the last weekly check of the Gardyn catalog; reprint for
        the latest. Timing and care levels from Gardyn (mygardyn.com). Nutrition: % Daily Value for one typical raw serving, from USDA FoodData
        Central; 20%+ is an excellent source, 10–19% a good source.
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-700">
      {ZONE_ORDER.map((z) => (
        <span key={z} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${LIGHT_ZONE_META[z].dot}`} aria-hidden="true" />
          <b>{LIGHT_ZONE_META[z].label}</b>
          <span className="text-gray-500">slots {SLOTS_BY_ZONE[z].join(", ")}</span>
        </span>
      ))}
      <span className="text-gray-500">
        Skill: {Object.values(SKILLS).map((s) => `${s.icon} ${s.label}`).join("  ")}
      </span>
    </div>
  );
}

function ZoneBadge({ zone }) {
  const m = LIGHT_ZONE_META[zone];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide border px-1.5 py-0.5 rounded-full ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function GuideCard({ plant: p, opts }) {
  const skill = SKILLS[skillOf(p)];
  const nut = opts.showNutrition ? nutritionLine(p) : null;
  const cat = normalizeCategory(p.category);

  return (
    <article
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs leading-snug"
      style={{ breakInside: "avoid", borderLeft: `5px solid ${ZONE_BORDER[p.light_zone] || "#d1d5db"}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-gray-900 leading-tight">{p.name}</h4>
        {opts.showPrices && p.price && (
          <span className="shrink-0 text-[10px] text-gray-600">{p.price}{p.member_price ? ` · members ${p.member_price}` : ""}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 mt-1">
        {opts.groupBy === "name" && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded-full">
            {CATEGORY_ICONS[cat] || "🌱"} {cat}
          </span>
        )}
        <ZoneBadge zone={p.light_zone} />
        {skill && (
          <span className={`text-[10px] font-bold uppercase tracking-wide border px-1.5 py-0.5 rounded-full ${skill.badge}`}>
            {skill.icon} {skill.label}
          </span>
        )}
        {p.in_gardyn_store === false && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full">
            Not in Gardyn store
          </span>
        )}
      </div>

      <dl className="grid grid-cols-4 gap-1 mt-1.5 text-center">
        <Stat label="Sprouts" value={p.germination_days != null ? `${p.germination_days} d` : "—"} />
        <Stat label="Thin to" value={p.thin_to ?? "—"} />
        <Stat label="1st harvest" value={harvestText(p)} />
        <Stat label="Yield" value={p.yield || "—"} />
      </dl>

      <div className="mt-1.5 space-y-1">
        {p.perfect_for && <Line label="Perfect for">{p.perfect_for}</Line>}
        {p.lesson_hook && <Line label="🔬 Lesson hook">{p.lesson_hook}</Line>}
        {p.best_use && <Line label="🎓 Best use">{p.best_use}</Line>}
        {opts.showTeacher && p.teacher_note && <Line label="📝 Teacher note"><i>{p.teacher_note}</i></Line>}
        {nut && <Line label={`🥗 Nutrition (${nut.serving})`}>{nut.text}</Line>}
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-gray-50 border border-gray-200 px-1 py-0.5">
      <dt className="text-[9px] uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-[11px] font-bold text-teal-800 leading-tight">{value}</dd>
    </div>
  );
}

function Line({ label, children }) {
  return (
    <p className="text-gray-700">
      <span className="font-semibold text-gray-900">{label}:</span> {children}
    </p>
  );
}

function PlantTable({ plants, opts }) {
  const th = "text-left font-semibold px-1.5 py-1";
  return (
    <table className="w-full text-[11px] border-collapse">
      <thead>
        <tr className="bg-teal-50 text-teal-900 border-b border-teal-200">
          <th scope="col" className={th}>Plant</th>
          {opts.groupBy === "name" && <th scope="col" className={th}>Category</th>}
          <th scope="col" className={th}>Light</th>
          <th scope="col" className={th}>Skill</th>
          <th scope="col" className={th}>Sprouts</th>
          <th scope="col" className={th}>Thin to</th>
          <th scope="col" className={th}>1st harvest</th>
          <th scope="col" className={th}>Yield</th>
          {opts.showPrices && <th scope="col" className={th}>Price</th>}
        </tr>
      </thead>
      <tbody>
        {plants.map((p) => {
          const skill = SKILLS[skillOf(p)];
          const zone = LIGHT_ZONE_META[p.light_zone];
          return (
            <tr key={p.id} className="border-b border-gray-200 odd:bg-white even:bg-gray-50" style={{ breakInside: "avoid" }}>
              <th scope="row" className="text-left font-bold text-gray-900 px-1.5 py-1">{p.name}</th>
              {opts.groupBy === "name" && <td className="px-1.5 py-1">{normalizeCategory(p.category)}</td>}
              <td className="px-1.5 py-1 whitespace-nowrap">
                {zone ? (
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${zone.dot}`} aria-hidden="true" />{zone.short}
                  </span>
                ) : "—"}
              </td>
              <td className="px-1.5 py-1 whitespace-nowrap">{skill ? skill.label : p.care_level || "—"}</td>
              <td className="px-1.5 py-1 whitespace-nowrap">{p.germination_days != null ? `${p.germination_days} d` : "—"}</td>
              <td className="px-1.5 py-1">{p.thin_to ?? "—"}</td>
              <td className="px-1.5 py-1">{harvestText(p)}</td>
              <td className="px-1.5 py-1">{p.yield || "—"}</td>
              {opts.showPrices && <td className="px-1.5 py-1 whitespace-nowrap">{p.price || "—"}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
