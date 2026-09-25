// Learn guides: short, step-by-step interactive tutorials for Gardyn
// Studio care. Each guide is a list of steps; a step's `type` picks how it
// renders (see src/pages/LearnGuide.jsx):
//   info      – a card of text (+ optional tip)
//   quiz      – pick an answer; wrong answers explain why, then retry
//   placer    – plan your 16 slots against the light map (saves to Tracker)
//   sprout    – pick the sprout to keep in a pod
//   harvest   – harvest a lettuce without taking too much
//
// Care facts follow the Gardyn Help Center (linked in each guide's
// `sources`). Have the Growing Minds team check wording before changes.

export const TUTORIALS = [
  {
    id: "place-ycubes",
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
];

export const tutorialById = (id) => TUTORIALS.find((t) => t.id === id);
