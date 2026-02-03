import { createClient } from "@supabase/supabase-js";

// --- Supabase Environment Vars ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

// --- OAuth Redirect URL ---
// GitHub Pages serves your app from this exact URL:
// https://socratic-tech.github.io/GrowingMinds/

export const REDIRECT_URL =
  import.meta.env.VITE_REDIRECT_URL ||
  "https://socratic-tech.github.io/GrowingMinds/";

// --- Create Supabase Client ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
