import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import ProfileDetailsForm from "./ProfileDetailsForm";
import { SUPPORT_CONTACT, missingProfileFields } from "../config/app";
import { displayName } from "../utils/displayName";
import { SLOT_COUNT } from "../config/gardyn";

const LOCAL_KEY = (id) => `gm-welcome-dismissed-${id}`;

function locallyDismissed(id) {
  try { return localStorage.getItem(LOCAL_KEY(id)) === "1"; } catch { return false; }
}

// True once the educator has closed the welcome card (on any device).
export function welcomeDismissed(profile, userId) {
  return Boolean(profile?.onboarding_dismissed_at) || locallyDismissed(userId);
}

// Shown at the top of every page until a newly approved educator dismisses
// it. Walks them through the first things to do. Dismissal is saved on the
// profile (so it follows them across devices) with a localStorage fallback
// in case the profile column isn't there yet.
export default function WelcomeCard() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => (user ? locallyDismissed(user.id) : true));
  const [editingDetails, setEditingDetails] = useState(false);

  if (!user || !profile || hidden || profile.onboarding_dismissed_at) return null;

  const needsDetails = missingProfileFields(profile).length > 0;
  const first = displayName(profile).split(" ")[0];

  async function dismiss() {
    setHidden(true);
    try { localStorage.setItem(LOCAL_KEY(user.id), "1"); } catch { /* private mode */ }
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_dismissed_at: new Date().toISOString() })
      .eq("id", user.id);
    if (!error) refreshProfile?.();
  }

  const steps = [
    needsDetails && {
      icon: "📝",
      title: "Add your name and school",
      body: "So other educators know who you are.",
      action: () => setEditingDetails(true),
      cta: "Add details",
    },
    {
      icon: "🌿",
      title: "Set up your Gardyn tracker",
      body: `Record what's planted in each of your ${SLOT_COUNT} slots and when.`,
      action: () => navigate("/tracker"),
      cta: "Open tracker",
    },
    {
      icon: "🔧",
      title: "Log your last maintenance",
      body: "Enter when you last cleaned, refilled, and fed the unit — we'll remind you what's due.",
      action: () => navigate("/maintenance"),
      cta: "Maintenance",
    },
    {
      icon: "🔬",
      title: "Try a Lesson Lab investigation",
      body: "Start from a template and make it your own.",
      action: () => navigate("/lessons"),
      cta: "Lesson Lab",
    },
    {
      icon: "👋",
      title: "Say hello",
      body: "Post a photo of your classroom garden, or ask a question in Q&A.",
      action: () => navigate("/feed"),
      cta: "Feed",
    },
  ].filter(Boolean);

  return (
    <section
      aria-labelledby="welcome-title"
      className="mb-6 bg-white rounded-3xl lg:rounded-2xl border border-teal-200 shadow-lg p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="welcome-title" className="text-lg font-bold text-teal-800">
            Welcome to Growing Minds{first ? `, ${first}` : ""}! 🌱
          </h2>
          <p className="text-sm text-gray-600">A few ways to get started:</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome"
          className="text-gray-500 hover:text-gray-700 text-xl leading-none w-9 h-9 rounded-full hover:bg-gray-100 shrink-0"
        >
          ×
        </button>
      </div>

      {editingDetails ? (
        <ProfileDetailsForm onSaved={() => setEditingDetails(false)} onCancel={() => setEditingDetails(false)} />
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 p-3 rounded-2xl bg-teal-50/60">
              <span aria-hidden="true" className="text-2xl w-8 text-center">{s.icon}</span>
              <div className="flex-1 min-w-[12rem]">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="sr-only">Step {i + 1}: </span>{s.title}
                </p>
                <p className="text-xs text-gray-600">{s.body}</p>
              </div>
              <button
                type="button"
                onClick={s.action}
                className="shrink-0 ml-11 sm:ml-0 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2"
              >
                {s.cta}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 flex-wrap">
        <span>
          Questions? <a className="underline" href={`mailto:${SUPPORT_CONTACT.email}`}>{SUPPORT_CONTACT.email}</a>
        </span>
        <button type="button" onClick={dismiss} className="underline hover:text-gray-700">
          Got it, hide this
        </button>
      </div>
    </section>
  );
}
