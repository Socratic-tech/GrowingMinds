// Nutrition facts for Plant Library cards.
//
// Source: USDA FoodData Central, SR Legacy (April 2018), raw/fresh foods.
// Values are per 100 g of the edible part. Each plant maps to the closest
// USDA food; `approx` explains when that's a close relative rather than the
// exact variety (USDA doesn't list tatsoi, holy basil, and so on).
//
// Units: kcal; protein/carbs/fiber/sugars in g; vitC, calcium, iron,
// potassium, magnesium in mg; vitA (RAE), vitK, folate (DFE) in mcg.

export const USDA_FOODS = {
  167762: { usda: "Strawberries, raw", per100g: { protein: 0.67, carbs: 7.68, kcal: 32, sugars: 4.89, fiber: 2, calcium: 16, iron: 0.41, magnesium: 13, potassium: 153, vitA: 1, vitC: 58.8, vitK: 2.2, folate: 24 } },
  168385: { usda: "Amaranth leaves, raw", per100g: { protein: 2.46, carbs: 4.02, kcal: 23, calcium: 215, iron: 2.32, magnesium: 55, potassium: 611, vitA: 146, vitC: 43.3, vitK: 1140, folate: 85 } },
  168409: { usda: "Cucumber, with peel, raw", per100g: { protein: 0.65, carbs: 3.63, kcal: 15, sugars: 1.67, fiber: 0.5, calcium: 16, iron: 0.28, magnesium: 13, potassium: 147, vitA: 5, vitC: 2.8, vitK: 16.4, folate: 7 } },
  168412: { usda: "Endive, raw", per100g: { protein: 1.25, carbs: 3.35, kcal: 17, sugars: 0.25, fiber: 3.1, calcium: 52, iron: 0.83, magnesium: 15, potassium: 314, vitA: 108, vitC: 6.5, vitK: 231, folate: 142 } },
  168421: { usda: "Kale, raw", per100g: { protein: 2.92, carbs: 4.42, kcal: 35, sugars: 0.99, fiber: 4.1, calcium: 254, iron: 1.6, magnesium: 33, potassium: 348, vitA: 241, vitC: 93.4, vitK: 390, folate: 62 } },
  168424: { usda: "Kohlrabi, raw", per100g: { protein: 1.7, carbs: 6.2, kcal: 27, sugars: 2.6, fiber: 3.6, calcium: 24, iron: 0.4, magnesium: 19, potassium: 350, vitA: 2, vitC: 62, vitK: 0.1, folate: 16 } },
  168429: { usda: "Lettuce, butterhead (includes boston and bibb types), raw", per100g: { protein: 1.35, carbs: 2.23, kcal: 13, sugars: 0.94, fiber: 1.1, calcium: 35, iron: 1.24, magnesium: 13, potassium: 238, vitA: 166, vitC: 3.7, vitK: 102, folate: 73 } },
  168431: { usda: "Lettuce, red leaf, raw", per100g: { protein: 1.33, carbs: 2.26, kcal: 13, sugars: 0.48, fiber: 0.9, calcium: 33, iron: 1.2, magnesium: 12, potassium: 187, vitA: 375, vitC: 3.7, vitK: 140, folate: 36 } },
  168576: { usda: "Peppers, jalapeno, raw", per100g: { protein: 0.91, carbs: 6.5, kcal: 29, sugars: 4.12, fiber: 2.8, calcium: 12, iron: 0.25, magnesium: 15, potassium: 248, vitA: 54, vitC: 119, vitK: 18.5, folate: 27 } },
  169228: { usda: "Eggplant, raw", per100g: { protein: 0.98, carbs: 5.88, kcal: 25, sugars: 3.53, fiber: 3, calcium: 9, iron: 0.23, magnesium: 14, potassium: 229, vitA: 1, vitC: 2.2, vitK: 3.5, folate: 22 } },
  169247: { usda: "Lettuce, cos or romaine, raw", per100g: { protein: 1.23, carbs: 3.29, kcal: 17, sugars: 1.19, fiber: 2.1, calcium: 33, iron: 0.97, magnesium: 14, potassium: 247, vitA: 436, vitC: 4, vitK: 102, folate: 136 } },
  169248: { usda: "Lettuce, iceberg (includes crisphead types), raw", per100g: { protein: 0.9, carbs: 2.97, kcal: 14, sugars: 1.97, fiber: 1.2, calcium: 18, iron: 0.41, magnesium: 7, potassium: 141, vitA: 25, vitC: 2.8, vitK: 24.1, folate: 29 } },
  169249: { usda: "Lettuce, green leaf, raw", per100g: { protein: 1.36, carbs: 2.87, kcal: 15, sugars: 0.78, fiber: 1.3, calcium: 36, iron: 0.86, magnesium: 13, potassium: 194, vitA: 370, vitC: 9.2, vitK: 126, folate: 38 } },
  169256: { usda: "Mustard greens, raw", per100g: { protein: 2.86, carbs: 4.67, kcal: 27, sugars: 1.32, fiber: 3.2, calcium: 115, iron: 1.64, magnesium: 32, potassium: 384, vitA: 151, vitC: 70, vitK: 258, folate: 12 } },
  169320: { usda: "Beans, snap, yellow, raw", per100g: { protein: 1.82, carbs: 7.13, kcal: 31, sugars: 3.27, fiber: 3.4, calcium: 37, iron: 1.04, magnesium: 25, potassium: 209, vitC: 16.3, vitK: 43.2, folate: 37 } },
  169387: { usda: "Arugula, raw", per100g: { protein: 2.58, carbs: 3.65, kcal: 25, sugars: 2.05, fiber: 1.6, calcium: 160, iron: 1.46, magnesium: 47, potassium: 369, vitA: 119, vitC: 15, vitK: 109, folate: 97 } },
  169394: { usda: "Pepper, banana, raw", per100g: { protein: 1.66, carbs: 5.35, kcal: 27, sugars: 1.95, fiber: 3.4, calcium: 14, iron: 0.46, magnesium: 17, potassium: 256, vitA: 17, vitC: 82.7, vitK: 9.5, folate: 29 } },
  169961: { usda: "Beans, snap, green, raw", per100g: { protein: 1.83, carbs: 6.97, kcal: 31, sugars: 3.26, fiber: 2.7, calcium: 37, iron: 1.03, magnesium: 25, potassium: 211, vitA: 35, vitC: 12.2, vitK: 43, folate: 33 } },
  169975: { usda: "Cabbage, raw", per100g: { protein: 1.28, carbs: 5.8, kcal: 25, sugars: 3.2, fiber: 2.5, calcium: 40, iron: 0.47, magnesium: 12, potassium: 170, vitA: 5, vitC: 36.6, vitK: 76, folate: 43 } },
  169979: { usda: "Cabbage, chinese (pe-tsai), raw", per100g: { protein: 1.2, carbs: 3.23, kcal: 16, sugars: 1.41, fiber: 1.2, calcium: 77, iron: 0.31, magnesium: 13, potassium: 238, vitA: 16, vitC: 27, vitK: 42.9, folate: 79 } },
  169986: { usda: "Cauliflower, raw", per100g: { protein: 1.92, carbs: 4.97, kcal: 25, sugars: 1.91, fiber: 2, calcium: 22, iron: 0.42, magnesium: 15, potassium: 299, vitA: 0, vitC: 48.2, vitK: 15.5, folate: 57 } },
  169988: { usda: "Celery, raw", per100g: { protein: 0.69, carbs: 2.97, kcal: 14, sugars: 1.34, fiber: 1.6, calcium: 40, iron: 0.2, magnesium: 11, potassium: 260, vitA: 22, vitC: 3.1, vitK: 29.3, folate: 36 } },
  169991: { usda: "Chard, swiss, raw", per100g: { protein: 1.8, carbs: 3.74, kcal: 19, sugars: 1.1, fiber: 1.6, calcium: 51, iron: 1.8, magnesium: 81, potassium: 379, vitA: 306, vitC: 30, vitK: 830, folate: 14 } },
  169994: { usda: "Chives, raw", per100g: { protein: 3.27, carbs: 4.35, kcal: 30, sugars: 1.85, fiber: 2.5, calcium: 92, iron: 1.6, magnesium: 42, potassium: 296, vitA: 218, vitC: 58.1, vitK: 213, folate: 105 } },
  169997: { usda: "Coriander (cilantro) leaves, raw", per100g: { protein: 2.13, carbs: 3.67, kcal: 23, sugars: 0.87, fiber: 2.8, calcium: 67, iron: 1.77, magnesium: 26, potassium: 521, vitA: 337, vitC: 27, vitK: 310, folate: 62 } },
  170005: { usda: "Onions, spring or scallions (includes tops and bulb), raw", per100g: { protein: 1.83, carbs: 7.34, kcal: 32, sugars: 2.33, fiber: 2.6, calcium: 72, iron: 1.48, magnesium: 20, potassium: 276, vitA: 50, vitC: 18.8, vitK: 207, folate: 64 } },
  170068: { usda: "Watercress, raw", per100g: { protein: 2.3, carbs: 1.29, kcal: 11, sugars: 0.2, fiber: 0.5, calcium: 120, iron: 0.2, magnesium: 21, potassium: 330, vitA: 160, vitC: 43, vitK: 250, folate: 9 } },
  170076: { usda: "Dock, raw", per100g: { protein: 2, carbs: 3.2, kcal: 22, fiber: 2.9, calcium: 44, iron: 2.4, magnesium: 103, potassium: 390, vitA: 200, vitC: 48, folate: 13 } },
  170106: { usda: "Peppers, hot chili, red, raw", per100g: { protein: 1.87, carbs: 8.81, kcal: 40, sugars: 5.3, fiber: 1.5, calcium: 14, iron: 1.03, magnesium: 23, potassium: 322, vitA: 48, vitC: 144, vitK: 14, folate: 23 } },
  170108: { usda: "Peppers, sweet, red, raw", per100g: { protein: 0.99, carbs: 6.03, kcal: 26, sugars: 4.2, fiber: 2.1, calcium: 7, iron: 0.43, magnesium: 12, potassium: 211, vitA: 157, vitC: 128, vitK: 4.9, folate: 46 } },
  170390: { usda: "Cabbage, chinese (pak-choi), raw", per100g: { protein: 1.5, carbs: 2.18, kcal: 13, sugars: 1.18, fiber: 1, calcium: 105, iron: 0.8, magnesium: 19, potassium: 252, vitA: 223, vitC: 45, vitK: 45.5, folate: 66 } },
  170416: { usda: "Parsley, fresh", per100g: { protein: 2.97, carbs: 6.33, kcal: 36, sugars: 0.85, fiber: 3.3, calcium: 138, iron: 6.2, magnesium: 50, potassium: 554, vitA: 421, vitC: 133, vitK: 1640, folate: 152 } },
  170419: { usda: "Peas, green, raw", per100g: { protein: 5.42, carbs: 14.4, kcal: 81, sugars: 5.67, fiber: 5.7, calcium: 25, iron: 1.47, magnesium: 33, potassium: 244, vitA: 38, vitC: 40, vitK: 24.8, folate: 65 } },
  170457: { usda: "Tomatoes, red, ripe, raw, year round average", per100g: { protein: 0.88, carbs: 3.89, kcal: 18, sugars: 2.63, fiber: 1.2, calcium: 10, iron: 0.27, magnesium: 11, potassium: 237, vitA: 42, vitC: 13.7, vitK: 7.9, folate: 15 } },
  172232: { usda: "Basil, fresh", per100g: { protein: 3.15, carbs: 2.65, kcal: 23, sugars: 0.3, fiber: 1.6, calcium: 177, iron: 3.17, magnesium: 64, potassium: 295, vitA: 264, vitC: 18, vitK: 415, folate: 68 } },
  172233: { usda: "Dill weed, fresh", per100g: { protein: 3.46, carbs: 7.02, kcal: 43, fiber: 2.1, calcium: 208, iron: 6.59, magnesium: 55, potassium: 738, vitA: 386, vitC: 85, folate: 150 } },
  173470: { usda: "Thyme, fresh", per100g: { protein: 5.56, carbs: 24.4, kcal: 101, fiber: 14, calcium: 405, iron: 17.4, magnesium: 160, potassium: 609, vitA: 238, vitC: 160, folate: 45 } },
  173473: { usda: "Rosemary, fresh", per100g: { protein: 3.31, carbs: 20.7, kcal: 131, fiber: 14.1, calcium: 317, iron: 6.65, magnesium: 91, potassium: 668, vitA: 146, vitC: 21.8, folate: 109 } },
  173475: { usda: "Spearmint, fresh", per100g: { protein: 3.29, carbs: 8.41, kcal: 44, fiber: 6.8, calcium: 199, iron: 11.9, magnesium: 63, potassium: 458, vitA: 203, vitC: 13.3, folate: 105 } },
};

// Typical servings, from USDA's own portion weights for each food.
const S = {
  cup_romaine: ["1 cup, shredded", 47],
  cup_butter: ["1 cup, shredded", 55],
  cup_green: ["1 cup, shredded", 36],
  cup_iceberg: ["1 cup, chopped", 57],
  salad_red: ["1 salad serving", 85],
};

// Plant name (as in the plants table) -> USDA food + serving.
// fdc: USDA FoodData Central id. approx: why a related food is used.
export const PLANT_NUTRITION = {
  "Arugula":              { fdc: 169387, serving: ["½ cup", 10] },
  "Banana Peppers":       { fdc: 169394, serving: ["1 medium pepper", 46] },
  "Basil":                { fdc: 172232, serving: ["2 tbsp, chopped", 5.3] },
  "Breen Lettuce":        { fdc: 169247, serving: S.cup_romaine, approx: "Breen is a mini romaine, so this uses romaine." },
  "Bunching Onions":      { fdc: 170005, serving: ["1 medium onion", 15] },
  "Buttercrunch":         { fdc: 168429, serving: S.cup_butter },
  "Butterhead":           { fdc: 168429, serving: S.cup_butter },
  "Celery":               { fdc: 169988, serving: ["1 medium stalk", 40] },
  "Chives":               { fdc: 169994, serving: ["1 tbsp, chopped", 3] },
  "Cilantro":             { fdc: 169997, serving: ["¼ cup", 4] },
  "Cucumbers":            { fdc: 168409, serving: ["½ cup, sliced", 52] },
  "Dill":                 { fdc: 172233, serving: ["1 cup of sprigs", 8.9] },
  "Dragon Beans":         { fdc: 169320, serving: ["1 cup, ½-inch pieces", 100], approx: "Uses yellow snap beans, the closest USDA match." },
  "Endive Lettuce":       { fdc: 168412, serving: ["½ cup, chopped", 25] },
  "Fairytale Eggplant":   { fdc: 169228, serving: ["1 cup, cubed", 82], approx: "Uses standard eggplant." },
  "Flashy Lettuce":       { fdc: 169247, serving: S.cup_romaine, approx: "A romaine-type lettuce, so this uses romaine." },
  "Green Beans":          { fdc: 169961, serving: ["1 cup, ½-inch pieces", 100] },
  "Green Bok Choy":       { fdc: 170390, serving: ["1 cup, shredded", 70] },
  "Green Cabbage":        { fdc: 169975, serving: ["1 cup, shredded", 70] },
  "Green Mustard":        { fdc: 169256, serving: ["1 cup, chopped", 56] },
  "Green Salanova":       { fdc: 169249, serving: S.cup_green, approx: "Uses green leaf lettuce." },
  "Green Tatsoi":         { fdc: 170390, serving: ["1 cup, shredded", 70], approx: "USDA doesn't list tatsoi; this uses bok choy, a close relative." },
  "Holy Basil":           { fdc: 172232, serving: ["2 tbsp, chopped", 5.3], approx: "Uses sweet basil, a close relative." },
  "Iceberg Lettuce":      { fdc: 169248, serving: S.cup_iceberg },
  "Italian Parsley":      { fdc: 170416, serving: ["¼ cup, chopped", 15] },
  "Jalapeños":            { fdc: 168576, serving: ["1 pepper", 14] },
  "Kale":                 { fdc: 168421, serving: ["1 cup", 21] },
  "Kale Lacinato":        { fdc: 168421, serving: ["1 cup", 21], approx: "Uses standard kale." },
  "Lemon Hot Pepper":     { fdc: 170106, serving: ["1 pepper", 45], approx: "Uses ripe hot chili peppers." },
  "Mini Cauliflower":     { fdc: 169986, serving: ["3 florets", 39] },
  "Mint":                 { fdc: 173475, serving: ["2 tbsp", 11.4], approx: "Uses spearmint." },
  "Muir Lettuce":         { fdc: 169249, serving: S.cup_green, approx: "Uses green leaf lettuce." },
  "Peas":                 { fdc: 170419, serving: ["1 cup", 145] },
  "Perpetual Spinach":    { fdc: 169991, serving: ["1 cup", 36], approx: "Perpetual spinach is a type of chard, so this uses Swiss chard." },
  "Purple Basil":         { fdc: 172232, serving: ["2 tbsp, chopped", 5.3], approx: "Uses sweet basil." },
  "Purple Bok Choy":      { fdc: 170390, serving: ["1 cup, shredded", 70], approx: "Uses green bok choy." },
  "Purple Kohlrabi":      { fdc: 168424, serving: ["1 cup", 135] },
  "Red Amaranth":         { fdc: 168385, serving: ["1 cup", 28] },
  "Red Cherry Tomatoes":  { fdc: 170457, serving: ["5 cherry tomatoes", 85] },
  "Red Mini Strawberries":{ fdc: 167762, serving: ["1 cup, sliced", 166] },
  "Red Mustard":          { fdc: 169256, serving: ["1 cup, chopped", 56] },
  "Red Sails":            { fdc: 168431, serving: S.salad_red },
  "Red Salad Bowl":       { fdc: 168431, serving: S.salad_red },
  "Red Sorrel":           { fdc: 170076, serving: ["1 cup, chopped", 133], approx: "USDA lists sorrel as dock." },
  "Red Swiss Chard":      { fdc: 169991, serving: ["1 cup", 36] },
  "Red Tatsoi":           { fdc: 170390, serving: ["1 cup, shredded", 70], approx: "USDA doesn't list tatsoi; this uses bok choy, a close relative." },
  "Romaine":              { fdc: 169247, serving: S.cup_romaine },
  "Rosemary":             { fdc: 173473, serving: ["1 tbsp", 1.7] },
  "Sweet Peppers":        { fdc: 170108, serving: ["1 cup, chopped", 149], approx: "Uses red sweet peppers." },
  "Sweet Thai Basil":     { fdc: 172232, serving: ["2 tbsp, chopped", 5.3], approx: "Uses sweet basil, a close relative." },
  "Thyme":                { fdc: 173470, serving: ["1 tsp", 0.8] },
  "Tokyo Bekana":         { fdc: 169979, serving: ["1 cup, shredded", 76], approx: "Uses Chinese (napa) cabbage, a close relative." },
  "Watercress":           { fdc: 170068, serving: ["1 cup, chopped", 34] },
  "Yellow Swiss Chard":   { fdc: 169991, serving: ["1 cup", 36] },
};

// Plants with no fresh USDA entry, and why.
export const NO_NUTRITION = {
  flower: "Grown for its flowers, not as a food crop, so USDA has no nutrition data. Only let students taste a flower if you've confirmed it's an edible variety.",
  driedHerb: "USDA only lists this herb dried, not fresh. It's used in small amounts for flavor.",
  catnip: "Grown for cats, not as a food crop.",
  other: "No USDA nutrition data for this plant.",
};
const NO_DATA_KIND = {
  Oregano: "driedHerb", Sage: "driedHerb", Savory: "driedHerb", Tarragon: "driedHerb",
  "Sweet Marjoram": "driedHerb", Catnip: "catnip",
};

// FDA Daily Values (adults and children 4+), 2016 label rule.
export const DAILY_VALUES = {
  fiber: 28, protein: 50, vitC: 90, vitA: 900, vitK: 120, folate: 400,
  calcium: 1300, iron: 18, potassium: 4700, magnesium: 420,
};

export const NUTRIENT_LABELS = [
  ["kcal", "Calories", ""],
  ["protein", "Protein", "g"],
  ["carbs", "Carbohydrates", "g"],
  ["fiber", "Fiber", "g"],
  ["sugars", "Sugars", "g"],
  ["vitA", "Vitamin A", "mcg"],
  ["vitC", "Vitamin C", "mg"],
  ["vitK", "Vitamin K", "mcg"],
  ["folate", "Folate", "mcg"],
  ["calcium", "Calcium", "mg"],
  ["iron", "Iron", "mg"],
  ["magnesium", "Magnesium", "mg"],
  ["potassium", "Potassium", "mg"],
];

const norm = (s) => String(s || "").trim().toLowerCase();
const BY_NAME = Object.fromEntries(Object.entries(PLANT_NUTRITION).map(([k, v]) => [norm(k), v]));

/**
 * { food, serving:[label, grams], approx, fdc } for a plant, or
 * { none: message } when there's no data.
 */
export function nutritionFor(plant) {
  const hit = BY_NAME[norm(plant.name)];
  if (hit) return { ...hit, food: USDA_FOODS[hit.fdc] };
  const kind = NO_DATA_KIND[plant.name] || (plant.category === "Flowers" || plant.category === "Flower" ? "flower" : "other");
  return { none: NO_NUTRITION[kind] };
}

/** Scale per-100 g values to `grams`. */
export function scale(per100g, grams) {
  const f = grams / 100;
  return Object.fromEntries(Object.entries(per100g).map(([k, v]) => [k, v * f]));
}

/** FDA wording: 20%+ DV "excellent source", 10–19% "good source". */
export function highlights(values) {
  const out = [];
  for (const [k, dv] of Object.entries(DAILY_VALUES)) {
    const v = values[k];
    if (v == null) continue;
    const pct = Math.round((v / dv) * 100);
    if (pct >= 10) out.push({ key: k, pct, level: pct >= 20 ? "excellent" : "good" });
  }
  return out.sort((a, b) => b.pct - a.pct);
}
