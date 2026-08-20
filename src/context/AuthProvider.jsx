import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

// Verbose diagnostic logging only runs in local dev builds, never in the
// production bundle deployed to educators.
const isDev = import.meta.env.DEV;
const devLog = (...args) => { if (isDev) console.log(...args); };

// One attempt at fetching the profile row, racing a timeout so a hung
// request can't leave the app stuck on a loading screen forever.
function fetchProfileOnce(authUser, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Profile fetch timeout after ${timeoutMs / 1000}s`)), timeoutMs)
  );
  const fetchPromise = supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();
  return Promise.race([fetchPromise, timeoutPromise]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadProfilePromiseRef = useRef(null);
  const loadedUserIdRef = useRef(null);

  // Fetch profile for a given auth user
  const loadProfile = async (authUser, force = false) => {
    // If already loading this exact user, wait for it to complete
    if (!force && loadProfilePromiseRef.current && loadedUserIdRef.current === authUser.id) {
      devLog("⏭️ Waiting for existing profile load to complete");
      return await loadProfilePromiseRef.current;
    }

    // Don't reload if we already loaded this user's profile
    if (!force && loadedUserIdRef.current === authUser.id && profile) {
      devLog("✅ Profile already loaded, skipping");
      return;
    }

    devLog("📥 Loading profile for:", authUser.id);
    loadedUserIdRef.current = authUser.id;

    // Create and store the loading promise so concurrent calls can await it
    loadProfilePromiseRef.current = (async () => {
      try {
        // First attempt: 15s. Supabase's free tier pauses a project after a
        // period of no API traffic, and the first request after that has to
        // wake the database back up - which routinely takes longer than the
        // old flat 10s timeout allowed, incorrectly bouncing a genuinely
        // approved user to /pending. If the first attempt specifically times
        // out (not a real query error), give it one more, longer try before
        // falling back - a cold-start wake-up is usually done well within 20s
        // more. A real error (bad RLS, bad connection, etc.) will fail the
        // same way both times and still correctly falls through to fail-closed.
        let data, error;
        try {
          ({ data, error } = await fetchProfileOnce(authUser, 15000));
        } catch (firstAttemptErr) {
          if (firstAttemptErr?.message?.includes("timeout")) {
            devLog("First profile fetch timed out - retrying once (possible cold start)");
            ({ data, error } = await fetchProfileOnce(authUser, 20000));
          } else {
            throw firstAttemptErr;
          }
        }

        // ALWAYS create a profile object - NEVER null! This prevents unmount loops
        // in ProtectedRoute/ShellLayout. IMPORTANT: this fallback profile is
        // UNAPPROVED by default. A failed or timed-out fetch must never grant
        // access - it should route the user to /pending instead, the same as
        // a genuinely new, not-yet-approved account. Approval only ever comes
        // from a real row in `profiles` with is_approved = true.
        const minimalProfile = {
          id: authUser.id,
          email: authUser.email || authUser.user_metadata?.email,
          role: authUser.user_metadata?.role || 'educator',
          is_approved: false,
        };

        if (error) {
          console.error("Profile load error:", error.message || error);
          setUser(authUser);
          setProfile(minimalProfile); // Use minimal (unapproved) profile, NOT null
          devLog("⚠️ Using minimal profile (fetch failed) - routing to pending");
        } else {
          setUser(authUser);
          setProfile(data || minimalProfile); // Use real data, or fail-closed fallback
          devLog("✅ Profile loaded successfully");
        }
      } catch (e) {
        console.error("Profile fetch exception:", e?.message || e);
        // ALWAYS create a profile - prevents unmounts. Fails closed (unapproved).
        const minimalProfile = {
          id: authUser.id,
          email: authUser.email || authUser.user_metadata?.email,
          role: 'educator',
          is_approved: false,
        };
        setUser(authUser);
        setProfile(minimalProfile);
        devLog("⚠️ Using minimal profile (exception) - routing to pending");
      } finally {
        loadProfilePromiseRef.current = null;
        setLoading(false);
        devLog("Profile load complete");
      }
    })();

    return await loadProfilePromiseRef.current;
  };

  //
  // ⭐ Listen for auth state changes
  //
  useEffect(() => {
    // Check for initial session on mount
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        devLog("Session check:", { hasSession: !!session, error });

        if (error) {
          console.error("Session restore error:", error.message || error);
          // Only clear if it's a parsing/corruption error, not network errors
          if (error.message?.includes("Invalid") || error.message?.includes("parse")) {
            try {
              localStorage.removeItem('sb-aaiovfryjlcdijdyknik-auth-token');
              localStorage.removeItem('sb-aaiovfryjlcdijdyknik-auth-token-code-verifier');
              devLog("Cleared corrupted session");
            } catch (e) {
              console.error("Failed to clear session:", e?.message || e);
            }
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          devLog("Restoring session for:", session.user.id);
          loadProfile(session.user);
        } else {
          devLog("No session found");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Session fetch exception:", error?.message || error);
        setLoading(false);
      });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      devLog("Auth state change:", event, "hasSession:", !!session);

      if (session?.user) {
        // Valid session, reload profile (loadProfile will skip if already loading/loaded)
        await loadProfile(session.user);
      } else {
        // No session
        devLog("No session in auth state change");

        // If it's a token refresh failure, try to get the session again
        if (event === 'TOKEN_REFRESHED' && !session) {
          devLog("Token refresh returned no session, attempting recovery...");
          try {
            const { data: { session: recoveredSession } } = await supabase.auth.getSession();
            if (recoveredSession?.user) {
              devLog("Recovered session for:", recoveredSession.user.id);
              await loadProfile(recoveredSession.user);
              return;
            }
          } catch (e) {
            console.error("Session recovery failed:", e?.message || e);
          }
        }

        // Only clear state if it's an explicit SIGNED_OUT event
        // Don't clear on TOKEN_REFRESHED failures (user might still be logged in)
        if (event === 'SIGNED_OUT') {
          devLog("User signed out, clearing state");
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  //
  // Force a fresh profile fetch (e.g. after an admin approves you, or you
  // want to double-check status without a full re-login).
  //
  const refreshProfile = async () => {
    if (user) await loadProfile(user, true);
  };

  //
  // Context value
  //
  const value = useMemo(
    () => ({ user, profile, loading, refreshProfile }),
    [user, profile, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
// BUILD-TEST-MARKER-12345
