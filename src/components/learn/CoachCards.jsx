import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase/client";
import { computeCoaching } from "../../utils/coaching";
import { loadProgress } from "../../utils/learnProgress";

// Coaching cards on the Gardyn Dashboard: timely nudges from Tracker and
// Maintenance data, each linking to the Learn guide that helps. "Not now"
// hides a card for a week in this browser; a new planting brings it back.

const HIDE_DAYS = 7;
const KEY = (uid) => `gm-coach-hidden-${uid}`;
const TONE = {
  green: "bg-green-50 border-green-300",
  teal: "bg-teal-50 border-teal-200",
  amber: "bg-amber-50 border-amber-300",
  blue: "bg-blue-50 border-blue-200",
};

function readHidden(uid) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY(uid)) || "{}");
    const cutoff = Date.now() - HIDE_DAYS * 86400000;
    return Object.fromEntries(Object.entries(all).filter(([, t]) => t > cutoff));
  } catch { return {}; }
}

export default function CoachCards({ userId, slots, maintenance }) {
  const [plants, setPlants] = useState([]);
  const [progress, setProgress] = useState({});
  const [hidden, setHidden] = useState(() => readHidden(userId));

  useEffect(() => {
    let off = false;
    supabase.from("plants").select("name, germination_days, harvest_days")
      .then(({ data }) => { if (!off && data) setPlants(data); });
    loadProgress(userId).then((p) => { if (!off) setProgress(p); });
    return () => { off = true; };
  }, [userId]);

  const cards = useMemo(
    () => computeCoaching({ slots, plants, maintenance, progress }).filter((c) => !hidden[c.key]).slice(0, 3),
    [slots, plants, maintenance, progress, hidden]
  );

  function hide(key) {
    const next = { ...readHidden(userId), [key]: Date.now() };
    try { localStorage.setItem(KEY(userId), JSON.stringify(next)); } catch { /* private mode */ }
    setHidden(next);
  }

  if (!cards.length) return null;

  return (
    <section aria-labelledby="coach-heading" className="space-y-2">
      <h2 id="coach-heading" className="text-xs uppercase tracking-widest font-bold text-teal-800">
        🎓 Coming up in your tower
      </h2>
      {cards.map((c) => (
        <div key={c.key} className={`rounded-2xl border p-4 ${TONE[c.tone] || TONE.teal}`}>
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm lg:text-base">{c.title}</p>
              <p className="text-sm text-gray-700 mt-1">{c.body}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Link to={`/learn/${c.guideId}`}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl px-4 py-2 min-h-[40px] inline-flex items-center">
                  {c.cta} →
                </Link>
                <button type="button" onClick={() => hide(c.key)} className="text-xs font-semibold text-gray-600 underline min-h-[40px]">
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gray-500">Estimates from your Tracker planting dates. Kelby's reminders come first.</p>
    </section>
  );
}
