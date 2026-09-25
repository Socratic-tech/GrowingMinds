// Kid-friendly (K–5) wording for Learn guides, used when a teacher turns on
// "Kid words" (usually while presenting to the class). Keyed by guide id,
// then by step index in that guide. Anything not listed falls back to the
// regular wording. Quiz `options` / `feedback` line up with the guide's own
// options, in the same order.

export const KID_WORDS = {
  "place-ycubes": {
    0: {
      title: "Some spots get more light",
      body: [
        "Our tower has 2 columns with 8 spots each. That's 16 homes for plants!",
        "The lights are brightest in the middle of the tower. Some spots get a little light, some get medium light, and some get lots of light.",
      ],
    },
    1: {
      title: "Plants are picky about light",
      body: [
        "Lots of light: plants that make fruit or flowers, like tomatoes, peppers and beans.",
        "Medium light: leafy plants, like lettuce, kale and basil.",
        "A little light: herbs like mint, cilantro and dill.",
      ],
      tip: "It doesn't have to be perfect. Most plants still grow okay.",
    },
    2: {
      question: "Where should a tomato plant go?",
      options: ["A spot with a little light", "A spot with lots of light", "Anywhere at all"],
      feedback: [
        "Tomatoes need lots of light to make tomatoes!",
        "Yes! Tomatoes need lots of light to make fruit.",
        "Light really matters. Without enough, a tomato plant makes leaves but hardly any tomatoes.",
      ],
    },
    3: {
      question: "Should two big plants go right next to each other?",
      options: ["Yes, big plants together", "No, spread them out"],
      feedback: [
        "Big plants next to each other block each other's light.",
        "Yes! Spreading them out means every plant gets its light.",
      ],
    },
    4: { body: "Tap a plant, then tap a spot. Green means it's a great spot. Yellow means okay. Red means find a better spot." },
    5: {
      title: "Great planning!",
      body: ["Empty spots get a cap, like a little hat, to keep light out.", "Leave room around big plants so they can grow."],
    },
  },

  thinning: {
    0: {
      title: "Why do we thin?",
      body: [
        "Each cube has lots of seeds, so lots of baby plants pop up.",
        "If we keep them all, they fight over light and water, and they all grow weak. So we keep the strongest ones.",
      ],
    },
    1: {
      title: "When do we thin?",
      body: ["About a week after the sprouts get their first plant food.", "The Gardyn app will remind us!"],
      tip: "One sprout means one stem coming out of the cube.",
    },
    2: {
      question: "How many lettuce sprouts do we keep in one cube?",
      options: ["1", "3", "All of them"],
      feedback: [
        "Yes! Lettuce grows big, so it needs its own space.",
        "Three is for herbs. Lettuce gets big, so keep just 1.",
        "They'd be too crowded. Keep the strongest 1.",
      ],
    },
    3: {
      question: "How many basil sprouts do we keep?",
      options: ["1", "3", "All of them"],
      feedback: ["Basil likes a few friends. Keep 3.", "Yes! Herbs like basil get to keep 3.", "Too many. Keep 3."],
    },
    4: {
      question: "Which plants do we NOT thin?",
      options: ["Arugula and chives", "Kale and lettuce", "Tomatoes and peppers"],
      feedback: [
        "Yes! Arugula and chives can all stay.",
        "Kale and lettuce get thinned to 1.",
        "Tomatoes and peppers get thinned to 1 so they can grow big.",
      ],
    },
    5: { body: "This cube has four sprouts. Tap the one you would keep." },
    6: {
      question: "How do we take out the extra sprouts?",
      options: ["Pull them out", "Snip them with clean scissors"],
      feedback: [
        "Pulling can hurt the roots of the sprout we keep. Snip instead!",
        "Yes! A little snip at the bottom keeps our sprout safe.",
      ],
    },
    7: {
      title: "Taste test!",
      body: ["Lettuce and herb sprouts are safe to eat. Ask your teacher if it's taste-test day!"],
    },
  },

  harvest: {
    0: {
      title: "Two ways to pick lettuce",
      body: [
        "Outside leaves: snip the big leaves on the outside. The middle keeps growing, so we can pick again and again!",
        "Whole plant: cut the whole thing. That's one big harvest, and then that plant is done.",
      ],
    },
    1: { body: "Tap leaves to snip them. Take only outside leaves, and leave plenty of plant behind." },
    2: {
      question: "Where do we cut basil?",
      options: ["Just above where two tiny new leaves grow", "At the very bottom", "Pull leaves off with our fingers"],
      feedback: [
        "Yes! Cutting there makes the basil grow two new branches.",
        "That takes the whole stem. Cut higher, above two tiny leaves.",
        "Pulling can hurt the stem. Use scissors.",
      ],
    },
    3: {
      question: "Rosemary grows slowly. When do we start picking it?",
      options: ["Right when it sprouts", "When it's about as tall as a pencil"],
      feedback: ["Too soon! It needs to grow first.", "Yes! Let it get tall first so it can keep growing."],
    },
    4: {
      title: "Pick often!",
      body: ["When we pick often, big plants don't block the light for their neighbors.", "And there's always something to taste!"],
    },
  },

  "water-care": {
    0: {
      title: "Keeping the water healthy",
      body: [
        "Plant food is what plants eat. A grown-up measures it.",
        "HydroBoost keeps the water clean. A grown-up adds it too.",
        "We add fresh water every week.",
      ],
    },
    4: {
      title: "Safety first",
      body: ["Plant food and HydroBoost are not for drinking. Only grown-ups handle them.", "We can help by writing down the date every time we add water."],
    },
  },

  roots: {
    0: {
      title: "Why look at roots?",
      body: ["Roots are how plants drink. They hang down inside the tower where the water flows.", "Big plants grow lots of roots, so we check them every week."],
    },
    1: {
      title: "How to peek",
      body: ["A grown-up gently pulls the pod straight out.", "Then we look, and put it back until it clicks in flat."],
    },
    2: { body: "Look at each root. Is it healthy, or does it need help?" },
    3: {
      question: "A root is brown, slimy and stinky. What do we do?",
      options: ["Pinch off the yucky part", "Leave it alone", "Give it more plant food"],
      feedback: ["Yes! Take off the yucky part and throw it away.", "That yucky part can spread. Take it off.", "Food won't fix it. Take off the yucky part."],
    },
    4: {
      question: "Too many roots! How do we trim them?",
      options: ["Cut them all off", "Snip a little corner off the bottom"],
      feedback: ["That's too much at once. Plants like small trims.", "Yes! A small trim is best."],
    },
    5: {
      title: "All done!",
      body: ["Put the pod back until it's flat, and write down that we checked the roots."],
      tip: "Some plants, like Swiss chard, have red-purple roots. That's healthy!",
    },
  },
};

export const hasKidWords = (id) => Boolean(KID_WORDS[id]);

/** Merge kid wording over a step. Returns the step unchanged if none. */
export function kidStep(guideId, index, step) {
  const k = KID_WORDS[guideId]?.[index];
  if (!k) return step;
  const out = { ...step };
  if (k.title) out.title = k.title;
  if (k.body) out.body = k.body;
  if (k.tip) out.tip = k.tip;
  if (k.question) out.question = k.question;
  if (k.options && step.options) {
    out.options = step.options.map((o, i) => ({
      ...o,
      text: k.options[i] ?? o.text,
      feedback: k.feedback?.[i] ?? o.feedback,
    }));
  }
  return out;
}
