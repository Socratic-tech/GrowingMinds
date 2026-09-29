#!/usr/bin/env node
// Weekly sync: Gardyn yCube catalog (mygardyn.com) -> Supabase `plants`.
// Runs from .github/workflows/sync-gardyn-plants.yml. Same rules as
// supabase_plants_gardyn_2026-09.sql:
//
//   * Matched plants: store facts are updated (category, price, member
//     price, perfect for, yield, care level, first harvest, handle).
//     harvest_days is only filled in when it's blank.
//   * The team's own fields are NEVER touched: light_zone,
//     germination_days, thin_to, teacher_note, lesson_hook, best_use.
//   * New yCubes are added (light zone / germination left for the team).
//   * Plants no longer sold are kept (Tracker slots use them) and marked
//     in_gardyn_store = false.
//   * A fact the store leaves blank never erases what we already have.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. DRY_RUN=1 reports only.
// FORCE=1 skips the "too many changes at once" safety stop.

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { scrapeCatalog } from "./gardyn-scrape.mjs";

const DRY = process.env.DRY_RUN === "1";
const FORCE = process.env.FORCE === "1";
const URL_ = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STORE_FIELDS = ["category", "price", "member_price", "perfect_for", "yield", "care_level", "first_harvest", "gardyn_handle"];
const today = new Date().toISOString().slice(0, 10);

const aliases = JSON.parse(readFileSync(new URL("./gardyn-aliases.json", import.meta.url), "utf8"));
const key = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "").replace(/s$/, "");

const lines = [];
const say = (s = "") => { lines.push(s); console.log(s); };
let hasChanges = false;
function summary() {
  const md = lines.join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  writeFileSync("sync-report.md", md);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${hasChanges && !DRY}\n`);
}
function fail(msg) { say(`\n**Stopped:** ${msg}`); summary(); process.exit(1); }

async function db(path, { method = "GET", body } = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json",
      Prefer: method === "GET" ? "" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
  return method === "GET" ? r.json() : null;
}

async function main() {
  if (!URL_ || !KEY) fail("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (repo secrets).");
  say(`## Gardyn catalog sync · ${today}${DRY ? " · DRY RUN (nothing saved)" : ""}\n`);

  const catalog = await scrapeCatalog({ log: (s) => console.log("  " + s) });
  say(`Store: **${catalog.length}** yCubes on mygardyn.com.`);

  // Safety: if the store's page layout changes, stop rather than write junk.
  if (catalog.length < 50) fail(`only ${catalog.length} yCubes found; the store may be down or changed.`);
  const noCare = catalog.filter((c) => !c.care_level).length;
  if (noCare > catalog.length * 0.25) fail(`${noCare} of ${catalog.length} product pages had no Care Level; the page layout probably changed. Nothing was saved.`);

  const rows = await db("plants?select=id,name,harvest_days,in_gardyn_store," + STORE_FIELDS.join(","));
  say(`Growing Minds: **${rows.length}** plants in the database.\n`);

  // Match store products to rows: by saved handle, then by name / alias.
  const byHandle = new Map(rows.filter((r) => r.gardyn_handle).map((r) => [r.gardyn_handle, r]));
  const byKey = new Map(rows.map((r) => [key(r.name), r]));
  const matched = new Set();
  const updates = [], inserts = [];

  for (const c of catalog) {
    const keys = [key(c.name), key(c.handle), ...(aliases[c.handle]?.keys || [])];
    let row = byHandle.get(c.handle);
    if (!row) for (const k of keys) { const r = byKey.get(k); if (r && !matched.has(r.id)) { row = r; break; } }
    const store = { ...c, gardyn_handle: c.handle };

    if (row) {
      matched.add(row.id);
      const patch = {};
      for (const f of STORE_FIELDS) if (store[f] != null && store[f] !== row[f]) patch[f] = store[f];
      if (row.harvest_days == null && c.harvest_days != null) patch.harvest_days = c.harvest_days;
      const changed = Object.keys(patch);
      if (row.in_gardyn_store !== true) patch.in_gardyn_store = true;
      patch.gardyn_checked_at = today;
      updates.push({ row, patch, changed, back: row.in_gardyn_store === false });
    } else {
      const ins = { name: c.name, in_gardyn_store: true, gardyn_checked_at: today, harvest_days: c.harvest_days };
      for (const f of STORE_FIELDS) if (store[f] != null) ins[f] = store[f];
      inserts.push(ins);
    }
  }
  const gone = rows.filter((r) => !matched.has(r.id) && r.in_gardyn_store !== false);

  if (!FORCE && gone.length > 15) fail(`${gone.length} plants would be marked "no longer sold" at once. If that's real, re-run the workflow with force.`);

  // Report
  const edits = updates.filter((u) => u.changed.length);
  say(`### New in the store (${inserts.length})`);
  inserts.forEach((i) => say(`- ${i.name} (${i.category || "category unknown"}${i.care_level ? `, ${i.care_level}` : ""}) — needs a light zone and germination days in Admin → Plants`));
  say(`\n### No longer sold (${gone.length})`);
  gone.forEach((g) => say(`- ${g.name} — kept for Tracker history, marked not in store`));
  say(`\n### Updated facts (${edits.length})`);
  edits.forEach((u) => say(`- ${u.row.name}: ${u.changed.map((f) => `${f} ${u.row[f] ?? "—"} → ${u.patch[f]}`).join("; ")}`));
  const back = updates.filter((u) => u.back);
  if (back.length) { say(`\n### Back in the store (${back.length})`); back.forEach((u) => say(`- ${u.row.name}`)); }
  hasChanges = Boolean(inserts.length || gone.length || edits.length || back.length);
  if (!hasChanges) say("\nNo changes this week. ✅");

  if (DRY) { say("\n_Dry run: nothing was saved._"); summary(); return; }

  for (const u of updates) await db(`plants?id=eq.${u.row.id}`, { method: "PATCH", body: u.patch });
  if (inserts.length) await db("plants", { method: "POST", body: inserts });
  for (const g of gone) await db(`plants?id=eq.${g.id}`, { method: "PATCH", body: { in_gardyn_store: false, gardyn_checked_at: today } });
  say("\nSaved to Supabase.");
  summary();
}

main().catch((e) => fail(e.message));
