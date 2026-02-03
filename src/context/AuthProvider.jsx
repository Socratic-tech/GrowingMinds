import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Supabase
  const loadProfile = async (authUser) => {
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

  useEffect(() => {
    const init = async () => {
      // ⭐ VERY IMPORTANT:
      // Process Supabase OAuth callback BEFORE React Router rewrites the URL.
      try {
        const { data: urlData, error: urlError } =
          await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (urlError) console.warn("OAuth URL processing error:", urlError);
      } catch (err) {
        console.warn("OAuth callback read failed:", err);
      }

      // Now safely load session
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    init();

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
