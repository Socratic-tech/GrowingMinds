// Learn guides, part 2: setup, Wi-Fi/Kelby, roots, troubleshooting and a
// student experiment. Same format as tutorials.js, plus these step types
// (see src/components/learn/Activities.jsx):
//   checklist – tap every item to check it off
//   order     – tap steps in the right order
//   explore   – open cards to read more; `need` of them unlocks the step
//   roots     – sort root samples into healthy / needs help
//
// Care facts follow the Gardyn Help Center (linked in each guide's
// `sources`). Lines marked "Growing Minds tip" are our own advice.

export const MORE_GUIDES = [
  /* ─── Beginner: unbox & assemble ─────────────────────────── */
  {
    id: "setup",
    level: "beginner",
    title: "Unbox & assemble your Studio",
    blurb: "Check the parts, build it in the right order, and dodge the snags that cause dry yCubes later.",
    icon: "📦",
    minutes: 6,
    sources: [
      { label: "Gardyn: Meet your Gardyn Studio", url: "https://help.mygardyn.com/en/articles/1804033" },
      { label: "Gardyn Studio, Step 1: Unpacking", url: "https://help.mygardyn.com/en/articles/1804097" },
      { label: "Step 3: Assemble & Connect the Columns", url: "https://help.mygardyn.com/en/articles/1804225" },
      { label: "Step 5: Fill Tank & Turn On", url: "https://help.mygardyn.com/en/articles/1804353" },
    ],
    steps: [
      {
        type: "info",
        title: "Pick the spot first",
        body: [
          "Put the Studio indoors, near an outlet, where the Wi-Fi signal is decent and air can move around it.",
          "Gardyn's ideal room is 68–80°F with 50–70% humidity. A spot right next to a heater vent, a drafty door or a sunny window works against you.",
          "The Studio comes with two safety straps. Strap it to the wall, into a wood stud when you can, so it can't tip in a busy classroom.",
        ],
        tip: "Check the Wi-Fi at that exact spot before you build. The Studio needs a 2.4 GHz network (the next guide explains).",
      },
      {
        type: "checklist",
        title: "Check the box",
        body: "Unpack and tap each part as you find it.",
        items: [
          "Water tank (holds 4 gallons)",
          "Lid (handle it carefully: it has metal connectors on its lower blade)",
          "2 columns with 16 slots in all (the last two modules on each come unattached: that's normal)",
          "LED light bar with the camera",
          "Upper structure parts: upper blade, metal rod, connector plates, plugs and a measuring spoon",
          "16 yPods",
          "Welcome kit: 16 pre-seeded yCubes, with plant food underneath",
          "Power supply",
          "2 safety straps",
        ],
      },
      {
        type: "order",
        title: "Put the build in order",
        body: "Tap the five stages in the order you'll do them.",
        items: [
          "Mount and lock the lid on the tank, and lower the pump",
          "Connect the columns' hoses and twist the columns into the lid",
          "Attach the light bar and the upper blade",
          "Fill with water and turn it on",
          "Put in yPods and yCubes, and cap the empty slots",
        ],
      },
      {
        type: "quiz",
        question: "The pump ships raised up inside the tank, held by transport packing. What do you do?",
        options: [
          { text: "Leave it; the water will reach it", feedback: "A raised pump can't pull water. That's one of the most common reasons a new tower's yCubes stay dry." },
          { text: "Remove the transport packing and lower the pump into place", correct: true, feedback: "Right. Gardyn has you lower the pump when you mount the lid, and check it again before you turn the tower on." },
        ],
      },
      {
        type: "quiz",
        question: "You pushed the hose connector on and twisted a column to lock it. Now the black arrows don't line up. What happened?",
        options: [
          { text: "Something's wrong. Untwist it and start over", feedback: "It's fine. The arrows line up before you twist, and move apart once the column locks." },
          { text: "Nothing: that's how a locked column looks", correct: true, feedback: "Right. Line the arrows up, twist, and when it's fully locked they no longer match." },
        ],
      },
      {
        type: "info",
        title: "The snags that cause trouble later",
        body: [
          "Kinked hose: before you connect a column, gently pull the end of its irrigation hose so it runs straight. A kink or loop blocks water to the top slots.",
          "Loose connector: push the hose connector all the way on, until it's flush with the bottom of the column base, before you twist.",
          "Slots facing backward: make sure every open slot faces the front of the lid.",
          "Light bar: remove any tape, slide the bulb plastic so it lines up with the ends of the LED strip, and peel the film off the camera.",
        ],
        tip: "Always turn the tower off before you unplug the light bar.",
      },
      {
        type: "quiz",
        question: "How much water goes in for the first fill?",
        options: [
          { text: "4 gallons: fill it to the top", feedback: "The tank holds 4, but Gardyn's Studio setup calls for 2 gallons on the first fill." },
          { text: "2 gallons", correct: true, feedback: "Right. Pour 2 gallons of tap water in through the lid opening, then put the cover back." },
          { text: "3 gallons", feedback: "Older instructions said 3. Gardyn has updated the Studio setup to 2 gallons." },
        ],
      },
      {
        type: "quiz",
        question: "Brand-new yCubes are going in today. Do you add plant food?",
        options: [
          { text: "Yes, a full dose so they get a strong start", feedback: "Gardyn says never add plant food while new yCubes are germinating." },
          { text: "No. Water only, until Kelby says it's time to feed", correct: true, feedback: "Right. Seeds carry their own food at first. Kelby tells you when to start plant food." },
        ],
      },
      {
        type: "info",
        title: "Turn it on and plant",
        body: [
          "Check the pump is lowered and the main switch on the back of the tank is OFF. Plug the power supply into the Studio first, then into the wall, and flip the switch ON. After a few minutes the light blinks: it's ready for Wi-Fi.",
          "Twist a yPod into each slot you're planting until it sits flush. Remove the transport cardboard from each yCube and press it into its yPod until it's flush.",
          "Cover every empty slot with a Gardyn Cap, so light and debris stay out of the columns.",
        ],
        tip: "Never use a Studio power supply on a Gardyn Home. Next up: connecting to Wi-Fi and Kelby.",
      },
    ],
  },

  /* ─── Beginner: Wi-Fi & Kelby ────────────────────────────── */
  {
    id: "connect",
    level: "beginner",
    title: "Connect to Wi-Fi & Kelby",
    blurb: "Get the tower online so Kelby can send feeding and thinning reminders, including what to ask for on school Wi-Fi.",
    icon: "📱",
    minutes: 4,
    sources: [
      { label: "Gardyn: Troubleshooting Pairing Issues", url: "https://help.mygardyn.com/en/articles/1772033" },
      { label: "Gardyn: How to Re-Pair After Losing Connection", url: "https://help.mygardyn.com/en/articles/1771905" },
    ],
    steps: [
      {
        type: "info",
        title: "Why connect it?",
        body: [
          "Kelby is Gardyn's assistant in the Gardyn app. The camera on the light bar lets Kelby see your plants.",
          "Once the tower is paired, Kelby tells you when to start plant food, when to thin and when to harvest, and runs the lights and watering on schedule.",
        ],
      },
      {
        type: "quiz",
        question: "Which Wi-Fi network can a Gardyn join?",
        options: [
          { text: "Any network, 2.4 GHz or 5 GHz", feedback: "Gardyn can only pair on the 2.4 GHz band. It can't see 5 GHz networks." },
          { text: "A 2.4 GHz network that has a password", correct: true, feedback: "Right. 2.4 GHz only, and the network must have a password." },
          { text: "An open network with no password", feedback: "Gardyn can't connect to networks without a password." },
        ],
      },
      {
        type: "explore",
        title: "Where is your tower?",
        body: "Tap the one that fits you.",
        need: 1,
        cards: [
          {
            icon: "🏫",
            label: "At school",
            text: [
              "School Wi-Fi is the most common snag. Networks that ask for a username as well as a password, or that open a sign-in page in the browser, usually won't work for a device like the Gardyn.",
              "Before setup day, ask your district tech team for a 2.4 GHz, password-protected network for devices (often called an IoT or device network). Tell them where the tower will sit so they can check the signal there.",
            ],
            note: "Growing Minds tip: Gardyn's help pages don't cover school networks.",
          },
          {
            icon: "🏠",
            label: "At home or on a simple network",
            text: [
              "Use the 2.4 GHz network. If your router puts 2.4 and 5 GHz under one name, Gardyn suggests making a 2.4 GHz guest network, or using a Wi-Fi extender.",
            ],
          },
          {
            icon: "🤔",
            label: "Not sure",
            text: [
              "Stand where the tower will go and open your phone's Wi-Fi details: many phones show the band (2.4 GHz or 5 GHz).",
              "If joining the network needs a username or a sign-in page, treat it like school Wi-Fi and ask your tech team.",
            ],
          },
        ],
      },
      {
        type: "info",
        title: "Pair it in the app",
        body: [
          "Download the Gardyn app and sign in. Wait about 5 minutes after turning the tower on.",
          "Follow the app's pairing steps: your phone first joins the tower's temporary network (named Gardyn plus four characters), then you pick your Wi-Fi and type its password, then the app claims the tower.",
          "Passwords are case-sensitive, so check capital letters.",
        ],
        tip: "For every new try, put the tower back in pairing mode: press and hold the silver button until the lights blink three times.",
      },
      {
        type: "quiz",
        question: "Pairing failed. What do you try first?",
        options: [
          { text: "Put it back in pairing mode (hold the silver button until the lights blink 3 times) and re-check the password", correct: true, feedback: "Right. Then try again. If it still fails: reboot the tower (off 30 seconds, then on), move closer to the router, and update your phone and the app." },
          { text: "Unplug the light bar while it's on", feedback: "Never unplug the light bar while the tower is on, and it isn't the cause. Start with pairing mode and the password." },
          { text: "Switch to a 5 GHz network for a faster connection", feedback: "Gardyn can only use 2.4 GHz." },
        ],
      },
      {
        type: "info",
        title: "If it drops offline later",
        body: [
          "Press the silver button to check the tower has power. Then open the app and choose Reconnect.",
          "If the Wi-Fi name or password changed, you'll pair it again. After a power or Wi-Fi outage, the lights blink twice as it reconnects.",
        ],
        tip: "Growing Minds tip: a new school network or a summer shutdown often means re-pairing in the fall.",
      },
    ],
  },

  /* ─── Intermediate: roots ────────────────────────────────── */
  {
    id: "roots",
    level: "intermediate",
    title: "Root checks & trimming",
    blurb: "Spot healthy and unhealthy roots, trim crowded pods, and keep the columns flowing.",
    icon: "🪴",
    minutes: 5,
    sources: [
      { label: "Gardyn: How to Check & Trim (Prune) Roots", url: "https://help.mygardyn.com/en/articles/1771393" },
    ],
    steps: [
      {
        type: "info",
        title: "Why check roots?",
        body: [
          "Roots hang inside the column, where water flows past them. As plants mature, roots grow fast and can block drainage or wrap the irrigation tube.",
          "Check mature plants every week. Young plants (1–2 months old) rarely need trimming, because their roots are still developing.",
        ],
      },
      {
        type: "info",
        title: "How to take a look",
        body: [
          "Pull the whole yPod straight out of its slot. Don't separate the yCube from the yPod.",
          "If roots are stuck inside the column, ease them out with Gardyn tweezers.",
          "Have clean scissors (wipe them between plants) and a small bowl for trimmings.",
        ],
      },
      {
        type: "roots",
        title: "Healthy, or needs help?",
        body: "Sort each root sample.",
      },
      {
        type: "quiz",
        question: "Part of a root is brown, slimy and smells rotten. What do you do?",
        options: [
          { text: "Pinch off the rotting part and throw it away", correct: true, feedback: "Right. That's root rot. Remove it right away, and keep up with HydroBoost to help prevent it." },
          { text: "Leave it alone; it will recover", feedback: "Root rot spreads. Gardyn says to pinch the rotting section away and throw it out." },
          { text: "Add extra plant food", feedback: "More food won't fix rot. Remove the rotting section." },
        ],
      },
      {
        type: "quiz",
        question: "A yPod is packed with roots. How do you trim it?",
        options: [
          { text: "Cut all the roots off, flush with the yPod", feedback: "That's too much at once. Gardyn recommends small, regular trims over one big cut." },
          { text: "Snip off the bottom corner of the roots at a 45° angle", correct: true, feedback: "Right. A small angled trim, done regularly, keeps roots healthy without shocking the plant." },
        ],
      },
      {
        type: "info",
        title: "Clear the column, then log it",
        body: [
          "Before you put the yPod back, use tweezers to clear roots that are blocking drainage, growing on the black irrigation tube, or reaching up to the surface inside the column.",
          "Twist the yPod back in until it sits flush, and log the root check on the Maintenance page.",
        ],
        tip: "Swiss chard and Bull's Blood beets have naturally red-purple roots, and bare-root strawberries arrive brown and lighten over time. Those are healthy.",
      },
    ],
  },

  /* ─── Advanced: troubleshooting ──────────────────────────── */
  {
    id: "troubleshoot",
    level: "advanced",
    title: "Troubleshooting: what are you seeing?",
    blurb: "Go from symptom to likely cause to fix for the problems classrooms see most.",
    icon: "🔎",
    minutes: 6,
    sources: [
      { label: "Gardyn: Troubleshooting Watering Issues", url: "https://help.mygardyn.com/en/articles/1788673" },
      { label: "Gardyn: Dried, Brown or Crispy Leaves", url: "https://help.mygardyn.com/en/articles/4414465" },
      { label: "Gardyn: White Fuzz on yCubes", url: "https://help.mygardyn.com/en/articles/1777601" },
      { label: "Gardyn: Green Algae", url: "https://help.mygardyn.com/en/articles/1777217" },
      { label: "Gardyn: Fungus Gnats", url: "https://help.mygardyn.com/en/articles/1779905" },
      { label: "Gardyn: Temperature & Humidity", url: "https://help.mygardyn.com/en/articles/1777089" },
    ],
    steps: [
      {
        type: "info",
        title: "Name it before you fix it",
        body: [
          "Most tower problems come from a few places: water flow, the tank, the room, light reaching the rockwool, or pests.",
          "Look closely and name what you see first. Not everything odd is a pest!",
        ],
      },
      {
        type: "explore",
        title: "What are you seeing?",
        body: "Open at least three symptoms to see the likely cause and the fix.",
        need: 3,
        cards: [
          {
            icon: "🏜️",
            label: "Dry yCubes or wilting plants",
            cause: "Water isn't reaching the pods.",
            text: [
              "Turn Watering on in the app and listen or feel for the pump for 5 minutes.",
              "On a new tower, check the pump was lowered out of its shipping position.",
              "Push each hose connector flush at the column base, and straighten kinked hoses.",
            ],
          },
          {
            icon: "☁️",
            label: "White fuzz on the rockwool",
            cause: "A harmless mold. The plants are still safe to grow and eat.",
            text: [
              "Lightly spray the rockwool with 3% hydrogen peroxide (go easy on seedlings).",
              "Add airflow with a small fan, handle the plants less, and put yCovers on after thinning.",
            ],
          },
          {
            icon: "🟢",
            label: "Green tint or moss on the rockwool",
            cause: "Algae, which needs light, water and nutrients.",
            text: [
              "Block the light: yCovers on yCubes once they have true leaves, and Gardyn Caps on every empty slot.",
              "Keep using HydroBoost, and clean per Gardyn's cleaning guide if it gets heavy.",
            ],
          },
          {
            icon: "🍂",
            label: "Crispy brown leaf tips",
            cause: "Usually the tank (skipped top-offs or refreshes, the wrong food) or dry air.",
            text: [
              "Top off and refresh on schedule, and use only Gardyn plant food, fully dissolved.",
              "Aim for 50–75% humidity in the room; a humidifier helps if it stays dry.",
            ],
          },
          {
            icon: "💛",
            label: "Lower leaves turning yellow and dropping",
            cause: "Usually a sign it's harvest time.",
            text: [
              "Harvest outer leaves, leaving at least a third of the plant. Frequent harvests bring new growth.",
              "Fruiting plants dropping lower leaves is normal: they're putting energy into the top.",
            ],
          },
          {
            icon: "🦟",
            label: "Tiny flies around the tower",
            cause: "Likely fungus gnats. Adults are a nuisance; their larvae live in the rockwool.",
            text: [
              "Yellow sticky traps catch adults.",
              "Treat the rockwool surface with an organic spray as Gardyn's gnat guide describes, repeating every 3 days.",
            ],
          },
          {
            icon: "🤎",
            label: "Brown, slimy, smelly roots",
            cause: "Root rot.",
            text: ["Pinch away the rotting part and keep up with HydroBoost. The Root checks guide walks through it."],
          },
          {
            icon: "🥶",
            label: "Seeds slow to sprout",
            cause: "Often a room that's too cold or dry.",
            text: ["Sprouts like 65–75°F and 65–75% humidity. Watch out for weekend and holiday heat setbacks."],
          },
        ],
      },
      {
        type: "quiz",
        question: "Students spot white fuzz on three yCubes. Are those plants still safe to eat?",
        options: [
          { text: "Yes. It's a harmless mold on the rockwool", correct: true, feedback: "Right. Treat it with a light peroxide spray and more airflow, but the plants are safe to harvest." },
          { text: "No. Pull the plants and throw them out", feedback: "Gardyn says the white fuzz doesn't harm plants or make them unsafe to harvest." },
        ],
      },
      {
        type: "quiz",
        question: "A brand-new tower has a full tank, but the yCubes are dry. What's most likely?",
        options: [
          { text: "The plants need plant food", feedback: "Food doesn't move water. Dry yCubes mean water isn't reaching them." },
          { text: "The pump wasn't lowered, or a hose isn't connected or is kinked", correct: true, feedback: "Right. Check the pump position, reseat each connector, and straighten hoses." },
          { text: "The light is too bright", feedback: "Light doesn't stop water flow. Check the pump and hoses." },
        ],
      },
      {
        type: "quiz",
        question: "The room runs hot and humid. Which problems become more likely?",
        options: [
          { text: "Mold, root rot and fungus gnats", correct: true, feedback: "Right. Warm, damp air slows evaporation and invites mold, rot and gnats. Heat can also make plants bolt." },
          { text: "None. Plants love heat", feedback: "Too hot and humid slows water and nutrient uptake and invites mold, root rot and gnats." },
        ],
      },
      {
        type: "info",
        title: "Still stuck?",
        body: [
          "Email Gardyn support at support@mygardyn.com with photos and what you've tried.",
          "Or post a photo in Growing Minds Q & A: someone in the network has probably seen it before.",
        ],
      },
    ],
  },

  /* ─── Advanced: student experiment ───────────────────────── */
  {
    id: "experiment",
    level: "advanced",
    title: "Run a student experiment",
    blurb: "Turn your 16 slots into a fair test, with the Tracker and Harvest Log collecting the data.",
    icon: "🔬",
    minutes: 5,
    sources: [
      { label: "Gardyn: yCube Placement Guide", url: "https://help.mygardyn.com/en/articles/1776961" },
      { label: "Gardyn: How Does the Environment Impact Plants' Growth?", url: "https://help.mygardyn.com/en/articles/1776833" },
    ],
    steps: [
      {
        type: "info",
        title: "Your tower is a lab",
        body: [
          "16 slots, a light map with Low, Medium and High slots, and plants that grow in weeks: that's everything a fair test needs.",
          "Light is the on/off switch for photosynthesis, and temperature and humidity act like a volume knob. Each makes a good variable to explore.",
        ],
      },
      {
        type: "explore",
        title: "Pick a question to test",
        body: "Tap a question to see how to set it up.",
        need: 1,
        cards: [
          {
            icon: "💡",
            label: "Does light level change how fast lettuce grows?",
            text: [
              "Change: put lettuce in Low slots and in High slots.",
              "Measure: leaf count each week, and grams at harvest.",
              "Keep the same: plant type, planting day, and the water they share.",
            ],
          },
          {
            icon: "✂️",
            label: "Does keeping 1 or 3 sprouts change a basil harvest?",
            text: [
              "Change: thin some basil pods to 1 sprout and others to 3.",
              "Measure: grams harvested per pod over the season.",
              "Keep the same: slot light level, planting day and harvest schedule.",
            ],
          },
          {
            icon: "🏁",
            label: "Which green grows fastest?",
            text: [
              "Change: plant several kinds of greens on the same day, in same-light slots.",
              "Measure: days until each one sprouts, and until its first harvest.",
              "Keep the same: light level, planting day and care.",
            ],
          },
        ],
      },
      {
        type: "quiz",
        question: "In a Low-light vs High-light lettuce test, what has to stay the same?",
        options: [
          { text: "The plant type, the planting day, and the water they share", correct: true, feedback: "Right. Only the light should differ, so any difference comes from the light." },
          { text: "Only the plant type", feedback: "Planting on different days would also change the results. Keep everything the same except light." },
          { text: "Nothing: it's all one tower", feedback: "The shared tower helps, but plant type and planting day still need to match." },
        ],
      },
      {
        type: "quiz",
        question: "How many pods should go in each group?",
        options: [
          { text: "One in each group is enough", feedback: "One plant can be a fluke. With a few pods per group you can compare averages." },
          { text: "Several in each group, so you can compare averages", correct: true, feedback: "Right. Two or three pods per group makes the results much more trustworthy." },
        ],
      },
      {
        type: "quiz",
        question: "Students want to test adding something new to the water. Where do they test it?",
        options: [
          { text: "In the tower's tank, to see the effect on real plants", feedback: "Everything in the tank reaches every plant in the tower. Never experiment in the reservoir." },
          { text: "On a sample or a separate setup, never in the tower's tank", correct: true, feedback: "Right. The tower is shared by all 16 plants." },
        ],
      },
      {
        type: "info",
        title: "Let the app collect the data",
        body: [
          "Tracker: record which slot got which plant, and the planting day. Harvest Log: weigh each harvest in grams and tag the student team.",
          "Lesson Lab has investigation templates for the write-up, and Library → Lesson plans has ready-made units.",
        ],
        tip: "Take a photo from the same spot each week. A photo series makes a great results slide.",
      },
    ],
  },
];
