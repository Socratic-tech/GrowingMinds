import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { TUTORIALS, tutorialById } from "../data/tutorials";
import { loadProgress, saveProgress } from "../utils/learnProgress";
import { LightMap, SlotPlacer, SproutPicker, HarvestPlant } from "../components/learn/Interactives";

const INTERACTIVE = { placer: SlotPlacer, sprout: SproutPicker, harvest: HarvestPlant };

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
  const headingRef = useRef(null);

  useEffect(() => {
    if (!guide || !user?.id) return;
    loadProgress(user.id).then((p) => {
      const saved = p[guide.id];
      if (saved && !saved.completed_at && saved.step > 0 && saved.step < guide.steps.length) setStep(saved.step);
      setReady(true);
    });
  }, [guide, user?.id]);

  useEffect(() => { if (ready) headingRef.current?.focus(); }, [step, ready, finished]);

  const unlock = useCallback((i) => setUnlocked((u) => (u[i] ? u : { ...u, [i]: true })), []);
  const unlockCurrent = useCallback(() => unlock(step), [unlock, step]);

  if (!guide) return <Navigate to="/learn" replace />;

  const s = guide.steps[step];
  const total = guide.steps.length;
  const needsAction = s.type === "quiz" || INTERACTIVE[s.type];
  const canContinue = !needsAction || unlocked[step];
  const nextGuide = TUTORIALS[TUTORIALS.findIndex((t) => t.id === guide.id) + 1];

  function go(to) {
    setStep(to);
    if (user?.id) saveProgress(user.id, guide.id, to, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    if (user?.id) saveProgress(user.id, guide.id, total, true);
    setFinished(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function answer(i) {
    setAnswers((a) => ({ ...a, [step]: i }));
    if (s.options[i].correct) unlock(step);
  }

  if (finished) {
    return (
      <div className="space-y-6 pb-24 text-center">
        <div aria-hidden="true" className="text-6xl pt-6">🎉</div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl lg:text-3xl font-bold text-teal-800 focus:outline-none">
          You finished “{guide.title}”
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {nextGuide && (
            <button type="button" onClick={() => { setFinished(false); setStep(0); setUnlocked({}); setAnswers({}); navigate(`/learn/${nextGuide.id}`); }}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-5 py-3">
              Next: {nextGuide.title} →
            </button>
          )}
          <Link to="/learn" className="border border-gray-300 bg-white text-gray-700 font-semibold rounded-xl px-5 py-3 hover:bg-gray-50">All guides</Link>
        </div>
        <Sources guide={guide} />
      </div>
    );
  }

  const Interactive = INTERACTIVE[s.type];
  const picked = answers[step];

  return (
    <div className="space-y-5 pb-24">
      {/* Header + progress */}
      <div className="space-y-3">
        <Link to="/learn" className="text-xs font-semibold text-teal-800 underline">← All guides</Link>
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
                  {o.text}
                </button>
              );
            })}
            {picked != null && (
              <p role="status" className={`text-sm rounded-xl px-4 py-3 ${s.options[picked].correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
                <b>{s.options[picked].correct ? "Correct. " : "Not quite. "}</b>
                {s.options[picked].feedback}
                {!s.options[picked].correct && " Try another answer."}
              </p>
            )}
          </div>
        )}

        {Interactive && (
          <>
            {s.body && <p className="text-base text-gray-700 leading-relaxed">{s.body}</p>}
            <Interactive key={`${guide.id}-${step}`} onComplete={unlockCurrent} />
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

      <Sources guide={guide} />
    </div>
  );
}

function Sources({ guide }) {
  return (
    <p className="text-xs text-gray-500">
      Based on{" "}
      {guide.sources.map((src, i) => (
        <span key={src.url}>
          {i > 0 && " and "}
          <a className="underline" href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a>
        </span>
      ))}
      .
    </p>
  );
}
