import { useState } from "react";
import { Link } from "react-router-dom";
import { JOB_CARDS } from "../data/jobCards";

// Printable student job cards. Print CSS hides the app shell and prints only
// the selected cards, two per page, each with blanks for team and date.
const PRINT_CSS = `
@media print {
  @page { margin: 0.5in; }
  body * { visibility: hidden !important; }
  #job-cards, #job-cards * { visibility: visible !important; }
  #job-cards { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
  #job-cards .job-card { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; margin-bottom: 0.35in; }
  #job-cards .job-card:nth-of-type(2n) { break-after: page; page-break-after: always; }
  #job-cards .no-print { display: none !important; }
}`;

export default function JobCards() {
  const [picked, setPicked] = useState(() => new Set(JOB_CARDS.map((c) => c.id)));
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const chosen = JOB_CARDS.filter((c) => picked.has(c.id));

  return (
    <div className="space-y-6 pb-24">
      <style>{PRINT_CSS}</style>
      <div className="space-y-3">
        <Link to="/learn" className="text-xs font-semibold text-teal-800 underline">← All guides</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🖨️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Student job cards</h1>
            <p className="text-xs text-gray-600 mt-0.5">Kid-friendly task cards for your tower teams. Print, laminate, and rotate them weekly.</p>
          </div>
        </div>
      </div>

      <fieldset className="bg-white rounded-2xl border border-gray-200 p-4">
        <legend className="text-sm font-bold text-gray-800 px-1">Cards to print</legend>
        <div className="flex flex-wrap gap-2 mt-1">
          {JOB_CARDS.map((c) => (
            <label key={c.id} className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold cursor-pointer min-h-[40px]
              ${picked.has(c.id) ? "border-teal-700 bg-teal-50 text-teal-900" : "border-gray-200 text-gray-600"}`}>
              <input type="checkbox" className="accent-teal-700" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
              <span aria-hidden="true">{c.icon}</span> {c.title}
            </label>
          ))}
        </div>
        <button type="button" onClick={() => window.print()} disabled={chosen.length === 0}
          className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-5 py-3 disabled:opacity-40">
          🖨️ Print {chosen.length} card{chosen.length === 1 ? "" : "s"}
        </button>
      </fieldset>

      <div id="job-cards" className="grid gap-4 md:grid-cols-2">
        {chosen.map((c) => (
          <article key={c.id} className="job-card bg-white rounded-3xl border-4 border-teal-700 p-6 shadow-md space-y-4"
                   style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
            <header className="flex items-center gap-3">
              <span aria-hidden="true" className="text-5xl">{c.icon}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-teal-900">{c.title}</h2>
                <p className={`text-sm font-bold ${c.adult ? "text-amber-800" : "text-teal-800"}`}>
                  {c.adult ? "👩‍🏫 " : "👥 "}{c.who} · about {c.minutes} minutes
                </p>
              </div>
            </header>
            <ol className="space-y-2">
              {c.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-lg text-gray-900 leading-snug">
                  <span aria-hidden="true" className="w-8 h-8 shrink-0 rounded-full border-2 border-teal-700 text-teal-800 font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <p className="text-base font-bold text-red-800 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">⚠️ {c.safety}</p>
            <div className="grid grid-cols-2 gap-4 text-base text-gray-800 pt-1">
              <p>Team: <span className="inline-block border-b-2 border-gray-400 w-3/5 align-bottom">&nbsp;</span></p>
              <p>Date: <span className="inline-block border-b-2 border-gray-400 w-3/5 align-bottom">&nbsp;</span></p>
            </div>
            <Link to={`/learn/${c.guide}`} className="no-print inline-block text-xs font-semibold text-teal-800 underline">Teacher guide for this job →</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
