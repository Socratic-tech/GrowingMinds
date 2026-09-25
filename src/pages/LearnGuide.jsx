import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { TUTORIALS, tutorialById } from "../data/tutorials";
import { hasKidWords, kidStep } from "../data/kidWords";
import { loadProgress, saveProgress } from "../utils/learnProgress";
import { LightMap, SlotPlacer, SproutPicker, HarvestPlant, PhSlider } from "../components/learn/Interactives";
import { Checklist, OrderSteps, Explore, RootSorter } from "../components/learn/Activities";

const INTERACTIVE = {
  placer: SlotPlacer, sprout: SproutPicker, harvest: HarvestPlant, ph: PhSlider,
  checklist: Checklist, order: OrderSteps, explore: Explore, roots: RootSorter,
};

const KID_PREF = "gm-learn-kid";
const readKid = () => { try { return localStorage.getItem(KID_PREF) === "1"; } catch { return false; } };

export default function LearnGuide() {
  const { id } = useParams();
  const guide = tutorialById(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false); // resume point loaded
  const [unlocked, setUnlocked] = useState({}); // step index -> may continue
  const [answers, setAnswers] = useState({}); // step index -> option index
  const [finished, setFinished] = useState(false);
  const [present, setPresent] = useState(false); // classroom projector view
  const [kidPref, setKidPref] = useState(readKid);
  const [zoom, setZoom] = useState(1);
  const headingRef = useRef(null);

  // Reset when switching guides (e.g. "Next guide" from the finish screen).
  useEffect(() => {
    setStep(0); setUnlocked({}); setAnswers({}); setFinished(false); setReady(false);
    if (!guide || !user?.id) return;
    let off = false;
    loadProgress(user.id).then((p) => {
      if (off) return;
      const saved = p[guide.id];
      if (saved && !saved.completed_at && saved.step > 0 && saved.step < guide.steps.length) setStep(saved.step);
      setReady(true);
    });
    return () => { off = true; };
  }, [guide, user?.id]);

  useEffect(() => { if (ready) headingRef.current?.focus(); }, [step, ready, finished, present]);

  // Projector view scales with the screen so the whole class can read it.
  useEffect(() => {
    if (!present) return;
    const fit = () => setZoom(Math.max(1, Math.min(1.8, window.innerWidth / 820)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [present]);

  const unlock = useCallback((i) => setUnlocked((u) => (u[i] ? u : { ...u, [i]: true })), []);
  const unlockCurrent = useCallback(() => unlock(step), [unlock, step]);

  const total = guide?.steps.length || 0;
  const s0 = guide?.steps[step];
  const needsAction = s0 && (s0.type === "quiz" || INTERACTIVE[s0.type]);
  const canContinue = !needsAction || unlocked[step];

  const go = useCallback((to) => {
    setStep(to);
    if (user?.id) saveProgress(user.id, guide.id, to, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user?.id, guide?.id]);

  const finish = useCallback(() => {
    if (user?.id) saveProgress(user.id, guide.id, total, true);
    setFinished(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user?.id, guide?.id, total]);

  const exitPresent = useCallback(() => {
    setPresent(false);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignore */ }
  }, []);

  // Keyboard / clicker: arrows move, Esc leaves the projector view.
  useEffect(() => {
    if (!present) return;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (e.key === "Escape") exitPresent();
      else if ((e.key === "ArrowRight" || e.key === "PageDown") && !finished && canContinue) {
        e.preventDefault();
        step === total - 1 ? finish() : go(step + 1);
      } else if ((e.key === "ArrowLeft" || e.key === "PageUp") && !finished && step > 0) {
        e.preventDefault();
        go(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, finished, canContinue, step, total, go, finish, exitPresent]);

  // Leaving fullscreen with the browser's own Esc also leaves the view.
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setPresent(false); };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (!guide) return <Navigate to="/learn" replace />;

  const kidAvailable = hasKidWords(guide.id);
  const kid = kidAvailable && kidPref;
  const s = kid ? kidStep(guide.id, step, s0) : s0;
  const idx = TUTORIALS.findIndex((t) => t.id === guide.id);
  const nextGuide = TUTORIALS[idx + 1];

  function startPresent() {
    setPresent(true);
    try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch { /* not allowed */ }
  }

  function toggleKid() {
    setKidPref((k) => {
      try { localStorage.setItem(KID_PREF, k ? "0" : "1"); } catch { /* private mode */ }
      return !k;
    });
  }

  function answer(i) {
    setAnswers((a) => ({ ...a, [step]: i }));
    if (s.options[i].correct) unlock(step);
  }

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {kidAvailable && (
        <button type="button" onClick={toggleKid} aria-pressed={kid}
          className={`text-xs font-semibold rounded-full px-3 py-1.5 border-2 min-h-[36px]
            ${kid ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-300 bg-white text-gray-700 hover:border-teal-400"}`}>
          🧒 Kid words {kid ? "on" : "off"}
        </button>
      )}
      {present ? (
        <button type="button" onClick={exitPresent}
          className="text-xs font-semibold rounded-full px-3 py-1.5 border-2 border-gray-300 bg-white text-gray-700 min-h-[36px]">
          ✕ Exit class view
        </button>
      ) : (
        <button type="button" onClick={startPresent}
          className="text-xs font-semibold rounded-full px-3 py-1.5 border-2 border-teal-700 bg-white text-teal-800 hover:bg-teal-50 min-h-[36px]">
          📽️ Present to class
        </button>
      )}
    </div>
  );

  let content;
  if (finished) {
    content = (
      <div className="space-y-6 pb-24 text-center">
        <div aria-hidden="true" className="text-6xl pt-6">🎉</div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl lg:text-3xl font-bold text-teal-800 focus:outline-none">
          {kid ? "Great job, plant experts!" : `You finished “${guide.title}”`}
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {nextGuide && (
            <button type="button" onClick={() => navigate(`/learn/${nextGuide.id}`)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-5 py-3">
              Next: {nextGuide.title} →
            </button>
          )}
          {present
            ? <button type="button" onClick={exitPresent} className="border border-gray-300 bg-white text-gray-700 font-semibold rounded-xl px-5 py-3 hover:bg-gray-50">Exit class view</button>
            : <Link to="/learn" className="border border-gray-300 bg-white text-gray-700 font-semibold rounded-xl px-5 py-3 hover:bg-gray-50">All guides</Link>}
        </div>
        {!present && (
          <p className="text-sm text-gray-600">
            Want students to do this on their own? <Link to="/learn/cards" className="underline font-semibold text-teal-800">Print job cards</Link>.
          </p>
        )}
        {!present && <Sources guide={guide} />}
      </div>
    );
  } else {
    const Interactive = INTERACTIVE[s.type];
    const picked = answers[step];
    content = (
      <div className={`space-y-5 ${present ? "pb-8" : "pb-24"}`}>
        {/* Header + progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {present
              ? <span className="text-xs font-semibold text-gray-500">Class view · ← → keys to move · Esc to exit</span>
              : <Link to="/learn" className="text-xs font-semibold text-teal-800 underline">← All guides</Link>}
            {Toolbar}
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-2xl">{guide.icon}</span>
            <p className="font-bold text-gray-800">{guide.title}</p>
          </div>
          <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${total}`}>
            {guide.steps.map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < step ? "bg-teal-600" : i === step ? "bg-teal-400" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500">Step {step + 1} of {total}</p>
        </div>

        {/* Step card */}
        <section className="bg-white rounded-3xl lg:rounded-2xl border border-gray-200 shadow-md p-5 lg:p-7 space-y-4" aria-live="polite">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl lg:text-2xl font-bold text-teal-800 focus:outline-none">
            {s.type === "quiz" ? s.question : s.title}
          </h1>

          {s.type === "info" && (
            <>
              {s.body.map((p, i) => <p key={i} className="text-base text-gray-700 leading-relaxed">{p}</p>)}
              {s.visual === "lightmap" && <LightMap />}
              {s.tip && (
                <p className="text-sm text-gray-800 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3">
                  <b>Tip:</b> {s.tip}
                </p>
              )}
            </>
          )}

          {s.type === "quiz" && (
            <div className="space-y-2">
              {present && picked == null && (
                <p className="text-sm text-gray-600">🙋 Class vote: take a show of hands, then tap the class's answer.</p>
              )}
              {s.options.map((o, i) => {
                const chosen = picked === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => answer(i)}
                    aria-pressed={chosen}
                    className={`w-full text-left rounded-2xl border-2 px-4 py-3 text-sm lg:text-base font-semibold transition-colors min-h-[48px]
                      ${chosen ? (o.correct ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900")
                               : "border-gray-200 bg-white text-gray-800 hover:border-teal-400"}`}
                  >
                    {present && <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>}
                    {o.text}
                  </button>
                );
              })}
              {picked != null && (
                <p role="status" className={`text-sm rounded-xl px-4 py-3 ${s.options[picked].correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
                  <b>{s.options[picked].correct ? (kid ? "You got it! " : "Correct. ") : "Not quite. "}</b>
                  {s.options[picked].feedback}
                  {!s.options[picked].correct && " Try another answer."}
                </p>
              )}
            </div>
          )}

          {Interactive && (
            <>
              {s.body && <p className="text-base text-gray-700 leading-relaxed">{s.body}</p>}
              <Interactive key={`${guide.id}-${step}`} step={s} onComplete={unlockCurrent} />
            </>
          )}
        </section>

        {/* Nav */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => (step === total - 1 ? finish() : go(step + 1))}
            disabled={!canContinue}
            className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold disabled:opacity-40"
          >
            {step === total - 1 ? "Finish" : "Next →"}
          </button>
        </div>
        {!canContinue && (
          <p className="text-xs text-gray-500 text-center">
            {s.type === "quiz" ? "Pick the right answer to continue." : "Try the activity above to continue."}
          </p>
        )}

        {!present && <Sources guide={guide} />}
      </div>
    );
  }

  if (!present) return content;

  return (
    <div className="fixed inset-0 z-[100] bg-teal-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`${guide.title}, class view`}>
      <div className="mx-auto max-w-3xl px-4 py-6" style={{ zoom }}>
        {content}
      </div>
    </div>
  );
}

function Sources({ guide }) {
  return (
    <p className="text-xs text-gray-500">
      Based on{" "}
      {guide.sources.map((src, i) => (
        <span key={src.url}>
          {i > 0 && (i === guide.sources.length - 1 ? " and " : ", ")}
          <a className="underline" href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a>
        </span>
      ))}
      .
    </p>
  );
}
