import { supabase } from "../supabase/client";

// Guide progress: saved to learn_progress (supabase_learn_2026-09.sql) so it
// follows the educator across devices and admins can see completion. A
// localStorage copy keeps it working before that table exists.

const KEY = (uid) => `gm-learn-${uid}`;

function readLocal(uid) {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || "{}"); } catch { return {}; }
}
function writeLocal(uid, data) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(data)); } catch { /* private mode */ }
}

/** { [tutorialId]: { step, completed_at } } */
export async function loadProgress(uid) {
  const local = readLocal(uid);
  const { data, error } = await supabase
    .from("learn_progress")
    .select("tutorial_id, step, completed_at")
    .eq("user_id", uid);
  if (error || !data) return local;
  const merged = { ...local };
  for (const r of data) {
    const l = merged[r.tutorial_id];
    merged[r.tutorial_id] = {
      step: Math.max(r.step || 0, l?.step || 0),
      completed_at: r.completed_at || l?.completed_at || null,
    };
  }
  return merged;
}

export async function saveProgress(uid, tutorialId, step, completed) {
  const all = readLocal(uid);
  const prev = all[tutorialId] || {};
  const entry = {
    step: Math.max(step, prev.step || 0),
    completed_at: prev.completed_at || (completed ? new Date().toISOString() : null),
  };
  all[tutorialId] = entry;
  writeLocal(uid, all);
  await supabase
    .from("learn_progress")
    .upsert(
      { user_id: uid, tutorial_id: tutorialId, step: entry.step, completed_at: entry.completed_at, updated_at: new Date().toISOString() },
      { onConflict: "user_id,tutorial_id" }
    )
    .then(() => {}, () => {});
}
