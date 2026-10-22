import { parseLocalDate, daysBetween } from "./date";
import { getStatus as getMaintenanceStatus, daysUntilDue } from "../pages/Maintenance";

// "Guides that come to the teacher": turn Tracker + Maintenance data into a
// few timely coaching cards, each linking to the Learn guide that helps.
// Dates are estimates from the planting date; Kelby's reminders win.

// Gardyn: don't thin arugula, chamomile, chives, garlic chives, wheatgrass.
const NO_THIN = ["arugula", "chamomile", "chive", "wheatgrass"];
const DEFAULT_GERM = 7;
const MATURE_DAYS = 56; // Gardyn: plants 1–2 months old rarely need root trims

const norm = (s) => String(s || "").trim().toLowerCase();

function findPlant(plants, name) {
  const n = norm(name);
  if (!n) return null;
  return plants.find((p) => norm(p.name) === n)
    || plants.find((p) => n.includes(norm(p.name)) || norm(p.name).includes(n))
    || null;
}

const list = (items, max = 3) => {
  const shown = items.slice(0, max).map((s) => `${s.slot_id} ${s.plant_name}`);
  return items.length > max ? `${shown.join(", ")} and ${items.length - max} more` : shown.join(", ");
};
const plural = (n, one, many) => (n === 1 ? one : many);
const ageRange = (items) => {
  const ages = items.map((s) => s.age);
  const lo = Math.min(...ages), hi = Math.max(...ages);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
};

/**
 * @returns {Array<{key, icon, tone, title, body, guideId, cta}>} highest priority first
 */
export function computeCoaching({ slots = [], plants = [], maintenance = [], progress = {}, today = new Date() }) {
  const done = (id) => Boolean(progress[id]?.completed_at);
  const cta = (id, mins) => (done(id) ? "Quick refresher" : `Learn how · ${mins} min`);

  const planted = slots
    .filter((s) => s.status && s.status !== "Empty" && s.plant_name)
    .map((s) => {
      const d = parseLocalDate(s.date_planted);
      return { ...s, age: d ? daysBetween(d, today) : null, plant: findPlant(plants, s.plant_name) };
    })
    .filter((s) => s.age == null || s.age >= 0);

  const cards = [];

  // Harvest: past its days-to-harvest but not marked ready yet.
  const harvestable = planted.filter((s) =>
    s.age != null && s.plant?.harvest_days && s.age >= s.plant.harvest_days && s.status !== "Ready to Harvest");
  if (harvestable.length) {
    cards.push({
      key: `harvest:${harvestable.map((s) => s.slot_id).join(",")}`,
      icon: "🥬", tone: "green",
      title: `${harvestable.length} ${plural(harvestable.length, "plant is", "plants are")} probably ready to harvest`,
      body: `${list(harvestable)} ${plural(harvestable.length, "has", "have")} reached ${plural(harvestable.length, "its", "their")} usual harvest time. Take outer leaves and leave at least a third of the plant.`,
      guideId: "harvest", cta: cta("harvest", 4),
    });
  }

  // Thinning window: roughly a week or two after sprouting.
  const thin = planted.filter((s) => {
    if (s.age == null || !["Germinating", "Growing"].includes(s.status)) return false;
    if (NO_THIN.some((w) => norm(s.plant_name).includes(w))) return false;
    const germ = s.plant?.germination_days ?? DEFAULT_GERM;
    return s.age >= germ + 5 && s.age <= germ + 21;
  });
  if (thin.length) {
    cards.push({
      key: `thin:${thin.map((s) => s.slot_id).join(",")}`,
      icon: "✂️", tone: "teal",
      title: `Thinning time for ${thin.length} ${plural(thin.length, "pod", "pods")}`,
      body: `${list(thin)} went in ${ageRange(thin)} days ago. If Kelby says it's time, keep 1 sprout in greens and big plants, and 3 in herbs.`,
      guideId: "thinning", cta: cta("thinning", 4),
    });
  }

  // Slow sprouts: still germinating well past the expected time.
  const slow = planted.filter((s) => {
    if (s.age == null || s.status !== "Germinating") return false;
    const germ = s.plant?.germination_days ?? DEFAULT_GERM;
    return s.age > Math.max(germ * 2, germ + 7);
  });
  if (slow.length) {
    cards.push({
      key: `slow:${slow.map((s) => s.slot_id).join(",")}`,
      icon: "🥶", tone: "amber",
      title: `No sprouts yet in ${slow.length} ${plural(slow.length, "pod", "pods")}?`,
      body: `${list(slow)} ${plural(slow.length, "is", "are")} still marked Germinating. If nothing has come up, check the room temperature and that water is reaching the pods. If it has, update the Tracker.`,
      guideId: "troubleshoot", cta: cta("troubleshoot", 6),
    });
  }

  // Water care overdue.
  const water = maintenance
    .filter((t) => /tank|hydroboost|water/i.test(t.task_name || ""))
    .filter((t) => getMaintenanceStatus(t) === "overdue")
    .sort((a, b) => daysUntilDue(a) - daysUntilDue(b));
  if (water.length && planted.length) {
    const t = water[0];
    const late = -daysUntilDue(t);
    cards.push({
      key: `water:${t.task_name}:${t.last_completed}`,
      icon: "💧", tone: "blue",
      title: `${t.task_name} is ${late} ${plural(late, "day", "days")} overdue`,
      body: "Fresh water and balanced food prevent most leaf problems. The guide has the Studio amounts for plant food and HydroBoost.",
      guideId: "water-care", cta: cta("water-care", 4),
    });
  }

  // Roots: mature plants and the root check isn't current.
  const mature = planted.filter((s) => s.age != null && s.age >= MATURE_DAYS);
  const rootTask = maintenance.find((t) => /root/i.test(t.task_name || ""));
  const rootStatus = rootTask ? getMaintenanceStatus(rootTask) : "needs-date";
  if (mature.length && (rootStatus === "overdue" || rootStatus === "needs-date")) {
    cards.push({
      key: `roots:${rootTask?.last_completed || "never"}`,
      icon: "🪴", tone: "teal",
      title: "Time for a root check",
      body: `${mature.length} ${plural(mature.length, "plant is", "plants are")} over 8 weeks old. Mature roots grow fast and can block the column, so Gardyn suggests a weekly look.`,
      guideId: "roots", cta: cta("roots", 5),
    });
  }

  return cards;
}
