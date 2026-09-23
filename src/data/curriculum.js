// Growing Minds curriculum — the team's lesson plans in Google Drive.
// Source folder: "Growing Minds Lesson Plans & Activities"
//   https://drive.google.com/drive/folders/1sXswXL065j448WCYPSl3XPP5ToW_bVTe
//
// Files stay in Drive; the app just links to them, so edits the team makes
// in Drive show up automatically. To add a lesson, add an entry below with
// the file's Drive id (the long code in its share link).
//
// Where Drive had two versions of the same lesson, the most recently
// modified one is listed (Sept 2026). Resource kinds: slides, journal,
// guide, activity, lab, reading, key, pdf.

export const GRADE_BANDS = [
  { id: "k1", label: "K–1" },
  { id: "23", label: "2–3" },
  { id: "45", label: "4–5" },
  { id: "ms", label: "Middle" },
  { id: "hs", label: "High" },
];

export const DRIVE_ROOT = "1sXswXL065j448WCYPSl3XPP5ToW_bVTe";

export const driveUrl = (id) => `https://drive.google.com/open?id=${id}`;

export const KIND_META = {
  slides:   { icon: "📽️", label: "Slides" },
  journal:  { icon: "📓", label: "Student journal" },
  guide:    { icon: "🧑‍🏫", label: "Teacher guide" },
  activity: { icon: "✏️", label: "Student activity" },
  lab:      { icon: "🧪", label: "Lab sheet" },
  reading:  { icon: "📖", label: "Reading" },
  key:      { icon: "🔑", label: "Answer key" },
  pdf:      { icon: "📄", label: "PDF" },
};

const r = (kind, id, label) => ({ kind, id, label: label || KIND_META[kind].label });

export const UNITS = [
  {
    id: "getting-started",
    title: "Getting to Know Your Gardyn",
    subject: "Start here",
    bands: ["k1", "23", "45", "ms", "hs"],
    summary: "Introductory slide decks for the first day with your Gardyn, by grade level.",
    lessons: [
      { title: "Elementary sample", bands: ["k1", "23", "45"], resources: [r("pdf", "1KBoqGzjJUhIguoErv5EGTNPXFgbNlv0q", "Slides (PDF)")] },
      { title: "Middle school sample", bands: ["ms"], resources: [r("pdf", "18ORoig8x3FqUaOJj8BH3Ps-tYx6LcRif", "Slides (PDF)")] },
      { title: "High school sample", bands: ["hs"], resources: [r("pdf", "1qECye12DFWgEdyh2Zx6AjwtMDWNU154L", "Slides (PDF)")] },
    ],
  },
  {
    id: "k1",
    title: "K–1 Growing Minds",
    subject: "Life science",
    bands: ["k1"],
    folder: "1wfMpindryhbWBXsRoJ5oYyTf1nmc65j5",
    guides: [
      r("guide", "1mQFmDdGrv_Nfa8EagovBBtGJgSg5WESgG2Q-GSRMyjQ", "K–1 Teacher Edition"),
      r("activity", "10oi8GgLDy-lShoLPqze6KdRcSPMqXwBgwgmkVtB79pE", "Health Check handout"),
    ],
    lessons: [
      { n: 1, title: "The Tiny Sleeping Seed", resources: [r("slides", "1E7VpKHsQpYSbKPDX5-xSko_xtYmphsOkYP2k-J70xDQ"), r("journal", "1gvVM1QCRFwaSOAjCOsaklGDlvSSYOQ_F")] },
      { n: 2, title: "The Plant's New House", resources: [r("slides", "18gtC9ddooLdC6bk62050sdnQIhZewnNkBEwnadVfG64"), r("journal", "1_04hg9oIA2SAsFMneEo3YNm50HzwXNVf")] },
      { n: 3, title: "Meet the Plant Parts", resources: [r("slides", "1ETqyotbxmGNn0zhLy_QiRPSvppFeqsEG1DHo2v4vhog"), r("journal", "1yZAsopYLuO3qO9MbeNpC306qGbRsgUMF")] },
      { n: 4, title: "Reaching for the Light", resources: [r("slides", "1djOgJ8bV25Y3nQGGAHm2M14ib5GygCihhSvbmFAmYk0"), r("journal", "1lUgGf2h1kGd55mIjUYWqaPePDhj5sn2R")] },
      { n: 5, title: "From Tower to Tummy", resources: [r("slides", "10jWV3NZ4QZtfYzpexdqK3DWxsou_OsK-bQOpQo1FRFE"), r("journal", "185UEL5HwqVHYFzvEkokWLGiI8Xjl_wtu")] },
    ],
  },
  {
    id: "23",
    title: "Grades 2–3 Growing Minds",
    subject: "Life science & engineering",
    bands: ["23"],
    folder: "10QvcLKmF-KBP6F-GXwiJb4AsUFyU53y0",
    guides: [
      r("guide", "1KQknx_R58iANBGofgPTJ94KdSriYFqIXFZWY2XRaqRM", "Grades 2–3 Teacher Guide"),
      r("activity", "1vOfKBIi8-cNjKY9EJw6-G5UMiUHreObx5lQ6_8Jy2vk", "Health Check handout (2–5)"),
    ],
    lessons: [
      { n: 1, title: "Engineering a Farm in the Classroom", resources: [r("slides", "1SrVzUJ38PGdOCd78WhJ2UOwcGYv9X6-TKhiIp3N1ONo"), r("journal", "1e6YXoUU3N_6w6vj21luzGrUUN579itLI")] },
      { n: 2, title: "Rockwool vs. Soil", resources: [r("slides", "1PdrGXhUWHr-kweL87eFrpGoRILa8LQQSaTqNqYo2Zrc"), r("pdf", "1mx0YpJgJtUN7VN5-cW3B90YtfLB9qEgz", "Printable PDF")] },
      { n: 3, title: "The Internal Highway (Celery Lab)", resources: [r("slides", "1ChJyO8x_5eswinNnjCe7IO4bQDBBF84M2mly7Oi6vGo"), r("journal", "1SRKHnMxHrFLgtxUSKfb1o7X1OLHkNlAw", "Student journal + celery lab")] },
      { n: 4, title: "Great Light Chasers", resources: [r("slides", "1pSl9oc-Z1yCrnO6CAZaXHOsKc8nLO27xs-qlzdS20-Y"), r("journal", "15XySRmsjaLoT8fOWAg1nW8IGbke1uCR_")] },
      { n: 5, title: "The Seed to Salad Tasting Lab", resources: [r("slides", "1-SnDIJrvY67XBqxfuPq6TtRloZhRP5dMlPtgAgXCYHY"), r("journal", "1N_ZvSLJRSd-x-TnAIZ6dT_MiQSdNSE8L")] },
    ],
  },
  {
    id: "45",
    title: "Grades 4–5 Growing Minds",
    subject: "STEM",
    bands: ["45"],
    folder: "1XdGtOVLYbmVtnbOZy0EQFihZJSx7w_F9",
    guides: [
      r("activity", "1hVYNgsWK4ylE33TdMzxI_qQzCqSEgmab", "Student activity pages (Lessons 2–5)"),
      r("activity", "1vOfKBIi8-cNjKY9EJw6-G5UMiUHreObx5lQ6_8Jy2vk", "Health Check handout (2–5)"),
    ],
    lessons: [
      { n: 1, title: "The Dirt-Free Mystery", resources: [r("slides", "1iegHZDamGaQGotLHpdN12KiqUzlJwD593OaZJ6kpin4"), r("guide", "1LIJ2MTpKpRX5wWOxJbkTsZqrprQyL76OaboSuFwiLvU"), r("journal", "14uxTcQ-Pcn3Vsaqr_wlskxL2QNsgFKrP", "Hydroponic Explorers journal")] },
      { n: 2, title: "Light Energy & the Sun", resources: [r("slides", "1gzVmM2psddxM3ze42cXkuA9YBGOpzbPiBNfYIlIMUcU")] },
      { n: 3, title: "Water Testing", resources: [r("slides", "1E9y5JIVp-tlj71NqNkaG20ZmzqB7dZLRPkJLLOoNAW0")] },
      { n: 4, title: "Math Growth Race", resources: [r("slides", "17MySg24riPhV-WEM2mmJgbTmjVT1szkgAf-GjQV_lho")] },
      { n: 5, title: "Harvest Tech and Food", resources: [r("slides", "1TJBCtDtHXK0NLUKjJdy2DXSU5Tgvc0nVwjn0EjCaTyo")] },
    ],
  },
  {
    id: "ms",
    title: "Middle School Growing Minds",
    subject: "Life & physical science",
    bands: ["ms"],
    folder: "1V90k92pALj4MZuJE232uXpmFd11ROX3U",
    guides: [
      r("guide", "1MeV3huos3XkxnTfgCZdrhUmRQRxI1dQS", "Gardyn Studio Teacher Sequence Guide"),
      r("activity", "1FTQG3LoC5fZAkAOKG6Akyjf9cKnisecP5Xqo7AVKbK4", "Health Check handout"),
    ],
    lessons: [
      { n: 1, title: "Hydroponics Systems", resources: [r("slides", "1GXZCbBRkAZ_AIxtOzlIOygymMGtqcXaW"), r("activity", "1RGY5EWua7yDtfFxTbndn9hsb8GUPw8BA", "System Detective activity")] },
      { n: 2, title: "Germination Variables", resources: [r("slides", "1c87aaKyjcdensuZg96cJx1razZ92KxOW"), r("activity", "1d8rZgKYYs1zfdIgIyWIlH4Pojm1Oed9o", "Sprout Survey activity")] },
      { n: 3, title: "Roots, Water & Nutrients", resources: [r("slides", "1PKOuI-ot-sVcAb9RblCKDPsRFvi0T67z"), r("activity", "1jITlA2Bvv8Nwi4zg0aR4axv6m7vYUvOd")] },
      { n: 4, title: "Photosynthesis & Growth Data", resources: [r("slides", "15gkWtTdtAdx5fkg_ZN8xu5pwXLPeX7I2"), r("activity", "1zOU9errQ8xxGUATjFona_CQJVCCIEh1q")] },
      { n: 5, title: "Harvest, Taste & Food Systems", resources: [r("slides", "13bUo5VDkPmmH4v1L4snf-r_u85nA0HAd"), r("activity", "1YuS_2YEmZIpjNeNclVpTa6pMbpWlzh5v")] },
    ],
  },
  {
    id: "ms-extras",
    title: "Middle School Labs, Art & STEAM",
    subject: "Extensions",
    bands: ["ms"],
    folder: "1V90k92pALj4MZuJE232uXpmFd11ROX3U",
    guides: [r("guide", "1MW0AaH5-UGARCJ-dW-4zlFtBeKvWDQdFTdRSBNnKdSw", "STEAM Extension Teacher Guide & Rubrics")],
    lessons: [
      { title: "STEAM: Freshness Freight Packaging Challenge", resources: [r("slides", "1Xei8RZAFXuJJHk1Nn6Z-uW5OacO3P6uvNYrmFtVWcG8"), r("activity", "1ZcvY9VwTVk4otsfzI1i26LPr35-AbQAThpZ6PqZUCH0")] },
      { title: "STEAM: Hidden Colors Pigment Art Challenge", resources: [r("slides", "1o5isxddlTMlx9p0q7KhooWabvrE4q1Dh9gnz2Wk6Uhs"), r("activity", "1CGW05Umf9Pe_dgnx__k7kC0FlkQtWHFl-Xtn4ZKn_Gg")] },
      { title: "Plant Pigment pH Indicator", resources: [r("guide", "1lIoQfryRtv1JjOH_MG6zOJYQRURDyW9k", "Lesson plan"), r("activity", "1cXRk_DkKbTybMM0uw18zYO4ah5z0IEqm", "Worksheet"), r("key", "1lr77tHbfQcJdy70kqo8LNOx0oMEGywfW")] },
      { title: "Root Art: Structure and Function", resources: [r("guide", "1R7TUa9V5dzRAD_ZoTh5s_jgCQu-u5Bty", "Lesson plan"), r("activity", "1wP0JqPy8jj3MU0O0V7RZmER8sCAgsLKB", "Worksheet"), r("key", "1v6sQp07JXq3jsyf7IU5fnXydwXewMwzo")] },
      { title: "Hydroponic Plant Systems Inquiry Lab", resources: [r("lab", "1y-Cdw8Ogxe0ltD4E7Jp9oDC2R71K0OE_", "Inquiry lab (Diffit)")] },
      { title: "Deep Dive: Soil-Free Bio-Engineering", resources: [r("slides", "1AVo_Fck-38AQk8RJ8jfqDvy3Hl46buJb-6MiLM6iZdM")] },
      { title: "Adopt a Plant Challenge", resources: [r("pdf", "1yvJ9Z3M_Xm73BPUvCZijKRnMeWyX3unL")] },
      { title: "Composting with Gardyn", resources: [r("pdf", "1KLmYMrc9xlsdDYYL9JKQoqlws1G48-wu")] },
      { title: "Pressed Petal and Leaf Art", resources: [r("pdf", "1q9XkDpOM1wa4ouydSexL7eOOv73h6a4f")] },
      { title: "Plant Life Cycle (6th grade)", resources: [r("slides", "180ATh4dd2aZsUuU9fwsysPI5Lox-nhwK")] },
      { title: "Plants and Water (6th grade)", resources: [r("slides", "1CflnZnQfR8_TNdFUZ9GR5H4pFSLeaSwy")] },
    ],
  },
  {
    id: "hs-bio",
    title: "HS Biology",
    subject: "Biology · NGSS",
    bands: ["hs"],
    folder: "1jXsV0mLVcLRX6E6c4H5XJuxnXp6buKmA",
    guides: [r("guide", "1pBLM0hQDKNs0r5D21_f_Uefw-1oUv8Cd", "HS Biology Teacher Sequence Guide")],
    lessons: [
      { n: 1, title: "Hydroponics as a Living System", resources: [r("slides", "1BnSIK2S1zre_xDEsJcafidsWBUWcP8POp50N5puPwgY"), r("activity", "1NkxVrpCQn0cEM-KwzI1FJQPSZpZf309h", "Activity sheet"), r("activity", "1XJpyl6AuE1IsRpBmDD3oSn84Mx0Q0rXR", "Tower parts labeling sheet")] },
      { n: 2, title: "From Seed to Sprout: The Germination Race", resources: [r("slides", "1SLYlmbPrVhSRe97p5z0j3PHBbtRujFMotOaUzg9ZqAo"), r("activity", "1gy6dElK1_XqKdddSCEiQrGx1bspN3CG3", "Student guide"), r("lab", "1BNsV9Twj6fs1cI1nd9zIVyvV51l3gWRs", "Germination lab")] },
      { n: 3, title: "Roots, Water & Nutrients", resources: [r("slides", "1KgW0cuP4sJjYFsIwnFZVD15e8wjYmEPRUCq6Yfe-_uQ"), r("activity", "19-8nUo4x6wP1fW8d0FAl5UaDXIlXC7K8"), r("lab", "1f81ksv-WYen8E3ex6lRuNuC_M1chENU9", "Lab notebook")] },
      { n: 4, title: "Plants Under Pressure", resources: [r("slides", "1f4HBCWpS7Q_y4c27RFOoP1hBPjjfxkK3GH0Vyp0gkS0", "Slides (plain)"), r("slides", "1d_3lrzF9hOxVqxujLDpQMzpG_q8lCVCH", "Slides (visual NGSS)"), r("activity", "1wPfdM5Ib9TvAjochV8A0eE3YIw2ME38_"), r("lab", "16aG8TT1ZKAkVkgs9JEInDEEHZfQw-OZb", "Lab notebook")] },
      { n: 5, title: "Harvest Biology", resources: [r("slides", "1vnot9JLAubrXjI3qEeSoXEbLl3KceM1r2BE9_tI-8-0"), r("activity", "100xam1HVQRx3sJy5jd5TXDFDycVfP5SqG_ml5g_HTKU", "Student guide"), r("lab", "1RVo-na2u9WjjV0fVX321cgfXCqcqQZ_h", "Lab notebook")] },
    ],
  },
  {
    id: "hs-chem",
    title: "HS Chemistry",
    subject: "Chemistry",
    bands: ["hs"],
    folder: "1XEfcuyyFK10uDwcmVvOEkyrK-VbkuAYj",
    guides: [r("guide", "1HQaHg0UZz656F96lW1lHpcnI-HGaJp7t", "HS Chemistry Teacher Guide")],
    lessons: [
      { n: 1, title: "Water Is Chemistry", resources: [r("slides", "1AKV31OcVNlAQ2IHG2klN8OUXXkhc5dI2"), r("activity", "1l4lYy_mcrLR__CdEwUgV7OTj2sX9bfmq")] },
      { n: 2, title: "The pH Puzzle", resources: [r("slides", "1NHHU2QgHPoM3L-eWs5gtFpcXwMB14lP_"), r("activity", "1wpZu55ZZ1uTv0trdxOACZVV1IiA9cYhx")] },
      { n: 3, title: "Nutrient Reactions", resources: [r("slides", "1ulnOdgeHPZIShNwiBRftCXsTXIXkoHKv"), r("activity", "1QG8N5hcvgPOjqJUfxLe99QDBr430qrzB")] },
      { n: 4, title: "Concentration Matters", resources: [r("slides", "18rmsqH9Lp-Xg2_YRvWz5mOVp7YKD6-kK"), r("activity", "1kOBJf5iuNRg4Rf5LsEVQXnFuU4yw2jui")] },
      { n: 5, title: "Color Chemistry", resources: [r("slides", "1_Iqi1h6tBquig8NLgRBDABPbSTSNB7yC"), r("activity", "1fMO1r0FNv8qFhlB7f2ReFSL_VCG9kLiQ")] },
    ],
  },
  {
    id: "hs-earth",
    title: "HS Earth Science",
    subject: "Earth & environmental science",
    bands: ["hs"],
    folder: "1d0VT_Ucg6R_c3u8_cGkhyAiPd3Kfp5Er",
    lessons: [
      { n: 1, title: "Controlled Environment Agriculture vs. Open Soil Systems", resources: [r("slides", "1ryNlxfiNA3vmhlFyssWMgo5Y5izFOWV71IVcqXSCwb0"), r("activity", "1hPJdF1etrRwgZj0aWgcfR5PLsGs5Jwa5N0IixRCEMbc", "Activity sheet")] },
      { n: 2, title: "Biogeochemical Cycling & Water Chemistry", resources: [r("slides", "1Baq-iEu2wLSySB-P4wyDcNtN0eWTmRgeKvowWvhkKpM"), r("lab", "1S4GVu_MpnlR-9RdCkYc0smp_7yCedDIu")] },
      { n: 3, title: "Photosynthetic Energy Flux & Planetary Solar Radiation", resources: [r("slides", "1K6ErIcZdFRrrEJk2mTUpnJhaFoICdURF3oy2CqxP0uU"), r("lab", "1HIanM1IhQZchYeszqVvP28xjO_4ZllGf", "Lab guide")] },
      { n: 4, title: "Plant Microclimates, Transpiration & Atmospheric Water Vapor", resources: [r("slides", "1RHlbtAJa6sdj5WMYtX-dFE3FOtqump7q6lwFxO6F7eo"), r("lab", "1_uRk5jFj3Azs_zF0PqdBgsCBYEjt3bat", "Lab guide")] },
      { n: 5, title: "Bioregenerative Life Support & The Grand Harvest Lab", resources: [r("slides", "1aX3KGTT4XT-pns-eOr3TdfAj6Ibk3RJQqfdO7FxNf8k"), r("lab", "1lZyP0Xj70ai4SUugmjSe2ETFXWgtJGVG", "Differentiated lab guide")] },
    ],
  },
  {
    id: "intro-hydro",
    title: "Introduction to Hydroponics",
    subject: "History & science of soil-free growing",
    bands: ["ms", "hs"],
    folder: "1UB_c1t9PrHn3yiOCWozsbJVt46iZrs9Y",
    lessons: [
      { title: "The Hydro-Hero Journey (2,500 years of food hacks!)", resources: [r("slides", "1aNhaLlbckGEHBkh5yLLsVlxO_AhM0a2U"), r("guide", "1U7x52_ji2MvPp9Q5G00up5TO06J-f3CO0XtB7auLOl8"), r("activity", "1R9kTQx6bulaVq-HNdl49WxV6BF835C0V4yUyehxooec", "Exit ticket")] },
      { title: "The Evolution of Soilless Science", resources: [r("guide", "1mptxczOrnMCFubNVHt39LPfmREUQbAy_545P2lARzKQ")] },
      { title: "Hydroponics vs. Aeroponics", resources: [r("slides", "1cMAf40O_fUUI9ysZnq-76ia8GE71iecPpgFpFEYrI_I", "Activity slides")] },
      { title: "Hydroponics and Water Quality", resources: [r("reading", "1UyCyTWSd-ErqgryoHiWrDukXBct9_Puy", "Leveled reading (Diffit)")] },
    ],
  },
  {
    id: "more",
    title: "More Activities",
    subject: "Cross-curricular",
    bands: ["k1", "23", "45", "ms", "hs"],
    folder: DRIVE_ROOT,
    lessons: [
      { title: "Gardyn Cell Structure Lessons", resources: [r("guide", "1lpBN5yvA0FUOZPhdFfsUbOl9Ke9Qft0PKGRKwmPGmus", "Lesson ideas")] },
      { title: "Gardyn Experimental Lab Ideas", resources: [r("lab", "1mx_q-sRClaO-KYG1H-CVwLtnH7W39eicreO3pcjd3c4", "Lab ideas")] },
      { title: "Plant Life Cycle AI Activities for Students", resources: [r("activity", "1XB-zV5AMSIK545WXlPq7pG0oFF50S05u-NnJp63eN7c", "Activities")] },
      { title: "Michigan Seasonal Comparisons", resources: [r("activity", "1HcUBNxt7KI3__qdtPmiIrhHjmTe5ZDZwrTCe8PJsEDA")] },
      { title: "MagicSchool Unit Outline", resources: [r("guide", "1CT6e2oFY-na87-eA9jpFRcL3kKk46nFwmVx8sf0uYq4", "Unit outline")] },
    ],
  },
];

export const LESSON_COUNT = UNITS.reduce((n, u) => n + u.lessons.length, 0);
