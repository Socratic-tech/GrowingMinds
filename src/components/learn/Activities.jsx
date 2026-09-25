import { useEffect, useMemo, useState } from "react";

// Data-driven activities for Learn guides. Each takes the step object
// (from src/data/tutorials*.js) and calls onComplete once the learner has
// done enough to continue.

/* ─── Checklist: tap every item ─────────────────────────── */
export function Checklist({ step, onComplete }) {
  const [done, setDone] = useState(() => new Set());
  const all = step.items.length;
  useEffect(() => { if (done.size === all) onComplete?.(); }, [done, all, onComplete]);
  const toggle = (i) => setDone((d) => { const n = new Set(d); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {step.items.map((it, i) => {
          const on = done.has(i);
          return (
            <li key={i}>
              <button type="button" onClick={() => toggle(i)} aria-pressed={on}
                className={`w-full flex items-start gap-3 text-left rounded-2xl border-2 px-4 py-3 min-h-[48px] transition-colors
                  ${on ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white hover:border-teal-400"}`}>
                <span aria-hidden="true" className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-sm font-bold
                  ${on ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-400 bg-white"}`}>{on ? "✓" : ""}</span>
                <span className="text-sm lg:text-base font-semibold text-gray-800">{it}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="text-sm text-gray-600 text-center">
        {done.size === all ? "Everything's here. Nice!" : `${done.size} of ${all} found`}
      </p>
    </div>
  );
}

/* ─── Order: tap steps in sequence ──────────────────────── */
// A fixed, non-sorted order so the answer is never the display order.
function scramble(n) {
  const idx = [...Array(n).keys()];
  const p = idx.map((i) => (i * 2 + 3) % n);
  return new Set(p).size === n ? p : idx.reverse();
}

export function OrderSteps({ step, onComplete }) {
  const order = useMemo(() => scramble(step.items.length), [step.items.length]);
  const [placed, setPlaced] = useState([]); // indices in correct order so far
  const [miss, setMiss] = useState(null);
  const complete = placed.length === step.items.length;
  useEffect(() => { if (complete) onComplete?.(); }, [complete, onComplete]);

  function tap(i) {
    if (i === placed.length) { setPlaced((p) => [...p, i]); setMiss(null); }
    else setMiss(i);
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2" aria-label="Your order so far">
        {step.items.map((_, n) => (
          <li key={n} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 min-h-[48px]
            ${placed[n] != null ? "border-emerald-500 bg-emerald-50" : "border-dashed border-gray-300 bg-gray-50"}`}>
            <span aria-hidden="true" className="w-7 h-7 shrink-0 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">{n + 1}</span>
            <span className="text-sm lg:text-base font-semibold text-gray-800">{placed[n] != null ? step.items[placed[n]] : ""}</span>
          </li>
        ))}
      </ol>
      {!complete && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">What comes next?</p>
          {order.filter((i) => !placed.includes(i)).map((i) => (
            <button key={i} type="button" onClick={() => tap(i)}
              className={`w-full text-left rounded-2xl border-2 px-4 py-3 text-sm lg:text-base font-semibold min-h-[48px] transition-colors
                ${miss === i ? "border-red-300 bg-red-50 text-red-900" : "border-gray-200 bg-white text-gray-800 hover:border-teal-400"}`}>
              {step.items[i]}
            </button>
          ))}
        </div>
      )}
      <p role="status" className={`text-sm rounded-xl px-4 py-3 ${complete ? "bg-emerald-50 text-emerald-900 font-semibold" : miss != null ? "bg-amber-50 text-amber-900" : "sr-only"}`}>
        {complete ? "That's the build order. Each stage needs the one before it."
          : miss != null ? "Not yet. What has to be in place before that?" : ""}
      </p>
    </div>
  );
}

/* ─── Explore: open cards, `need` of them unlocks ───────── */
export function Explore({ step, onComplete }) {
  const need = step.need || 1;
  const [seen, setSeen] = useState(() => new Set());
  const [open, setOpen] = useState(null);
  useEffect(() => { if (seen.size >= need) onComplete?.(); }, [seen, need, onComplete]);

  function pick(i) {
    setOpen((o) => (o === i ? null : i));
    setSeen((s) => (s.has(i) ? s : new Set(s).add(i)));
  }

  return (
    <div className="space-y-2">
      {step.cards.map((c, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`rounded-2xl border-2 transition-colors ${isOpen ? "border-teal-500 bg-teal-50/50" : seen.has(i) ? "border-teal-200 bg-white" : "border-gray-200 bg-white"}`}>
            <button type="button" onClick={() => pick(i)} aria-expanded={isOpen}
              className="w-full flex items-center gap-3 text-left px-4 py-3 min-h-[48px]">
              <span aria-hidden="true" className="text-2xl">{c.icon}</span>
              <span className="flex-1 text-sm lg:text-base font-semibold text-gray-800">{c.label}</span>
              {seen.has(i) && !isOpen && <span className="text-xs font-bold text-teal-700">✓ Read</span>}
              <span aria-hidden="true" className="text-teal-700">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {c.cause && <p className="text-sm font-bold text-teal-900">Likely cause: <span className="font-semibold">{c.cause}</span></p>}
                {c.text.map((t, j) => (
                  <p key={j} className="text-sm text-gray-700 leading-relaxed">{c.cause ? "Fix: " : ""}{t}</p>
                ))}
                {c.note && <p className="text-xs text-gray-600 italic">{c.note}</p>}
              </div>
            )}
          </div>
        );
      })}
      {need > 1 && (
        <p role="status" className="text-sm text-gray-600 text-center">
          {seen.size >= need ? "Nice. Keep exploring, or continue." : `${seen.size} of ${need} opened`}
        </p>
      )}
    </div>
  );
}

/* ─── Root sorter ───────────────────────────────────────── */
const ROOT_SAMPLES = [
  { color: "#f4f1e6", stroke: "#b9b39c", label: "White roots, no smell", healthy: true,
    why: "White and odorless: healthy." },
  { color: "#6b4a2b", stroke: "#3f2a16", label: "Brown and slimy, falls apart, smells rotten", healthy: false,
    why: "That's root rot. Pinch away the rotting part and throw it out." },
  { color: "#b0306a", stroke: "#6e1c42", label: "Red-purple roots on a Swiss chard", healthy: true,
    why: "Swiss chard and Bull's Blood beets have naturally red-purple roots." },
  { color: "#efe3c0", stroke: "#b8a36e", label: "Creamy white new growth", healthy: true,
    why: "Creamy white new roots are healthy." },
  { color: "#2b2118", stroke: "#120d08", label: "Black and mushy", healthy: false,
    why: "Brown-to-black, mushy roots are rotting. Remove that part." },
];

function RootSvg({ color, stroke }) {
  return (
    <svg viewBox="0 0 80 70" width="80" height="70" aria-hidden="true">
      <rect x="22" y="2" width="36" height="16" rx="3" fill="#d8d2c4" stroke="#9c9483" />
      {[18, 28, 40, 52, 62].map((x, i) => (
        <path key={i} d={`M${x} 18 C ${x - 6 + i * 3} 34, ${x + 6 - i * 2} 46, ${x - 2 + i} 66`}
          fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      ))}
      {[18, 28, 40, 52, 62].map((x, i) => (
        <path key={`c${i}`} d={`M${x} 18 C ${x - 6 + i * 3} 34, ${x + 6 - i * 2} 46, ${x - 2 + i} 66`}
          fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function RootSorter({ onComplete }) {
  const [answers, setAnswers] = useState({}); // i -> bool picked
  const correct = ROOT_SAMPLES.filter((r, i) => answers[i] === r.healthy).length;
  useEffect(() => { if (correct === ROOT_SAMPLES.length) onComplete?.(); }, [correct, onComplete]);

  return (
    <div className="space-y-3">
      {ROOT_SAMPLES.map((r, i) => {
        const a = answers[i];
        const answered = a !== undefined;
        const right = answered && a === r.healthy;
        return (
          <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 p-3
            ${!answered ? "border-gray-200 bg-white" : right ? "border-emerald-500 bg-emerald-50" : "border-amber-400 bg-amber-50"}`}>
            <div className="flex items-center gap-3 flex-1">
              <RootSvg color={r.color} stroke={r.stroke} />
              <div className="flex-1">
                <p className="text-sm lg:text-base font-semibold text-gray-800">{r.label}</p>
                {answered && (
                  <p role="status" className={`text-xs mt-1 ${right ? "text-emerald-900" : "text-amber-900"}`}>
                    <b>{right ? "Right. " : "Look again. "}</b>{right ? r.why : "Try the other choice."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0" role="group" aria-label={`Sort: ${r.label}`}>
              {[[true, "Healthy"], [false, "Needs help"]].map(([v, t]) => (
                <button key={t} type="button" onClick={() => setAnswers((x) => ({ ...x, [i]: v }))} aria-pressed={a === v}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold min-h-[44px]
                    ${a === v ? "border-teal-700 bg-teal-700 text-white" : "border-gray-300 bg-white text-gray-800 hover:border-teal-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <p role="status" className="text-sm text-gray-600 text-center">{correct} of {ROOT_SAMPLES.length} sorted correctly</p>
    </div>
  );
}
