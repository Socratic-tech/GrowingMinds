import { useMemo, useState } from "react";
import { UNITS, GRADE_BANDS, KIND_META, LESSON_COUNT, DRIVE_ROOT, driveUrl } from "../data/curriculum";

const FILTER_KEY = "gm-curriculum-band";

function savedBand() {
  try { return localStorage.getItem(FILTER_KEY) || ""; } catch { return ""; }
}

function bandLabels(bands) {
  if (!bands || bands.length === GRADE_BANDS.length) return "All grades";
  return GRADE_BANDS.filter((b) => bands.includes(b.id)).map((b) => b.label).join(" · ");
}

const norm = (s) => (s || "").toLowerCase();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function ResourceLink({ res }) {
  const meta = KIND_META[res.kind] || KIND_META.pdf;
  return (
    <a
      href={driveUrl(res.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-white border border-teal-200
                 rounded-xl px-3 py-2 min-h-[36px] hover:bg-teal-50 hover:border-teal-300
                 focus-visible:ring-2 focus-visible:ring-teal-600"
    >
      <span aria-hidden="true">{meta.icon}</span>
      {res.label}
      <span className="sr-only"> (opens Google Drive in a new tab)</span>
    </a>
  );
}

// Browsable view of the team's Google Drive lesson plans, grouped by
// grade band → unit → lesson. Data lives in src/data/curriculum.js.
export default function Curriculum() {
  const [band, setBand] = useState(savedBand);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set());

  function pickBand(id) {
    setBand(id);
    try { localStorage.setItem(FILTER_KEY, id); } catch { /* private mode */ }
  }

  const q = norm(query.trim());
  // Match at the start of a word, so "ph" finds "pH" but not "photosynthesis".
  const re = q ? new RegExp(`(^|[^a-z0-9])${escapeRe(q)}`, "i") : null;
  const hit = (text) => re.test(text);

  const units = useMemo(() => {
    return UNITS
      .filter((u) => !band || u.bands.includes(band))
      .map((u) => {
        let lessons = u.lessons.filter((l) => !band || !l.bands || l.bands.includes(band));
        if (q) {
          const unitHit = hit(`${u.title} ${u.subject}`);
          if (!unitHit) {
            lessons = lessons.filter((l) =>
              hit(`${l.title} ${l.resources.map((x) => x.label).join(" ")}`)
            );
          }
          const guideHit = (u.guides || []).some((g) => hit(g.label));
          if (!unitHit && !guideHit && lessons.length === 0) return null;
        }
        return { ...u, lessons };
      })
      .filter(Boolean);
  }, [band, q]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id) {
    setOpenIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const chip = (active) =>
    `px-3 py-2 rounded-full text-xs font-semibold border min-h-[36px] focus-visible:ring-2 focus-visible:ring-teal-600
     ${active ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        {LESSON_COUNT} lessons and activities from the Growing Minds team. Everything opens in Google Drive —
        use <span className="font-semibold">File → Make a copy</span> to edit your own version.
      </p>

      {/* FILTERS */}
      <div className="space-y-3">
        <div role="group" aria-label="Filter by grade" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!band} onClick={() => pickBand("")} className={chip(!band)}>All grades</button>
          {GRADE_BANDS.map((b) => (
            <button key={b.id} type="button" aria-pressed={band === b.id} onClick={() => pickBand(b.id)} className={chip(band === b.id)}>
              {b.label}
            </button>
          ))}
        </div>
        <label htmlFor="curriculum-search" className="sr-only">Search lessons</label>
        <input
          id="curriculum-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons (e.g. pH, light, germination)…"
          className="w-full p-3 rounded-xl border border-gray-300 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600"
        />
      </div>

      {units.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-sm text-gray-500">
          No lessons match that search.
        </div>
      )}

      {/* UNITS */}
      <div className="space-y-4">
        {units.map((u) => {
          const open = Boolean(q) || openIds.has(u.id);
          const panelId = `unit-${u.id}`;
          return (
            <section key={u.id} aria-labelledby={`${panelId}-title`} className="bg-white rounded-3xl lg:rounded-2xl border border-gray-200 shadow-md">
              <button
                type="button"
                onClick={() => toggle(u.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full text-left p-5 flex items-start gap-3 rounded-3xl lg:rounded-2xl focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide font-bold text-teal-700">
                    {bandLabels(u.bands)} · {u.subject}
                  </p>
                  <h2 id={`${panelId}-title`} className="text-base lg:text-lg font-bold text-gray-800">{u.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {u.summary || `${u.lessons.length} ${u.lessons.some((l) => l.n) ? "lessons" : "activities"}`}
                  </p>
                </div>
                <span aria-hidden="true" className={`text-gray-400 text-lg transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {open && (
                <div id={panelId} className="px-5 pb-5 space-y-3">
                  {u.guides?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {u.guides.map((g) => <ResourceLink key={g.id + g.label} res={g} />)}
                    </div>
                  )}

                  <ol className="space-y-2">
                    {u.lessons.map((l) => (
                      <li key={l.title} className="rounded-2xl bg-teal-50/60 border border-teal-100 p-3 space-y-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {l.n && <span className="text-teal-700">Lesson {l.n} · </span>}
                          {l.title}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {l.resources.map((res) => <ResourceLink key={res.id + res.label} res={res} />)}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {u.folder && (
                    <a
                      href={`https://drive.google.com/drive/folders/${u.folder}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      Open this folder in Google Drive
                    </a>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 pb-4">
        Looking for something else? Browse the{" "}
        <a className="underline" href={`https://drive.google.com/drive/folders/${DRIVE_ROOT}`} target="_blank" rel="noopener noreferrer">
          full Growing Minds folder
        </a>.
      </p>
    </div>
  );
}
