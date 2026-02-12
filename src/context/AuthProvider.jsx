import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

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
      console.log("⏭️ Waiting for existing profile load to complete");
      return await loadProfilePromiseRef.current;
    }

    // Don't reload if we already loaded this user's profile
    if (!force && loadedUserIdRef.current === authUser.id && profile) {
      console.log("✅ Profile already loaded, skipping");
      return;
    }

    console.log("📥 Loading profile for:", authUser.email);
    loadedUserIdRef.current = authUser.id;

    // Create and store the loading promise so concurrent calls can await it
    loadProfilePromiseRef.current = (async () => {
      try {
        // Add 10 second timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
        );

        const fetchPromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        // ALWAYS create a profile - NEVER null! This prevents unmount loops
        const minimalProfile = {
          id: authUser.id,
          email: authUser.email || authUser.user_metadata?.email,
          role: authUser.user_metadata?.role || 'educator',
          is_approved: true // For demo - always allow access
        };

        if (error) {
          console.error("Profile load error:", error);
          setUser(authUser);
          setProfile(minimalProfile); // Use minimal profile, NOT null
          console.log("⚠️ Using minimal profile (fetch failed)");
        } else {
          setUser(authUser);
          setProfile(data || minimalProfile); // Use data or fallback to minimal
          console.log("✅ Profile loaded successfully");
        }
      } catch (e) {
        console.error("Profile fetch exception:", e);
        // ALWAYS create a profile - prevents unmounts
        const minimalProfile = {
          id: authUser.id,
          email: authUser.email || authUser.user_metadata?.email,
          role: 'educator',
          is_approved: true
        };
        setUser(authUser);
        setProfile(minimalProfile); // Use minimal profile, NOT null
        console.log("⚠️ Using minimal profile (exception)");
      } finally {
        loadProfilePromiseRef.current = null;
        setLoading(false);
        console.log("Profile load complete");
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
        // Valid session, reload profile (loadProfile will skip if already loading/loaded)
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
