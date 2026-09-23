-- Gardyn Studio: 16 slots (A1–A8, B1–B8) instead of 30 (A–C × 1–10).
-- The app already ignores the extra slots. This removes the leftover
-- EMPTY rows so the table stays clean. Anything a teacher actually filled
-- in is kept and listed for review first.

-- STEP 1 (read-only): leftover slots that have real data in them.
-- Review these before running STEP 2; they'll be kept either way.
SELECT p.email, t.slot_id, t.plant_name, t.status, t.date_planted, t.observation_notes
FROM tracker_slots t
JOIN profiles p ON p.id = t.user_id
WHERE t.slot_id NOT IN ('A1','A2','A3','A4','A5','A6','A7','A8',
                        'B1','B2','B3','B4','B5','B6','B7','B8')
  AND (t.plant_name IS NOT NULL OR t.date_planted IS NOT NULL
       OR coalesce(trim(t.observation_notes),'') <> '')
ORDER BY p.email, t.slot_id;

-- STEP 2: delete the leftover EMPTY rows only.
DELETE FROM tracker_slots
WHERE slot_id NOT IN ('A1','A2','A3','A4','A5','A6','A7','A8',
                      'B1','B2','B3','B4','B5','B6','B7','B8')
  AND plant_name IS NULL
  AND date_planted IS NULL
  AND coalesce(trim(observation_notes),'') = '';
