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
    1: {
      question: "How often do we add water and plant food to the tank?",
      options: ["Every day", "Once a week", "Once a month"],
      feedback: [
        "That's too much! We only do it once a week.",
        "Yes! A grown-up adds water, plant food and HydroBoost once a week.",
        "Once a month is for changing all the water. Adding water and food happens every week.",
      ],
    },
    2: {
      question: "How much HydroBoost does a grown-up add each week with regular tap water?",
      options: ["½ teaspoon", "1½ teaspoons", "A whole capful"],
      feedback: [
        "That's too little for regular tap water. It needs more.",
        "Yes! A grown-up measures 1½ teaspoons for regular tap water.",
        "A grown-up measures it with a spoon. A capful is too much.",
      ],
    },
    3: {
      question: "We're growing four or more tomato or pepper plants. What changes?",
      options: ["Nothing. Same schedule", "We change the water more often, about every 14 days"],
      feedback: [
        "Big tomato and pepper plants drink and eat a lot more. The schedule speeds up.",
        "Yes! Hungry, thirsty plants need fresher water more often.",
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

  setup: {
    0: {
      title: "Pick a good spot",
      body: [
        "Our tower lives inside, near an outlet and the Wi-Fi, with room for air to move around it.",
        "Plants like a room that's not too hot and not too cold. We keep the tower away from heaters, drafty doors and super sunny windows.",
        "Two safety straps hold the tower to the wall so it can't tip over. A grown-up does that part.",
      ],
      tip: "A grown-up checks the Wi-Fi in that exact spot before we build.",
    },
    1: { body: "Open the box and tap each part when you find it." },
    2: { body: "Tap the five jobs in the order we do them." },
    3: {
      question: "The pump comes lifted up inside the tank. What do we do?",
      options: ["Leave it. The water will find it", "Take off the packing and put the pump down low"],
      feedback: [
        "A lifted pump can't pull up water. Then the yCubes stay dry!",
        "Yes! The pump has to sit low in the water to work.",
      ],
    },
    4: {
      question: "We twisted a column to lock it, and now the black arrows don't line up. What happened?",
      options: ["Oops! Untwist it and start over", "Nothing is wrong. That's how a locked column looks"],
      feedback: [
        "It's okay! The arrows line up before the twist, then move apart when the column locks.",
        "Yes! Line up the arrows, twist, and they move apart once it's locked.",
      ],
    },
    5: {
      title: "Little problems to watch for",
      body: [
        "Bent hose: a kinked hose blocks the water. Gently straighten it.",
        "Loose connector: push it on all the way before twisting.",
        "Slots face front: every open slot should face the front.",
        "Light bar: take off any tape and peel the film off the camera.",
      ],
      tip: "A grown-up turns the tower off before unplugging the light bar.",
    },
    6: {
      question: "How much water goes in the first time?",
      options: ["4 gallons, all the way to the top", "2 gallons", "3 gallons"],
      feedback: [
        "Close, but the first fill is only 2 gallons.",
        "Yes! 2 gallons of tap water goes in first.",
        "Older directions said 3, but now it's 2 gallons.",
      ],
    },
    7: {
      question: "New yCubes go in today. Do they get plant food?",
      options: ["Yes, a big scoop to start", "No. Just water until Kelby says it's time"],
      feedback: [
        "Not yet! Plant food waits while the seeds wake up.",
        "Yes! Seeds bring their own food at first. Kelby tells us when to start plant food.",
      ],
    },
    8: {
      title: "Turn it on and plant!",
      body: [
        "A grown-up checks that the pump is down low, plugs in the tower, and flips the switch ON.",
        "We twist a yPod into each slot, then press a yCube into each yPod.",
        "Empty slots get a cap to keep light and dirt out.",
      ],
    },
  },

  connect: {
    0: {
      title: "Why get the tower online?",
      body: [
        "Kelby is a helper in the Gardyn app. The camera on the light bar lets Kelby see our plants.",
        "Kelby tells us when to feed, thin and harvest, and keeps the lights and water on a schedule.",
      ],
    },
    1: {
      question: "Which Wi-Fi can our tower use?",
      options: ["Any Wi-Fi at all", "A 2.4 GHz Wi-Fi that has a password", "Wi-Fi with no password"],
      feedback: [
        "Our tower can only use 2.4 GHz Wi-Fi.",
        "Yes! It needs 2.4 GHz and a password.",
        "The tower can't join Wi-Fi that has no password.",
      ],
    },
    2: { body: "Tap the one that fits us." },
    3: {
      title: "Join the Wi-Fi",
      body: [
        "A grown-up downloads the Gardyn app, signs in, and waits about 5 minutes after turning the tower on.",
        "The app shows them how to join our Wi-Fi. Passwords are picky about capital letters!",
      ],
      tip: "Starting over? Hold the silver button until the lights blink three times.",
    },
    4: {
      question: "Joining the Wi-Fi didn't work. What do we try first?",
      options: [
        "Hold the silver button until the lights blink 3 times, then check the password",
        "Unplug the light bar while the tower is on",
        "Switch to 5 GHz for faster Wi-Fi",
      ],
      feedback: [
        "Yes! Then try again. A grown-up can also restart the tower or move it closer to the router.",
        "Never unplug the light bar while the tower is on. Try the silver button first.",
        "Our tower can only use 2.4 GHz.",
      ],
    },
    5: {
      title: "If it goes offline",
      body: [
        "A grown-up presses the silver button to make sure the tower has power. Then they open the app and tap Reconnect.",
        "If the Wi-Fi name or password changed, the tower needs to join again.",
      ],
      tip: "After summer break, we might need to join the Wi-Fi again.",
    },
  },

  "ph-basics": {
    0: {
      title: "pH and plant roots",
      body: [
        "pH tells us how sour water is. Vinegar is very sour, baking soda water is soapy, and plain water is right in the middle at 7.",
        "Plants like their water just a little sour, around 5.5 to 6.5. If the pH drifts too far, roots can't pick up their food.",
      ],
    },
    1: { body: "Slide the dot to see how a plant feels at each pH. Find the zone plants like best!" },
    2: {
      question: "Do we have to test our tower's pH every week?",
      options: ["Yes, or the plants will starve", "No! Gardyn's plant food and HydroBoost keep it just right"],
      feedback: [
        "Nope! Gardyn's plant food and HydroBoost keep it in range for us.",
        "Yes! Testing is just fun science, not a chore.",
      ],
    },
    3: {
      question: "We want to test the tank water. How do we do it?",
      options: [
        "Dip the test strips right into the tank",
        "Scoop some water into a cup and test the cup",
        "Pour vinegar in the tank to see what happens",
      ],
      feedback: [
        "Never test in the tank! Whatever goes in reaches every plant.",
        "Yes! Test the cup, then pour it out.",
        "That would change the water for every plant. We only experiment with cups!",
      ],
    },
    4: {
      question: "Each step on the pH scale is 10 times bigger. How much more sour is pH 5 than pH 6?",
      options: ["A tiny bit more", "10 times more", "2 times more"],
      feedback: [
        "Whoa, it's bigger than that! Each step is 10 times.",
        "Yes! A small change in the number is a big change in the water.",
        "Each step is 10 times, not 2.",
      ],
    },
    5: {
      title: "Try it in class",
      body: ["Your teacher has pH labs where we can test things safely. Ask about them!"],
    },
  },

  troubleshoot: {
    0: {
      title: "Look first, then fix",
      body: [
        "Most tower problems come from the water, the tank, the room, light on the rockwool, or bugs.",
        "Look closely and name what we see. Not everything strange is a bug!",
      ],
    },
    1: { body: "Open at least three problems to see what might be wrong and how to fix it." },
    2: {
      question: "We see white fuzz on three yCubes. Are those plants safe to eat?",
      options: ["Yes! It's a harmless mold on the rockwool", "No! Throw the plants away"],
      feedback: [
        "Yes! A grown-up can treat it and add more airflow, but the plants are safe to harvest.",
        "The fuzz doesn't hurt the plants or make them unsafe to eat.",
      ],
    },
    3: {
      question: "A brand-new tower has a full tank, but the yCubes are dry. What's the most likely problem?",
      options: [
        "The plants need food",
        "The pump is still lifted, or a hose is loose or bent",
        "The light is too bright",
      ],
      feedback: [
        "Food doesn't move water. Dry yCubes mean water isn't getting there.",
        "Yes! Check the pump, push each hose on all the way, and straighten bent hoses.",
        "Light doesn't stop water. Check the pump and hoses.",
      ],
    },
    4: {
      question: "The room is hot and sticky. What problems are more likely?",
      options: ["Mold, yucky roots and tiny flies", "None! Plants love heat"],
      feedback: [
        "Yes! Warm, damp air invites mold, root rot and gnats.",
        "Too hot and sticky isn't good for plants. Mold, yucky roots and gnats can show up.",
      ],
    },
    5: {
      title: "Still stuck?",
      body: [
        "Ask your teacher for help.",
        "Teachers can send photos to Gardyn or ask other teachers in Growing Minds Q & A.",
      ],
    },
  },

  experiment: {
    0: {
      title: "Our tower is a science lab!",
      body: [
        "We have 16 spots, and some get more light than others. Plants grow in just a few weeks. That's perfect for an experiment!",
        "Light helps plants make food. Heat and wet air matter too. Each one is something we can test.",
      ],
    },
    1: { body: "Tap a question to see how to test it." },
    2: {
      question: "We're testing Low light vs. High light for lettuce. What stays the same?",
      options: [
        "The plant type, the planting day, and the water they share",
        "Only the plant type",
        "Nothing. It's all one tower",
      ],
      feedback: [
        "Yes! Only the light should be different, so we know the light made the difference.",
        "Planting on different days would change the results too. Keep everything the same except light.",
        "Sharing a tower helps, but the plant type and planting day still need to match.",
      ],
    },
    3: {
      question: "How many plants go in each group?",
      options: ["Just one in each group", "A few in each group, so we can compare"],
      feedback: [
        "One plant could be a fluke! A few plants make a fairer test.",
        "Yes! Two or three plants in each group makes our results more trustworthy.",
      ],
    },
    4: {
      question: "We want to try adding something new to the water. Where do we test it?",
      options: ["In the tower's tank, to see what happens to real plants", "In a cup or a separate test, never in the tower's tank"],
      feedback: [
        "Whatever goes in the tank reaches all 16 plants. We never experiment in the tank!",
        "Yes! The tower is shared by all 16 plants.",
      ],
    },
    5: {
      title: "Let the app keep our data",
      body: [
        "The Tracker remembers which plant is in which spot and the day we planted it.",
        "The Harvest Log is where we weigh each harvest in grams and add our team name.",
      ],
      tip: "Take a photo from the same spot every week. A photo series makes a great results slide!",
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
