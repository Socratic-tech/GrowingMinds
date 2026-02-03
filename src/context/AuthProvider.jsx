import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile for a given auth user
  const loadProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Profile load error:", error);
      }

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
      // ⭐ SUPABASE v2 OAUTH CALLBACK HANDLING
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) console.warn("OAuth exchange error:", error);
      } catch (e) {
        console.warn("OAuth processing failed:", e);
      }

      // ⭐ Now load the stored session
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

    // ⭐ React to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

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
