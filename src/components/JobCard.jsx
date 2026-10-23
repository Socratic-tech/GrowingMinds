import { Link } from "react-router-dom";

// One printed student job card (Learn → Job cards). `blank` prints empty
// numbered lines for a job written by hand; `preview` hides the guide link.

const line = "inline-block border-b-2 border-gray-400 align-bottom";

export default function JobCard({ card: c, blank = false, preview = false }) {
  return (
    <article className="job-card bg-white rounded-3xl border-4 border-teal-700 p-6 shadow-md space-y-4"
             style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="text-5xl">{c.icon}</span>
        <div className="flex-1 min-w-0">
          {blank ? (
            <>
              <p className="text-2xl font-bold text-teal-900">Job: <span className={`${line} w-3/4`}>&nbsp;</span></p>
              <p className="text-sm font-bold text-teal-800 mt-1">
                Who: <span className={`${line} w-1/3`}>&nbsp;</span> · about <span className={`${line} w-10`}>&nbsp;</span> minutes
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-teal-900 break-words">{c.title}</h2>
              <p className={`text-sm font-bold ${c.adult ? "text-amber-800" : "text-teal-800"}`}>
                {c.adult ? "👩‍🏫 " : "👥 "}{c.who || (c.adult ? "With a grown-up" : "Student team")}{c.minutes ? ` · about ${c.minutes} minutes` : ""}
              </p>
            </>
          )}
        </div>
      </header>
      <ol className="space-y-2">
        {(blank ? Array(6).fill("") : c.steps).map((s, i) => (
          <li key={i} className="flex gap-3 text-lg text-gray-900 leading-snug">
            <span aria-hidden="true" className="w-8 h-8 shrink-0 rounded-full border-2 border-teal-700 text-teal-800 font-bold flex items-center justify-center">{i + 1}</span>
            {blank
              ? <span className="flex-1 border-b-2 border-gray-300 h-8" aria-label={`Step ${i + 1}, blank`} />
              : <span className="pt-0.5 break-words min-w-0">{s}</span>}
          </li>
        ))}
      </ol>
      {blank ? (
        <p className="text-base font-bold text-red-800 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">⚠️ Be safe: <span className={`${line} w-2/3 border-red-300`}>&nbsp;</span></p>
      ) : c.safety ? (
        <p className="text-base font-bold text-red-800 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2 break-words">⚠️ {c.safety}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 text-base text-gray-800 pt-1">
        <p>Team: <span className={`${line} w-3/5`}>&nbsp;</span></p>
        <p>Date: <span className={`${line} w-3/5`}>&nbsp;</span></p>
      </div>
      {!preview && c.guide && (
        <Link to={`/learn/${c.guide}`} className="no-print inline-block text-xs font-semibold text-teal-800 underline">Teacher guide for this job →</Link>
      )}
    </article>
  );
}
