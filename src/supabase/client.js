import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://aaiovfryjlcdijdyknik.supabase.co",
  "sb_publishable_cFHXexx3iNPEOWSFZ0IAxQ_h6MuktWT"
);

export const REDIRECT_URL = "https://socratic-tech.github.io/GrowingMinds";
