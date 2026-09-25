import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { TUTORIALS, LEVELS, COMING_SOON } from "../data/tutorials";
import { loadProgress } from "../utils/learnProgress";

export default function Learn() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (user?.id) loadProgress(user.id).then(setProgress);
  }, [user?.id]);

  const done = TUTORIALS.filter((t) => progress[t.id]?.completed_at).length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🎓</div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Learn</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Short hands-on guides for caring for your Gardyn · {done} of {TUTORIALS.length} done
          </p>
        </div>
      </div>

      {LEVELS.map((lvl) => {
        const guides = TUTORIALS.filter((t) => t.level === lvl.id);
        const soon = COMING_SOON.filter((c) => c.level === lvl.id);
        const lvlDone = guides.filter((t) => progress[t.id]?.completed_at).length;
        return (
          <section key={lvl.id} aria-labelledby={`lvl-${lvl.id}`} className="space-y-3">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 id={`lvl-${lvl.id}`} className="text-lg font-bold text-teal-800">
                  <span aria-hidden="true">{lvl.icon}</span> {lvl.label}
                </h2>
                <p className="text-sm text-gray-600">{lvl.blurb}</p>
              </div>
              {guides.length > 0 && (
                <p className="text-xs font-semibold text-gray-600">{lvlDone} of {guides.length} done</p>
              )}
            </div>
            <ul className="space-y-3">
              {guides.map((t) => {
                const p = progress[t.id];
                const complete = Boolean(p?.completed_at);
                const started = !complete && (p?.step || 0) > 0;
                return (
                  <li key={t.id}>
                    <Link
                      to={`/learn/${t.id}`}
                      className="flex items-center gap-4 bg-white p-5 rounded-3xl lg:rounded-2xl border border-gray-200 shadow-md
                                 hover:border-teal-300 hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-teal-700"
                    >
                      <span aria-hidden="true" className="text-3xl w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">{t.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-gray-800">{t.title}</span>
                        <span className="block text-sm text-gray-600">{t.blurb}</span>
                        <span className="block text-xs text-gray-500 mt-1">
                          About {t.minutes} min · {t.steps.length} steps
                        </span>
                      </span>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full
                        ${complete ? "bg-emerald-100 text-emerald-800" : started ? "bg-amber-100 text-amber-900" : "bg-teal-700 text-white"}`}>
                        {complete ? "✓ Done" : started ? "Continue" : "Start"}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {soon.map((c) => (
                <li key={c.title} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl lg:rounded-2xl border border-dashed border-gray-300">
                  <span aria-hidden="true" className="text-2xl w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 opacity-70">{c.icon}</span>
                  <span className="flex-1 min-w-0 font-semibold text-gray-600">{c.title}</span>
                  <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">Coming soon</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-gray-500">
        Start with Beginner if your tower is new. Care steps follow the Gardyn Help Center.
      </p>
    </div>
  );
}
