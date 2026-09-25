// Learn guides: short, step-by-step interactive tutorials for Gardyn
// Studio care. Each guide is a list of steps; a step's `type` picks how it
// renders (see src/pages/LearnGuide.jsx):
//   info      – a card of text (+ optional tip)
//   quiz      – pick an answer; wrong answers explain why, then retry
//   placer    – plan your 16 slots against the light map (saves to Tracker)
//   sprout    – pick the sprout to keep in a pod
//   harvest   – harvest a lettuce without taking too much
//   ph        – find the plant-ready pH zone
// More guides and step types live in tutorialsMore.js.
//
// Care facts follow the Gardyn Help Center (linked in each guide's
// `sources`). Have the Growing Minds team check wording before changes.

import { MORE_GUIDES } from "./tutorialsMore";

export const LEVELS = [
  { id: "beginner", label: "Beginner", icon: "🌱", blurb: "Your first two weeks: getting plants in and sprouting." },
  { id: "intermediate", label: "Intermediate", icon: "🌿", blurb: "Weekly care and your first harvests." },
  { id: "advanced", label: "Advanced", icon: "🌳", blurb: "The science behind the tower, for you and your students." },
];

// Planned guides, shown greyed out so teachers can see what's coming.
export const COMING_SOON = [];

const CORE_GUIDES = [
  {
    id: "place-ycubes",
    level: "beginner",
    title: "Place your yCubes",
    blurb: "Match each plant to the right amount of light, then save your plan to the Tracker.",
    icon: "🌿",
    minutes: 5,
    sources: [
      { label: "Gardyn: yCube Placement Guide", url: "https://help.mygardyn.com/en/articles/1776961" },
    ],
    steps: [
      {
        type: "info",
        title: "Light changes from slot to slot",
        body: [
          "Your Gardyn Studio has 2 columns of 8 slots. Row 1 is the top of each column.",
          "The light bars are brightest near the middle of the tower and softer at the very top, so every slot has a sun level: Low, Medium or High.",
        ],
        visual: "lightmap",
      },
      {
        type: "info",
        title: "Plants want different amounts",
        body: [
          "High sun: fruiting and flowering plants, like peppers, tomatoes, beans and sunflowers.",
          "Medium sun: leafy greens and most herbs, like lettuce, kale, chard and basil.",
          "Low sun: shade-tolerant herbs, like mint, cilantro, dill, arugula, thyme and rosemary.",
        ],
        tip: "Not perfect is OK. Gardyn says most plants do just fine in a lower-light spot.",
      },
      {
        type: "quiz",
        question: "Where should a cherry tomato go?",
        options: [
          { text: "A Low sun slot at the top, so it has room to grow", feedback: "Tomatoes are fruiting plants. They need the brightest light to set fruit." },
          { text: "A High sun slot near the middle of the tower", correct: true, feedback: "Right. Fruiting plants go where the light is strongest, near the middle." },
          { text: "Anywhere. Light doesn't matter much", feedback: "Light matters a lot for fruiting plants: without enough, they grow leaves but little fruit." },
        ],
      },
      {
        type: "quiz",
        question: "You're planting a tomato and a pepper. Should they go side by side?",
        options: [
          { text: "Yes, keep the big plants together", feedback: "Big plants grouped together shade each other. Spread them out." },
          { text: "No, spread them apart so neither blocks the other's light", correct: true, feedback: "Yes. Gardyn recommends not grouping larger plants, so no plant blocks another's light." },
        ],
      },
      {
        type: "placer",
        title: "Plan your 16 slots",
        body: "Tap a plant, then tap a slot. Green means a great light match; amber means it will manage; red means find it a better spot.",
      },
      {
        type: "info",
        title: "Nice work!",
        body: [
          "When you plant, cover any empty slots with Gardyn caps, and keep the spots around big plants open so they have room.",
          "Your Tracker shows the sun level of every slot and warns you if a plant is in the wrong light.",
        ],
      },
    ],
  },
  {
    id: "thinning",
    level: "beginner",
    title: "Sprouts & thinning",
    blurb: "Know when to thin, how many sprouts to keep, and how to do it without hurting the one you keep.",
    icon: "✂️",
    minutes: 4,
    sources: [
      { label: "Gardyn: Thinning — When, Why and How", url: "https://help.mygardyn.com/en/articles/1771329" },
    ],
    steps: [
      {
        type: "info",
        title: "Why thin at all?",
        body: [
          "Each yCube has several seeds, so several sprouts come up. Left alone, they compete for light, water, nutrients, air and space.",
          "Crowded pods grow weak, leggy stems, trap moisture (which invites mold and pests), and give you a smaller harvest.",
        ],
      },
      {
        type: "info",
        title: "When to thin",
        body: [
          "About 5 to 7 days after your sprouts get their first plant food.",
          "Kelby sends you a thinning reminder, so you don't have to track the date yourself.",
        ],
        tip: "One sprout = one stem coming out of the rockwool. A single sprout can have several leaves.",
      },
      {
        type: "quiz",
        question: "How many sprouts do you keep in a lettuce pod?",
        options: [
          { text: "1", correct: true, feedback: "Right. Lettuce, leafy greens, fruiting plants and large flowers: keep 1." },
          { text: "3", feedback: "Three is for herbs and small flowers. Lettuce gets big, so keep just 1." },
          { text: "All of them", feedback: "Lettuce sprouts would crowd each other. Keep the strongest 1." },
        ],
      },
      {
        type: "quiz",
        question: "How many do you keep in a basil pod?",
        options: [
          { text: "1", feedback: "One is for lettuce and big plants. Herbs like basil do well with 3." },
          { text: "3", correct: true, feedback: "Right. Herbs and small flowers: keep 3." },
          { text: "All of them", feedback: "Too many basil sprouts compete for light. Keep 3." },
        ],
      },
      {
        type: "quiz",
        question: "Which of these do you NOT thin at all?",
        options: [
          { text: "Arugula and chives", correct: true, feedback: "Right. Gardyn says don't thin arugula, chamomile, chives, garlic chives or wheatgrass." },
          { text: "Kale and romaine", feedback: "Kale and romaine are leafy greens: thin to 1." },
          { text: "Tomatoes and peppers", feedback: "Fruiting plants get thinned to 1 so the plant can get big." },
        ],
      },
      {
        type: "sprout",
        title: "Your turn: pick the keeper",
        body: "This lettuce pod has four sprouts. Tap the one you'd keep.",
      },
      {
        type: "quiz",
        question: "How do you remove the others?",
        options: [
          { text: "Pull them out by the roots", feedback: "Pulling can damage the roots of the sprout you're keeping. Snip instead." },
          { text: "Snip them at the base with clean scissors", correct: true, feedback: "Exactly. A clean cut at the base leaves the keeper's roots undisturbed." },
        ],
      },
      {
        type: "info",
        title: "Don't waste them: taste them!",
        body: [
          "Leafy green, lettuce and herb sprouts are all edible. Thinning day makes a great first class taste test.",
        ],
      },
    ],
  },
  {
    id: "harvest",
    level: "intermediate",
    title: "Harvest so it grows back",
    blurb: "Take the right leaves, leave enough behind, and your plants keep producing for weeks.",
    icon: "🥬",
    minutes: 4,
    sources: [
      { label: "Gardyn: Harvesting Leafy Greens and Lettuces", url: "https://help.mygardyn.com/en/articles/1770945" },
      { label: "Gardyn: Harvesting Herbs", url: "https://help.mygardyn.com/en/articles/1771073" },
    ],
    steps: [
      {
        type: "info",
        title: "Two ways to harvest greens",
        body: [
          "Outer leaves: snip the big outside leaves and leave the center growing. You can harvest the same plant again and again.",
          "Whole head: cut the whole plant at its base. You get one big harvest, and then that yCube is done.",
        ],
        tip: "Most classrooms use outer leaves, so there's always something to taste.",
      },
      {
        type: "harvest",
        title: "Harvest this lettuce",
        body: "Tap leaves to snip them. Take outer leaves only, and leave at least one-third of the plant.",
      },
      {
        type: "quiz",
        question: "Where do you cut basil?",
        options: [
          { text: "Just above a growth node (where two small new leaves meet the stem)", correct: true, feedback: "Right. Cutting above a node makes the plant branch and grow bushier." },
          { text: "At the very bottom of the stem", feedback: "That removes the whole stem. Cut above a growth node so it branches and regrows." },
          { text: "Pull the biggest leaves off by hand", feedback: "Tearing can damage the stem. Use scissors above a growth node." },
        ],
      },
      {
        type: "quiz",
        question: "Rosemary and thyme grow slowly. When do you start harvesting?",
        options: [
          { text: "As soon as they sprout", feedback: "Too early. Slow herbs need to be established first." },
          { text: "When they're about 6 to 8 inches tall, taking the top half of a branch", correct: true, feedback: "Right. Waiting until 6–8 inches lets them regrow without stunting." },
        ],
      },
      {
        type: "info",
        title: "Harvest often",
        body: [
          "Regular harvests keep big plants from shading their neighbors, so every pod gets the light it needs.",
          "Harvest day is also a good time to check the roots.",
        ],
      },
    ],
  },
  {
    id: "water-care",
    level: "intermediate",
    title: "Weekly water care",
    blurb: "Top off, feed, and refresh the tank on the right schedule, with the right amounts for a Studio.",
    icon: "💧",
    minutes: 4,
    sources: [
      { label: "Gardyn: Discovering Water Quality", url: "https://help.mygardyn.com/en/articles/1777281" },
      { label: "Gardyn: How, Why, and When to Add HydroBoost", url: "https://help.mygardyn.com/en/articles/1788289" },
    ],
    steps: [
      {
        type: "info",
        title: "Three things keep the water healthy",
        body: [
          "Plant food: the nutrients your plants eat. Always measure it and dissolve it fully before adding it to the tank.",
          "HydroBoost: a plant-based water treatment that keeps algae, biofilm and mineral build-up down and helps balance the water.",
          "Fresh water: the tank gets topped off every week and completely refreshed about once a month.",
        ],
        tip: "Start sprouts with water only. Kelby tells you when it's time for the first plant food.",
      },
      {
        type: "quiz",
        question: "How often do you top off the tank and add plant food?",
        options: [
          { text: "Every day", feedback: "That's more than it needs. Gardyn's schedule is a weekly top-off." },
          { text: "Once a week", correct: true, feedback: "Right. Top off weekly with ½ teaspoon of plant food per gallon of water you add, plus HydroBoost." },
          { text: "Once a month", feedback: "Monthly is for the full refresh. Top-offs and feeding happen weekly." },
        ],
      },
      {
        type: "quiz",
        question: "On a Studio with regular tap water, how much HydroBoost goes in each week?",
        options: [
          { text: "½ teaspoon", feedback: "That's the Studio amount for filtered, RO or distilled water. Regular tap water needs more." },
          { text: "1½ teaspoons", correct: true, feedback: "Right. Studio with standard water: 1½ tsp. Hard water: 3 tsp. Filtered water: ½ tsp." },
          { text: "A full cap", feedback: "Measure it. For a Studio with standard water, it's 1½ teaspoons." },
        ],
      },
      {
        type: "quiz",
        question: "You're growing four or more fruiting plants (tomatoes, peppers). What changes?",
        options: [
          { text: "Nothing, same schedule", feedback: "Big fruiting plants drink and eat a lot more, so the schedule speeds up." },
          { text: "Refresh the tank every 14 days, and HydroBoost can go in as often as every 3 days", correct: true, feedback: "Right. Heavy feeders need fresher water more often." },
        ],
      },
      {
        type: "info",
        title: "Safety for the classroom",
        body: [
          "Keep HydroBoost and plant food where students can't reach them. They're not for drinking.",
          "Have one adult or a trained student team measure and add them, and log each top-off in the app's Maintenance page.",
        ],
      },
    ],
  },
  {
    id: "ph-basics",
    level: "advanced",
    title: "The chemistry of your tank: pH",
    blurb: "Why pH decides what roots can absorb, why Gardyn handles it for you, and how to explore it safely with students.",
    icon: "🧪",
    minutes: 5,
    sources: [
      { label: "Gardyn: Do I need to measure my water's pH?", url: "https://help.mygardyn.com/en/articles/1777153" },
      { label: "Oklahoma State University Extension: EC and pH Guide for Hydroponics", url: "https://extension.okstate.edu/fact-sheets/electrical-conductivity-and-ph-guide-for-hydroponics" },
    ],
    steps: [
      {
        type: "info",
        title: "pH controls what roots can absorb",
        body: [
          "pH measures how acidic or basic the water is, from 0 to 14. Seven is neutral.",
          "The food can be right there in the water, but if the pH drifts too far, some nutrients become hard for roots to take up. Hydroponic water is usually kept slightly acidic, around 5.5 to 6.5.",
        ],
      },
      {
        type: "ph",
        title: "Find the plant-ready zone",
        body: "Drag the slider to see what a plant experiences at each pH. Land in the zone plants like best to continue.",
      },
      {
        type: "quiz",
        question: "Do you need to test your Gardyn's pH every week?",
        options: [
          { text: "Yes, or the plants will starve", feedback: "Not for a Gardyn. Its plant food and HydroBoost are made to keep the pH in range for you." },
          { text: "No. Gardyn's plant food and HydroBoost keep it in range when you follow the schedule", correct: true, feedback: "Right. Testing is optional: it's great science, not a chore." },
        ],
      },
      {
        type: "quiz",
        question: "Your class wants to test the tank water. How do you do it?",
        options: [
          { text: "Dip the pH strips and indicators straight into the reservoir", feedback: "Never experiment in the reservoir: whatever goes in reaches every plant." },
          { text: "Scoop a sample into a cup and test the cup", correct: true, feedback: "Exactly. Test a sample, and pour it out afterward." },
          { text: "Add vinegar to the tank to see what happens", feedback: "That changes the water for every plant in the tower. Experiment on samples only." },
        ],
      },
      {
        type: "quiz",
        question: "pH is a log scale. How much more acidic is pH 5 than pH 6?",
        options: [
          { text: "A little: about 1 unit", feedback: "Each whole step on the pH scale is a factor of ten." },
          { text: "10 times", correct: true, feedback: "Right. That's why a 'small' change in pH is a big chemical change: a great hook for older students." },
          { text: "2 times", feedback: "Each whole pH step is ten times, not two." },
        ],
      },
      {
        type: "info",
        title: "Take it to your class",
        body: [
          "The pH Puzzle (HS Chemistry) and Gardyn's Plant Pigment pH Indicator lesson turn this into a hands-on lab. Find both in Library → Lesson plans.",
        ],
      },
    ],
  },
];

// Display order (also sets "Next guide" on the finish screen).
const ORDER = [
  "setup", "connect", "place-ycubes", "thinning",        // beginner
  "water-care", "harvest", "roots",                      // intermediate
  "troubleshoot", "ph-basics", "experiment",             // advanced
];
const ALL = [...CORE_GUIDES, ...MORE_GUIDES];
export const TUTORIALS = [
  ...ORDER.map((id) => ALL.find((g) => g.id === id)).filter(Boolean),
  ...ALL.filter((g) => !ORDER.includes(g.id)),
];

export const tutorialById = (id) => TUTORIALS.find((t) => t.id === id);
