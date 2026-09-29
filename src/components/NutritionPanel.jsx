import { useState } from "react";
import { nutritionFor, scale, highlights, DAILY_VALUES, NUTRIENT_LABELS } from "../data/nutrition";

// Nutrition facts inside an expanded Plant Library card. Data: USDA
// FoodData Central (SR Legacy); see src/data/nutrition.js.

const WHAT_IT_DOES = {
  vitA: "helps eyes see in dim light",
  vitC: "helps the body heal and fight germs",
  vitK: "helps blood clot when you get a cut",
  folate: "helps the body make new cells",
  calcium: "builds strong bones and teeth",
  iron: "helps blood carry oxygen",
  potassium: "helps muscles and nerves work",
  magnesium: "helps muscles and bones",
  fiber: "helps digestion",
  protein: "builds and repairs muscles",
};
const LABEL = Object.fromEntries(NUTRIENT_LABELS.map(([k, l]) => [k, l]));

function fmt(v, unit) {
  if (v == null) return "—";
  if (!unit) return String(Math.round(v)); // kcal
  if (v === 0) return `0 ${unit}`;
  if (v < 1) return `${v.toFixed(v < 0.1 ? 2 : 1)} ${unit}`;
  if (v < 10) return `${v.toFixed(1)} ${unit}`;
  return `${Math.round(v)} ${unit}`;
}
function pctDV(key, v) {
  const dv = DAILY_VALUES[key];
  if (!dv || v == null) return "";
  const p = (v / dv) * 100;
  if (p > 0 && p < 1) return "<1%";
  return `${Math.round(p)}%`;
}

export default function NutritionPanel({ plant }) {
  const info = nutritionFor(plant);
  const [per100, setPer100] = useState(false);

  if (info.none) {
    return (
      <Section>
        <p className="text-xs lg:text-sm text-gray-600">{info.none}</p>
      </Section>
    );
  }

  const [servingLabel, grams] = info.serving;
  const values = per100 ? info.food.per100g : scale(info.food.per100g, grams);
  const tops = highlights(values).slice(0, 3);

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-700">
          {per100 ? "Per 100 g, raw" : <>Per <b>{servingLabel}</b> ({grams} g), raw</>}
        </p>
        <div className="flex rounded-full border border-gray-300 bg-white p-0.5 text-[11px] font-semibold" role="group" aria-label="Show nutrition per">
          {[[false, "Serving"], [true, "100 g"]].map(([v, t]) => (
            <button key={t} type="button" onClick={() => setPer100(v)} aria-pressed={per100 === v}
              className={`px-2.5 py-1 rounded-full ${per100 === v ? "bg-teal-700 text-white" : "text-gray-600 hover:text-teal-800"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tops.length > 0 ? (
        <ul className="space-y-1.5">
          {tops.map((h) => (
            <li key={h.key} className="flex items-start gap-2 text-xs lg:text-sm">
              <span className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border
                ${h.level === "excellent" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-sky-50 text-sky-800 border-sky-200"}`}>
                {h.pct}% DV
              </span>
              <span className="text-gray-800">
                <b>{h.level === "excellent" ? "Excellent" : "Good"} source of {LABEL[h.key].startsWith("Vitamin") ? LABEL[h.key] : LABEL[h.key].toLowerCase()}</b>
                {WHAT_IT_DOES[h.key] && <span className="text-gray-600">: {WHAT_IT_DOES[h.key]}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-600">
          {per100 ? "Not a major source of any listed nutrient per 100 g." : "In a typical serving this is a flavor plant: the amounts are small. Tap 100 g to compare it with other plants."}
        </p>
      )}

      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold text-teal-800 underline list-none">
          <span className="group-open:hidden">Show all nutrients</span>
          <span className="hidden group-open:inline">Hide nutrients</span>
        </summary>
        <table className="w-full mt-2 text-xs bg-white border border-gray-200 rounded-xl overflow-hidden">
          <caption className="sr-only">Nutrition facts for {plant.name}</caption>
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th scope="col" className="text-left font-semibold px-3 py-1.5">Nutrient</th>
              <th scope="col" className="text-right font-semibold px-3 py-1.5">Amount</th>
              <th scope="col" className="text-right font-semibold px-3 py-1.5">% DV</th>
            </tr>
          </thead>
          <tbody>
            {NUTRIENT_LABELS.filter(([k]) => values[k] != null).map(([k, label, unit]) => (
              <tr key={k} className="border-t border-gray-100">
                <th scope="row" className="text-left font-medium text-gray-800 px-3 py-1">{label}</th>
                <td className="text-right text-gray-800 px-3 py-1 tabular-nums">{fmt(values[k], unit)}</td>
                <td className="text-right text-gray-600 px-3 py-1 tabular-nums">{pctDV(k, values[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="text-[10px] text-gray-500 leading-snug">
        {info.approx && <>{info.approx} </>}
        Source:{" "}
        <a className="underline" href={`https://fdc.nal.usda.gov/food-details/${info.fdc}/nutrients`} target="_blank" rel="noopener noreferrer">
          USDA FoodData Central
        </a>{" "}
        ({info.food.usda}). % Daily Value is based on FDA values for adults and children 4 and up.
      </p>
    </Section>
  );
}

function Section({ children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-emerald-600 text-sm mt-0.5" aria-hidden="true">🥗</span>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Nutrition</p>
        {children}
      </div>
    </div>
  );
}
