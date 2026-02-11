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

// --- Safe Storage Wrapper (prevents corruption) ---
const safeStorage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      // Validate that the item is valid JSON before returning
      if (item && key.includes('auth-token')) {
        JSON.parse(item); // Will throw if corrupted
      }
      return item;
    } catch (error) {
      console.error(`Storage read error for ${key}:`, error.message);
      // Clear corrupted item
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Storage write error for ${key}:`, error.message);
      // If storage is full or quota exceeded, try to make room
      if (error.name === 'QuotaExceededError') {
        console.warn("Storage quota exceeded, attempting to clear old data");
        try {
          // Keep only auth tokens, clear everything else
          const authToken = localStorage.getItem('sb-aaiovfryjlcdijdyknik-auth-token');
          const authVerifier = localStorage.getItem('sb-aaiovfryjlcdijdyknik-auth-token-code-verifier');
          localStorage.clear();
          if (authToken) localStorage.setItem('sb-aaiovfryjlcdijdyknik-auth-token', authToken);
          if (authVerifier) localStorage.setItem('sb-aaiovfryjlcdijdyknik-auth-token-code-verifier', authVerifier);
          // Retry the original write
          localStorage.setItem(key, value);
        } catch (e) {
          console.error("Failed to recover from quota error:", e);
        }
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error.message);
    }
  },
};

// --- Create Supabase Client (NO OAUTH HANDLING) ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,    // Required for magic link to work
    persistSession: true,
    autoRefreshToken: true,
    redirectTo: REDIRECT_URL,    // Used ONLY for magic link & reset flows
    storage: safeStorage,         // Use safe storage wrapper
  },
});
