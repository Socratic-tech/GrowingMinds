import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

// Beta features (supabase_photo_journal_2026-10.sql). Admins turn them on
// per educator in Admin → Educators. Until the table exists, or for anyone
// not in it, every beta feature is simply off.

const cache = new Map(); // user id -> Promise<string[]>

export function loadBetaFeatures(userId, { fresh = false } = {}) {
  if (!userId) return Promise.resolve([]);
  if (fresh || !cache.has(userId)) {
    cache.set(userId, supabase
      .from("beta_testers")
      .select("features")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => (error || !data ? [] : data.features || []), () => []));
  }
  return cache.get(userId);
}

/** true when this user has the given beta feature. */
export function useBeta(userId, feature) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let off = false;
    loadBetaFeatures(userId).then((f) => { if (!off) setOn(f.includes(feature)); });
    return () => { off = true; };
  }, [userId, feature]);
  return on;
}

export const BETA_FEATURES = {
  photo_journal: { label: "Photo journal", icon: "📷" },
  student_station: { label: "Student data station", icon: "🔬" },
};
