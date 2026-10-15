import { supabase } from "../supabase/client";
import { parseLocalDate, daysBetween, todayLocal } from "./date";

// Photo journal (beta): weekly photos of each Tracker slot.
// Files: private bucket "slot-photos" at <user id>/<slot>/<date>-<rand>.jpg
// Rows:  slot_photos (supabase_photo_journal_2026-10.sql)

export const BUCKET = "slot-photos";
// Storage guardrails: full photos ~180 KB (plenty for a timelapse), plus
// a ~15 KB thumbnail for grids, so pages load thumbnails, not full photos.
const MAX_DIM = 1024;
const TARGET_BYTES = 180 * 1024;
const THUMB_DIM = 320;

async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
      img.onerror = () => reject(new Error("That file isn't a photo we can read."));
      img.src = URL.createObjectURL(file);
    });
  }
}

async function toJpeg(src, maxDim, targetBytes, qualities) {
  const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
  const w = Math.round(src.width * scale), h = Math.round(src.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(src, 0, 0, w, h);
  let blob = null;
  for (const q of qualities) {
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= targetBytes) break;
  }
  if (!blob) throw new Error("Couldn't process that photo.");
  return blob;
}

/** { full, thumb } JPEG blobs from any phone photo. */
export async function compressPhoto(file) {
  const src = await loadImage(file);
  return {
    full: await toJpeg(src, MAX_DIM, TARGET_BYTES, [0.8, 0.7, 0.6, 0.5, 0.4]),
    thumb: await toJpeg(src, THUMB_DIM, 20 * 1024, [0.7, 0.55, 0.4]),
  };
}

/** Upload one photo for a slot; returns the new slot_photos row. */
export async function addSlotPhoto({ userId, slotId, plantName, datePlanted, file, caption, takenOn = todayLocal() }) {
  const { full, thumb } = await compressPhoto(file);
  const rand = Math.random().toString(36).slice(2, 8);
  const base = `${userId}/${slotId}/${takenOn}-${Date.now()}-${rand}`;
  const path = `${base}.jpg`, thumbPath = `${base}-t.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, full, { contentType: "image/jpeg", upsert: false });
  if (up.error) throw up.error;
  const upThumb = await supabase.storage.from(BUCKET).upload(thumbPath, thumb, { contentType: "image/jpeg", upsert: false });
  const { data, error } = await supabase.from("slot_photos").insert({
    user_id: userId, slot_id: slotId, plant_name: plantName || null, date_planted: datePlanted || null,
    taken_on: takenOn, storage_path: path, thumb_path: upThumb.error ? null : thumbPath, caption: caption?.trim() || null,
  }).select().single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path, thumbPath]); // don't leave orphan files
    throw new Error(error.message?.includes("Photo limit") ? error.message : error.message || "Couldn't save the photo.");
  }
  return data;
}

export async function listSlotPhotos(userId, slotId) {
  let q = supabase.from("slot_photos").select("*").eq("user_id", userId).order("taken_on").order("created_at");
  if (slotId) q = q.eq("slot_id", slotId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** { path: signedUrl } for private photos (valid 1 hour). */
export async function signedUrls(paths) {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) throw error;
  return Object.fromEntries((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}

export async function deleteSlotPhoto(row) {
  const { error } = await supabase.from("slot_photos").delete().eq("id", row.id);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([row.storage_path, row.thumb_path].filter(Boolean));
}

/** Day number since planting ("Day 1" = planting day), or null. */
export function plantDay(row) {
  const a = parseLocalDate(row.date_planted), b = parseLocalDate(row.taken_on);
  return a && b ? daysBetween(a, b) + 1 : null;
}

/** Group photos into plantings (plant + planting date), newest planting first. */
export function groupPlantings(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = `${r.plant_name || ""}|${r.date_planted || ""}`;
    if (!m.has(k)) m.set(k, { key: k, plant_name: r.plant_name, date_planted: r.date_planted, photos: [] });
    m.get(k).photos.push(r);
  }
  return [...m.values()].sort((a, b) =>
    String(b.photos.at(-1)?.taken_on).localeCompare(String(a.photos.at(-1)?.taken_on)));
}

/** Thumbnail path if there is one (older photos have none). */
export const thumbOf = (row) => row.thumb_path || row.storage_path;

export const plantingKey = (plantName, datePlanted) => `${plantName || ""}|${datePlanted || ""}`;
