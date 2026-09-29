// Weekly Gardyn catalog sync, browser edition.
// Run inside a page on https://mygardyn.com (Claude's browser pane) by the
// weekly scheduled task. It scrapes the yCube catalog the same way as
// scripts/gardyn-scrape.mjs and sends it to the Supabase function
// gardyn_catalog_sync (supabase_gardyn_sync_2026-09.sql), which applies
// the update rules and returns a report.
//
// Before running, replace the four placeholders (URL and anon key from the
// repo's .env, the sync key from the scheduled task, dry run true/false).
//
// The browser tool stops a script after ~45 seconds, so this starts the
// sync in the background and returns right away. Poll `window.__gmSync`
// until status is "done" or "error" (usually 30–90 seconds).
window.__gmSync = { status: "running", step: "starting", started: new Date().toISOString() };
(async () => {
  const step = (s) => { window.__gmSync.step = s; };
  const SUPABASE_URL = "__SUPABASE_URL__";
  const ANON_KEY = "__ANON_KEY__";
  const SYNC_KEY = "__SYNC_KEY__";
  const DRY_RUN = __DRY_RUN__;
  const PLANT_TYPES = { Greens: "Greens", Herbs: "Herbs", "Fruits / Veggies": "Fruits & Veggies", Flowers: "Flowers" };
  const SKIP = new Set(["seedless-ycube"]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const get = async (url, json) => {
    for (let i = 1; ; i++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        return json ? r.json() : r.text();
      } catch (e) {
        if (i >= 3) throw new Error(`GET ${url} failed: ${e.message}`);
        await sleep(1500 * i);
      }
    }
  };
  const text = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

  // 1. Product list
  step("product list");
  const products = [];
  for (let page = 1; page <= 5; page++) {
    const j = await get(`/collections/ycubes/products.json?limit=250&page=${page}`, true);
    products.push(...(j.products || []));
    if (!j.products || j.products.length < 250) break;
  }

  // 2. Categories from the store's plant-type filter (product grid only)
  step("categories");
  const categoryOf = {};
  for (const [storeType, ours] of Object.entries(PLANT_TYPES)) {
    let last = 1;
    for (let page = 1; page <= last && page <= 10; page++) {
      const html = await get(`/collections/ycubes?filter.p.m.custom.plant_type=${encodeURIComponent(storeType)}&page=${page}`);
      const s = html.indexOf('data-testid="product-grid"');
      if (s < 0) throw new Error("collection page layout changed: product grid not found");
      const e = html.indexOf("</ul>", s);
      for (const m of html.slice(s, e < 0 ? undefined : e).matchAll(/\/products\/([a-z0-9-]+)/gi)) categoryOf[m[1].toLowerCase()] ??= ours;
      last = Number(html.match(/data-last-page="(\d+)"/)?.[1] || 1);
    }
  }

  // 3. Facts from each product page
  const items = [];
  let noCare = 0;
  const todo = products.filter((p) => !SKIP.has(p.handle) && (!p.product_type || p.product_type === "yCubes"));
  const pages = {};
  for (let i = 0; i < todo.length; i += 6) { // 6 at a time, politely
    step(`product pages ${i}/${todo.length}`);
    await Promise.all(todo.slice(i, i + 6).map(async (p) => { pages[p.handle] = text(await get(`/products/${p.handle}`)); }));
    await sleep(300);
  }
  for (const p of todo) {
    const t = pages[p.handle];
    const grab = (re) => (t.match(re)?.[1] || "").trim() || null;
    const first = grab(/\bFirst Harvest\s+(\d+\s*-\s*\d+\s+Months?|\d+\s+Months?|\d+\s*-\s*\d+\s+Weeks?)/i)?.replace(/\s*-\s*/, "-") || null;
    const hm = first?.match(/^(\d+)(?:-\d+)?\s+(Month|Week)/i);
    const care = grab(/\bCare Level\s+([A-Za-z]+)\s+First Harvest\b/i);
    if (!care) noCare++;
    const member = t.match(/Member price:\s*\$\s?(\d+\.\d{2})/i);
    const price = p.variants?.[0]?.price;
    items.push({
      handle: p.handle,
      name: p.title.trim(),
      category: categoryOf[p.handle] || null,
      price: price ? `$${Number(price).toFixed(2)}` : null,
      member_price: member ? `$${member[1]}` : null,
      perfect_for: grab(/Perfect for\s*(?:\.\.\.|…)\s*(.+?)\s+Yield\b/i),
      yield: grab(/\bYield\s+([A-Za-z]+)\s+Care Level\b/i),
      care_level: care,
      first_harvest: first,
      harvest_days: hm ? Number(hm[1]) * (/week/i.test(hm[2]) ? 7 : 30) : null,
    });
  }
  if (noCare > items.length * 0.25) {
    return { ok: false, error: `${noCare} of ${items.length} product pages had no Care Level; the store layout probably changed. Nothing was saved.` };
  }

  // 4. Save through the locked-down Supabase function
  step("saving");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/gardyn_catalog_sync`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: SYNC_KEY, p_items: items, p_dry_run: DRY_RUN, p_force: false }),
  });
  const body = await r.text();
  if (!r.ok) return { ok: false, scraped: items.length, error: body };
  return { ok: true, scraped: items.length, report: JSON.parse(body) };
})()
  .then((r) => { window.__gmSync = { status: r.ok ? "done" : "error", ...r }; })
  .catch((e) => { window.__gmSync = { status: "error", error: String(e.message || e) }; });
"started";
