import { useState } from "react";
import JobCard from "./JobCard";

// Learn → Job cards: write your own student job card (or a copy of a
// built-in one), with a live preview in the printed style.

export const CARD_ICONS = ["🌱", "💧", "✂️", "🥬", "🔍", "📏", "🧽", "🧪", "📷", "🌡️", "🪴", "🐞", "🍅", "🌸", "✏️", "🧺"];
export const MAX_STEPS = 8;

const blankForm = () => ({ icon: "🌱", title: "", adult: false, minutes: 10, steps: ["", "", ""], safety: "" });

/** A built-in or saved card as form values. */
export function cardToForm(c, { copy = false } = {}) {
  return {
    icon: c.icon || "🌱",
    title: copy ? `${c.title} (my version)`.slice(0, 60) : c.title,
    adult: Boolean(c.adult),
    minutes: c.minutes ?? 10,
    steps: [...(c.steps || [])],
    safety: c.safety || "",
  };
}

export default function JobCardMaker({ initial, editing, onSave, onCancel }) {
  const [form, setForm] = useState(initial || blankForm());
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setStep = (i, v) => setForm((f) => ({ ...f, steps: f.steps.map((s, j) => (j === i ? v : s)) }));
  const steps = form.steps.map((s) => s.trim()).filter(Boolean);
  const ready = form.title.trim() && steps.length > 0;

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    await onSave({
      icon: form.icon, title: form.title.trim(), adult: form.adult,
      minutes: form.minutes === "" ? null : Math.min(120, Math.max(1, Math.round(Number(form.minutes)))),
      steps, safety: form.safety.trim() || null,
    });
    setBusy(false);
  }

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white";

  return (
    <section aria-labelledby="card-maker" className="no-print bg-white border-2 border-teal-200 rounded-2xl p-4 space-y-4">
      <h2 id="card-maker" className="font-bold text-teal-800">{editing ? "✏️ Edit your card" : "✏️ Make your own card"}</h2>
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <form onSubmit={submit} className="space-y-3">
          <fieldset>
            <legend className="text-xs font-semibold text-gray-600 mb-1">Icon</legend>
            <div className="flex flex-wrap gap-1">
              {CARD_ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => set("icon", ic)} aria-pressed={form.icon === ic} aria-label={`Icon ${ic}`}
                  className={`w-10 h-10 text-xl rounded-xl border-2 ${form.icon === ic ? "border-teal-700 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs font-semibold text-gray-600">Job name
            <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={60} required className={input} placeholder="e.g. Root Check" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-gray-600">Who does it
              <select value={form.adult ? "adult" : "team"} onChange={(e) => set("adult", e.target.value === "adult")} className={input}>
                <option value="team">Student team</option>
                <option value="adult">With a grown-up</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600">About how many minutes
              <input type="number" min="1" max="120" value={form.minutes} onChange={(e) => set("minutes", e.target.value)} className={input} />
            </label>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-gray-600 mb-1">Steps (short, one action each)</legend>
            {form.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span aria-hidden="true" className="w-6 text-center text-sm font-bold text-teal-800">{i + 1}</span>
                <input id={`card-step-${i}`} value={s} onChange={(e) => setStep(i, e.target.value)} maxLength={140} className={input}
                  aria-label={`Step ${i + 1}`} placeholder={i === 0 ? "e.g. Lift the lid with a grown-up." : ""} />
                <button type="button" onClick={() => set("steps", form.steps.filter((_, j) => j !== i))} disabled={form.steps.length === 1}
                  aria-label={`Remove step ${i + 1}`} className="w-8 h-8 shrink-0 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30">✕</button>
              </div>
            ))}
            {form.steps.length < MAX_STEPS && (
              <button type="button" onClick={() => { const n = form.steps.length; set("steps", [...form.steps, ""]); requestAnimationFrame(() => document.getElementById(`card-step-${n}`)?.focus()); }} className="text-xs font-semibold text-teal-800 underline">+ Add a step</button>
            )}
          </fieldset>
          <label className="block text-xs font-semibold text-gray-600">Safety reminder (optional)
            <input value={form.safety} onChange={(e) => set("safety", e.target.value)} maxLength={140} className={input} placeholder="e.g. Wash your hands after." />
          </label>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy || !ready} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-40">
              {busy ? "Saving…" : editing ? "Save changes" : "Save card"}
            </button>
            <button type="button" onClick={onCancel} className="text-sm underline text-gray-700">Cancel</button>
          </div>
          {!ready && <p className="text-[11px] text-gray-500">Add a job name and at least one step to save.</p>}
        </form>

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Preview</p>
          <JobCard card={{ ...form, title: form.title.trim() || "Job name", steps: steps.length ? steps : ["Your first step"], safety: form.safety.trim() }} preview />
        </div>
      </div>
    </section>
  );
}
