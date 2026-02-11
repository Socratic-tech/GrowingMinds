import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile for a given auth user
  const loadProfile = async (authUser, force = false) => {
    // Don't reload if it's the same user and we already have their profile
    if (!force && user?.id === authUser.id && profile) {
      console.log("Skipping profile reload - already loaded for this user");
      return;
    }

    console.log("Loading profile for:", authUser.email);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) console.error("Profile load error:", error);

      setUser(authUser);
      setProfile(data || null);
    } catch (e) {
      console.error("Profile fetch exception:", e);
    } finally {
      setLoading(false);
    }
  };

  //
  // ⭐ Listen for auth state changes
  //
  useEffect(() => {
    // Check for initial session on mount
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log("Session check:", { hasSession: !!session, error });

        if (error) {
          console.error("Session restore error:", error);
          // Only clear if it's a parsing/corruption error, not network errors
          if (error.message?.includes("Invalid") || error.message?.includes("parse")) {
            try {
              localStorage.removeItem('sb-aaiovfryjlcdijdyknik-auth-token');
              localStorage.removeItem('sb-aaiovfryjlcdijdyknik-auth-token-code-verifier');
              console.log("Cleared corrupted session");
            } catch (e) {
              console.error("Failed to clear session:", e);
            }
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Restoring session for:", session.user.email);
          loadProfile(session.user);
        } else {
          console.log("No session found");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Session fetch exception:", error);
        setLoading(false);
      });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, "hasSession:", !!session, "user:", session?.user?.email);

      if (session?.user) {
        // Valid session, reload profile
        await loadProfile(session.user);
      } else {
        // No session
        console.log("No session in auth state change");

        // If it's a token refresh failure, try to get the session again
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log("Token refresh returned no session, attempting recovery...");
          try {
            const { data: { session: recoveredSession } } = await supabase.auth.getSession();
            if (recoveredSession?.user) {
              console.log("Recovered session for:", recoveredSession.user.email);
              await loadProfile(recoveredSession.user);
              return;
            }
          } catch (e) {
            console.error("Session recovery failed:", e);
          }
        }

        // Only clear state if it's an explicit SIGNED_OUT event
        // Don't clear on TOKEN_REFRESHED failures (user might still be logged in)
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing state");
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  //
  // Context value
  //
  const value = useMemo(
    () => ({ user, profile, loading }),
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
