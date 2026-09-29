// Scrape the Gardyn yCube catalog from mygardyn.com (a Shopify store).
// Pure parsing helpers + one fetch function; used by sync-gardyn-plants.mjs.
//
//  - Product list, prices:  /collections/ycubes/products.json
//  - Category (plant type): the collection page filtered by
//      filter.p.m.custom.plant_type=Greens | Herbs | Fruits / Veggies | Flowers
//  - Perfect for / Yield / Care Level / First Harvest / member price:
//      the text of each product page.

export const STORE = "https://mygardyn.com";
const SKIP_HANDLES = new Set(["seedless-ycube"]); // filler pod, not a plant
const PLANT_TYPES = { Greens: "Greens", Herbs: "Herbs", "Fruits / Veggies": "Fruits & Veggies", Flowers: "Flowers" };

export function pageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/** Facts from a product page's text. Missing facts come back null. */
export function parseProductPage(html) {
  const t = pageText(html);
  const grab = (re) => (t.match(re)?.[1] || "").trim() || null;
  const facts = {
    perfect_for: grab(/Perfect for\s*(?:\.\.\.|…)\s*(.+?)\s+Yield\b/i),
    yield: grab(/\bYield\s+([A-Za-z]+)\s+Care Level\b/i),
    care_level: grab(/\bCare Level\s+([A-Za-z]+)\s+First Harvest\b/i),
    first_harvest: grab(/\bFirst Harvest\s+(\d+\s*-\s*\d+\s+Months?|\d+\s+Months?|\d+\s*-\s*\d+\s+Weeks?)/i),
  };
  const member = t.match(/Member price:\s*\$\s?(\d+\.\d{2})/i);
  facts.member_price = member ? `$${member[1]}` : null;
  if (facts.first_harvest) facts.first_harvest = facts.first_harvest.replace(/\s*-\s*/, "-").replace(/month$/i, "Month").replace(/months$/i, "Months");
  return facts;
}

/** "2-3 Months" -> 60 (the low end, in days). */
export function harvestDays(firstHarvest) {
  const m = String(firstHarvest || "").match(/^(\d+)(?:-\d+)?\s+(Month|Week)/i);
  if (!m) return null;
  return Number(m[1]) * (/week/i.test(m[2]) ? 7 : 30);
}

/**
 * Product handles in a collection page's product grid (not the
 * recommendation widgets elsewhere on the page), plus its page count.
 */
export function parseCollectionPage(html) {
  const start = html.indexOf('data-testid="product-grid"');
  if (start < 0) throw new Error("collection page layout changed: product grid not found");
  const end = html.indexOf("</ul>", start);
  const handles = new Set();
  for (const m of html.slice(start, end < 0 ? undefined : end).matchAll(/\/products\/([a-z0-9-]+)/gi)) handles.add(m[1].toLowerCase());
  const lastPage = Number(html.match(/data-last-page="(\d+)"/)?.[1] || 1);
  return { handles, lastPage };
}

async function get(url, as = "text", tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "GrowingMinds-catalog-sync (REMC education; weekly)", Accept: as === "json" ? "application/json" : "text/html" } });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return as === "json" ? await r.json() : await r.text();
    } catch (e) {
      if (i >= tries) throw new Error(`GET ${url} failed: ${e.message}`);
      await new Promise((res) => setTimeout(res, 1500 * i));
    }
  }
}

/** Full catalog: [{ handle, name, category, price, member_price, perfect_for, yield, care_level, first_harvest, harvest_days }] */
export async function scrapeCatalog({ log = () => {} } = {}) {
  const products = [];
  for (let page = 1; page <= 5; page++) {
    const j = await get(`${STORE}/collections/ycubes/products.json?limit=250&page=${page}`, "json");
    products.push(...(j.products || []));
    if (!j.products || j.products.length < 250) break;
  }
  log(`products.json: ${products.length} products`);

  const categoryOf = {};
  for (const [storeType, ours] of Object.entries(PLANT_TYPES)) {
    let lastPage = 1, count = 0;
    for (let page = 1; page <= lastPage && page <= 10; page++) {
      const url = `${STORE}/collections/ycubes?filter.p.m.custom.plant_type=${encodeURIComponent(storeType)}&page=${page}`;
      const res = parseCollectionPage(await get(url));
      lastPage = res.lastPage;
      for (const h of res.handles) { categoryOf[h] ??= ours; count++; }
    }
    log(`${ours}: ${count} products`);
  }

  const catalog = [];
  for (const p of products) {
    if (SKIP_HANDLES.has(p.handle) || (p.product_type && p.product_type !== "yCubes")) continue;
    const facts = parseProductPage(await get(`${STORE}/products/${p.handle}`));
    const price = p.variants?.[0]?.price;
    catalog.push({
      handle: p.handle,
      name: p.title.trim(),
      category: categoryOf[p.handle] || null,
      price: price ? `$${Number(price).toFixed(2)}` : null,
      ...facts,
      harvest_days: harvestDays(facts.first_harvest),
    });
    await new Promise((res) => setTimeout(res, 300)); // be polite
  }
  return catalog;
}
