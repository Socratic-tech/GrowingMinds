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
  // 🚧 DEBUG: Capture OAuth redirect URL before parsing
  //
  useEffect(() => {
    async function handleOAuthCallback() {
      console.log("FULL CALLBACK URL:", window.location.href);
      debugger; // Pause so we can inspect the URL

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        console.log("exchange response", { data, error });
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    }

    handleOAuthCallback();
  }, []);

  //
  // ⭐ Listen for auth state changes
  //
  useEffect(() => {
    const {
      data: { subscription },
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
