import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import ProfileDetailsForm from "./ProfileDetailsForm";
import { missingProfileFields } from "../config/app";
import { todayLocal } from "../utils/date";
import { welcomeDismissed } from "./WelcomeCard";

const SNOOZE_KEY = (id) => `gm-profile-nudge-snoozed-${id}`;

function snoozedToday(id) {
  try { return localStorage.getItem(SNOOZE_KEY(id)) === todayLocal(); } catch { return false; }
}

// A slim reminder for approved educators whose name, school or district is
// still blank (mostly accounts from before the Sept 2026 rollout). Unlike
// the welcome card it can only be hidden for the day: it comes back until
// the details are filled in. It stays out of the way while the welcome card
// is showing, since that card has the same "Add details" step.
export default function ProfileNudge() {
  const { user, profile } = useAuth();
  const [snoozed, setSnoozed] = useState(() => (user ? snoozedToday(user.id) : true));
  const [open, setOpen] = useState(false);

  if (!user || !profile?.is_approved || snoozed) return null;
  const missing = missingProfileFields(profile);
  if (missing.length === 0) return null;
  if (!welcomeDismissed(profile, user.id)) return null;

  function snooze() {
    setSnoozed(true);
    try { localStorage.setItem(SNOOZE_KEY(user.id), todayLocal()); } catch { /* private mode */ }
  }

  const list = missing.map((f) => f.label.toLowerCase());
  const what = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];

  return (
    <section
      aria-label="Complete your profile"
      className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm"
    >
      {open ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-900">Complete your profile</p>
          <ProfileDetailsForm onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-xl">📝</span>
          <p className="flex-1 min-w-[12rem] text-sm text-amber-900">
            <span className="font-semibold">Complete your profile.</span>{" "}
            Add your {what} so other educators in the directory know who you are.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2 focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Add details
            </button>
            <button
              type="button"
              onClick={snooze}
              className="text-xs text-amber-900 underline hover:text-amber-950 px-1 py-2"
            >
              Not today
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
