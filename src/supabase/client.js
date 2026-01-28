import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://aaiovfryjlcdijdyknik.supabase.co",
  "sb_publishable_cFHXexx3iNPEOWSFZ0IAxQ_h6MuktWT"
);

// Detect local vs production redirect
export const REDIRECT_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5173"
    : "https://socratic-tech.github.io/GrowingMinds";
