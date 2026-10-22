import { useState } from "react";

// Small single-series line chart (inline SVG): x = day since planting,
// y = a measurement. One series, so no legend; the title names it.
// Hover or focus a point for its exact value; a table sits beside it.
const W = 560, H = 180, PAD = { l: 36, r: 12, t: 12, b: 26 };
const INK = "#0f766e"; // teal-700, the app's data color

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
}

export default function MiniLineChart({ title, unit, points }) {
  const [active, setActive] = useState(null);
  const pts = points.filter((p) => p.y != null && p.x != null).sort((a, b) => a.x - b.x);
  if (pts.length === 0) return null;

  const xMin = Math.min(...pts.map((p) => p.x)), xMax = Math.max(...pts.map((p) => p.x));
  const yMax = niceMax(Math.max(...pts.map((p) => p.y)));
  const sx = (x) => PAD.l + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (y) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);
  const ticks = [0, yMax / 2, yMax];
  const path = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const a = active != null ? pts[active] : null;

  return (
    <figure>
      <figcaption className="text-xs font-bold text-gray-700 mb-1">{title}</figcaption>
      <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${title}: ${pts.map((p) => `day ${p.x} ${p.y}${unit}`).join(", ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{+t.toFixed(1)}</text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} fontSize="11" fill="#6b7280">Day {xMin}</text>
        {xMax !== xMin && <text x={W - PAD.r} y={H - 6} fontSize="11" fill="#6b7280" textAnchor="end">Day {xMax}</text>}
        <path d={path} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={active === i ? 6 : 4.5} fill={INK} stroke="#fff" strokeWidth="2" />
            <circle cx={sx(p.x)} cy={sy(p.y)} r="14" fill="transparent" tabIndex={0}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              aria-label={`Day ${p.x}: ${p.y}${unit}`} style={{ outline: "none", cursor: "default" }} />
          </g>
        ))}
        {/* last value labeled directly */}
        <text x={Math.min(sx(pts.at(-1).x), W - PAD.r - 4)} y={sy(pts.at(-1).y) - 10} fontSize="12" fontWeight="700" fill="#111827" textAnchor="end">
          {pts.at(-1).y}{unit}
        </text>
      </svg>
      {a && (
        <div className="pointer-events-none absolute rounded-lg bg-gray-900 text-white text-xs px-2 py-1 shadow"
             style={{ left: `${(sx(a.x) / W) * 100}%`, top: `${(sy(a.y) / H) * 100}%`, transform: "translate(-50%, -120%)" }}>
          <b>Day {a.x}</b> · {a.y}{unit}{a.label ? <span className="block opacity-80">{a.label}</span> : null}
        </div>
      )}
      </div>
    </figure>
  );
}
