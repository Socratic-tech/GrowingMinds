import { createClient } from "@supabase/supabase-js";

// --- Supabase Environment Vars ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

// --- Redirect URL for magic link + password recovery ONLY ---
// NO OAuth. This takes users directly back to your Auth screen.
export const REDIRECT_URL =
  "https://socratic-tech.github.io/GrowingMinds/#/auth";

// --- Create Supabase Client (NO OAUTH HANDLING) ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,   // MUST be false for HashRouter MVP
    persistSession: true,
    autoRefreshToken: true,
    redirectTo: REDIRECT_URL,    // Used ONLY for magic link & reset flows
  },
});
