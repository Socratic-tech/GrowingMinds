import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Detect local vs production redirect using env var or fallback to auto-detect
export const REDIRECT_URL =
  import.meta.env.VITE_REDIRECT_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? `${window.location.origin}`
    : `${window.location.origin}${window.location.pathname.split('/').slice(0, 2).join('/')}`);
