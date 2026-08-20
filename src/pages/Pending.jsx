import { useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";

export default function Pending() {
  const { user, profile, refreshProfile } = useAuth();

  // Get email from user object or profile
  const email = user?.email || profile?.email || "educator";
  const displayName = email.includes("@") ? email.split("@")[0] : email;
  const isNew = !profile; // No profile means account is still being set up

  // Live-watch this user's own profile row. The moment an admin flips
  // is_approved to true, refresh the in-memory profile so ProtectedRoute
  // sends them straight into the app - no page refresh, no waiting on an
  // email this app doesn't actually send.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-approval-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.is_approved) {
            refreshProfile?.();
          }
        }
      )
      .subscribe();

    // Fallback in case the realtime event is missed (e.g. Realtime isn't
    // enabled for this table in the Supabase dashboard) - poll periodically.
    const interval = setInterval(() => {
      refreshProfile?.();
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center
                 bg-gradient-to-br from-teal-800 to-teal-900 text-white animate-fadeIn"
    >
      {/* ICON */}
      <div
        aria-hidden="true"
        className="w-20 h-20 lg:w-24 lg:h-24 bg-white/10 text-white rounded-full
                   flex items-center justify-center text-4xl lg:text-5xl
                   mb-6 shadow-xl backdrop-blur-sm border border-white/20"
      >
        🛡️
      </div>

      {/* TITLE */}
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">
        {isNew ? "Setting Up Your Account…" : "Awaiting Approval"}
      </h1>

      {/* MESSAGE */}
      <p className="text-sm lg:text-base text-teal-100 leading-relaxed max-w-xs mb-8">
        Hi <span className="font-semibold">{displayName}</span> — your
        account {isNew ? "is being created" : "is awaiting educator verification"}.
        This page will update automatically as soon as an admin approves your
        access — no need to keep refreshing, but it's safe to close the tab
        and check back later too.
      </p>

      {/* SIGN OUT */}
      <button
        aria-label="Sign out"
        onClick={() => supabase.auth.signOut()}
        className="text-white/90 underline text-xs lg:text-sm tracking-wider
                   hover:text-white transition"
      >
        Sign Out
      </button>
    </div>
  );
}
