import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    setUser(authUser);
    setProfile(data || null);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await supabase.auth.getSessionFromUrl({ storeSession: true });
      } catch {}

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) await loadProfile(session.user);
      else setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) loadProfile(session.user);
        else {
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
