import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import ProfileDetailsForm from "../components/ProfileDetailsForm";
import { SUPPORT_CONTACT, missingProfileFields } from "../config/app";
import { displayName, affiliation } from "../utils/displayName";

export default function Pending() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);

  // Live-watch this user's own profile row. The moment an admin flips
  // is_approved to true, refresh the in-memory profile so the redirect
  // below sends them straight into the app - no page refresh needed.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-approval-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.is_approved) refreshProfile?.();
        }
      )
      .subscribe();

    // Fallback in case the realtime event is missed - poll, but slowly
    // enough that a few hundred pending tabs don't hammer the database.
    const interval = setInterval(() => refreshProfile?.(), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-900" />;
  }
  // Not signed in → sign-in page. Approved (or admin) → into the app.
  if (!user) return <Navigate to="/auth" replace />;
  if (profile && (profile.role === "admin" || profile.is_approved === true)) {
    return <Navigate to="/" replace />;
  }

  const missing = missingProfileFields(profile);
  const needsDetails = missing.length > 0;
  const showForm = needsDetails || editing;
  const name = displayName(profile || { email: user.email });
  const org = affiliation(profile);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-teal-800 to-teal-900 text-white animate-fadeIn">
      <div className="w-full max-w-sm space-y-6">
        <div
          aria-hidden="true"
          className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center text-4xl shadow-xl border border-white/20"
        >
          {showForm ? "📝" : "⏳"}
        </div>

        {showForm ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {needsDetails ? "One more step" : "Update your details"}
              </h1>
              <p className="text-sm text-teal-100 leading-relaxed">
                {needsDetails
                  ? "Tell us who you are so an administrator can verify and approve your account."
                  : "Keep these accurate so an administrator can find and approve you."}
              </p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <ProfileDetailsForm
                tone="dark"
                submitLabel={needsDetails ? "Submit for approval" : "Save"}
                onSaved={() => setEditing(false)}
                onCancel={needsDetails ? undefined : () => setEditing(false)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Awaiting approval</h1>
              <p className="text-sm lg:text-base text-teal-100 leading-relaxed">
                Thanks, <span className="font-semibold">{name}</span>! Your account is waiting for an
                administrator to confirm you're an educator in the Growing Minds program.
              </p>
              <p className="text-sm text-teal-100 leading-relaxed">
                This page updates on its own the moment you're approved. It's fine to close it and
                sign in again later.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-left text-sm space-y-1">
              <p className="text-xs uppercase tracking-wide text-teal-200 font-semibold">Submitted as</p>
              <p className="font-semibold">{name}</p>
              {org && <p className="text-teal-100">{org}</p>}
              {profile?.remc && <p className="text-teal-100">{profile.remc}</p>}
              <p className="text-teal-100 break-all">{user.email}</p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-2 text-xs underline text-white/90 hover:text-white"
              >
                Edit details
              </button>
            </div>

            <p className="text-xs text-teal-100">
              Waiting more than a school day? Email{" "}
              <a className="underline font-semibold" href={`mailto:${SUPPORT_CONTACT.email}`}>
                {SUPPORT_CONTACT.email}
              </a>
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-white/90 underline text-xs lg:text-sm tracking-wider hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
