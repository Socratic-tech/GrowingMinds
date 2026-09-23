import { useState } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "./ui/toast";
import { PROFILE_FIELDS } from "../config/app";

// Edit your own name / school / district / REMC. Used on the Pending page,
// the welcome card, and your own Profile page.
//
// `tone="dark"` renders for the teal Pending background.
export default function ProfileDetailsForm({ onSaved, onCancel, tone = "light", submitLabel = "Save" }) {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [values, setValues] = useState(() =>
    Object.fromEntries(PROFILE_FIELDS.map((f) => [f.key, profile?.[f.key] || ""]))
  );
  const [saving, setSaving] = useState(false);

  const dark = tone === "dark";

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || !user) return;

    const update = {};
    for (const f of PROFILE_FIELDS) {
      const v = values[f.key].trim().slice(0, f.max);
      if (f.required && !v) {
        showToast({ title: `${f.label} is required`, type: "error" });
        return;
      }
      update[f.key] = v || null;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select("id");
    setSaving(false);

    if (error || !data?.length) {
      const missingColumn = error?.message?.includes("column");
      showToast({
        title: "Couldn't save your details",
        description: missingColumn
          ? "The database hasn't been updated for this version yet. Please let your coordinator know."
          : error?.message || "Please try again.",
        type: "error",
      });
      return;
    }

    await refreshProfile?.();
    showToast({ title: "Details saved", type: "success" });
    onSaved?.(update);
  }

  const inputCls = dark
    ? "w-full p-3 rounded-xl bg-white/95 text-gray-800 text-sm border border-white/30 focus-visible:ring-2 focus-visible:ring-white"
    : "w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-800 shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600";
  const labelCls = dark ? "block text-xs font-semibold text-teal-50 mb-1" : "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      {PROFILE_FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={`pd-${f.key}`} className={labelCls}>
            {f.label}
            {!f.required && <span className="font-normal opacity-75"> (optional)</span>}
          </label>
          <input
            id={`pd-${f.key}`}
            className={inputCls}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            maxLength={f.max}
            required={f.required}
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors ${
            dark ? "bg-white text-teal-800 hover:bg-teal-50" : "bg-teal-700 text-white hover:bg-teal-800"
          }`}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
