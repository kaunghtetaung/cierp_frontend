import type { SectionData } from "@/themes/default/templates/section/types";

/**
 * Dummy home-page sections for the um1sf theme.
 *
 * Each entry conforms to publicWeb's `SectionData` union — same
 * shape that backend persists. When CMS authoring lands, replace
 * the export below with `await getPageSections('home')` and the
 * page renders identically.
 *
 * Stats block uses `customClasses: ['um1sf-stats']` as a marker so
 * the um1sf-themed FeatureList renderer can switch to big-number
 * tile layout. Once publicWeb's section union grows a proper
 * `stats` type that mirrors the backend, swap this for that.
 */
export const UM1_HOME_DUMMY: SectionData[] = [
  // ── 1. Hero (image bg + dark overlay + editorial text) ──────────────
  {
    _id: "dummy-hero",
    name: "welcome-hero",
    type: "hero",
    order: 0,
    isEnabled: true,
    backgroundImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80",
    overlay: { enabled: true, color: "#000000", opacity: 0.55 },
    headline: {
      en: "Training Myanmar's next generation of physicians",
      mm: "မြန်မာနိုင်ငံ၏ ဆေးပညာရှင်များ မွေးဖွားရာ",
    },
    subheadline: {
      en:
        "For more than a century, the University of Medicine 1 has been the country's foremost institution for medical education, research, and clinical care.",
      mm:
        "ရန်ကုန် ဆေးတက္ကသိုလ် (၁) သည် တစ်ရာစုကျော် မြန်မာ့ ဆေးပညာရေးနှင့် သုတေသနကို ဦးဆောင်လမ်းပြခဲ့သည်။",
    },
    buttons: [
      {
        text: { en: "More about UM1", mm: "UM1 အကြောင်း ပိုသိရန်" },
        url: "/about",
        style: "primary",
        openInNewTab: false,
      },
    ],
    textAlignment: "center",
    height: "medium",
  },

  // ── 2. News (4 cards) ─────────────────────────────────────────────
  {
    _id: "dummy-news",
    name: "campus-news",
    type: "featureList",
    order: 1,
    isEnabled: true,
    headline: { en: "News", mm: "သတင်း" },
    description: {
      en: "Stories from across the university and our teaching hospitals.",
      mm: "တက္ကသိုလ်နှင့် ဆေးရုံများမှ သတင်းများ။",
    },
    features: [
      {
        id: "news-1",
        image: "https://images.unsplash.com/photo-1516570161787-2fd917215a3d?w=600",
        title: {
          en: "New cardiac surgery suite opens at Yangon General",
          mm: "ရန်ကုန်ဆေးရုံကြီးတွင် နှလုံးခွဲစိတ်ခန်း အသစ် ဖွင့်လှစ်",
        },
        description: {
          en: "State-of-the-art operating theatre brings advanced cardiac procedures to UM1's flagship hospital.",
          mm: "နှလုံးခွဲစိတ်မှု အဆင့်မြင့် နည်းပညာ UM1 ၏ ဦးစားပေး ဆေးရုံ၌ ထည့်သွင်း။",
        },
        link: { url: "/news/cardiac-suite", text: { en: "Read story", mm: "ဖတ်ရန်" }, openInNewTab: false },
      },
      {
        id: "news-2",
        image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600",
        title: {
          en: "Faculty receive WHO collaboration award",
          mm: "WHO ပူးပေါင်းဆောင်ရွက်မှု ဆုကို ဆရာများ လက်ခံ",
        },
        description: {
          en: "Public-health team's work on tropical disease surveillance recognized internationally.",
          mm: "ပတ်ဝန်းကျင် ကျန်းမာရေး အဖွဲ့၏ အပူပိုင်း ရောဂါ စောင့်ကြည့် မှု ကို နိုင်ငံတကာ အသိအမှတ်ပြု။",
        },
        link: { url: "/news/who-award", text: { en: "Read story", mm: "ဖတ်ရန်" }, openInNewTab: false },
      },
      {
        id: "news-3",
        image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=600",
        title: {
          en: "Research grant supports rural medicine programme",
          mm: "ကျေးလက်ဆေးပညာ အစီအစဉ်အတွက် သုတေသန ထောက်ပံ့ငွေ ရရှိ",
        },
        description: {
          en: "Multi-year initiative to train physicians for under-served regions.",
          mm: "လိုအပ်နေသော ဒေသများသို့ ဆရာဝန်များ ပို့ဆောင်ရန် နှစ်များစွာ စီမံကိန်း။",
        },
        link: { url: "/news/rural-grant", text: { en: "Read story", mm: "ဖတ်ရန်" }, openInNewTab: false },
      },
      {
        id: "news-4",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600",
        title: {
          en: "Centennial lecture series announced",
          mm: "ရာပြည့် စကားဝိုင်း အစီအစဉ်များ ကြေငြာ",
        },
        description: {
          en: "Distinguished alumni return to deliver talks throughout the academic year.",
          mm: "ထူးခြားသော ကျောင်းသားဟောင်းများ ပြန်ပြီး ပညာရေးနှစ်တစ်လျှောက် ဟောပြောမည်။",
        },
        link: { url: "/news/centennial-lectures", text: { en: "Read story", mm: "ဖတ်ရန်" }, openInNewTab: false },
      },
    ],
    layout: "grid",
    columns: 4,
    showIcons: false,
    showImages: true,
  },

  // ── 3. Programs (3-tier columns, no images) ───────────────────────
  {
    _id: "dummy-programs",
    name: "academics-tiers",
    type: "featureList",
    order: 2,
    isEnabled: true,
    headline: { en: "Academics", mm: "ပညာရေး" },
    description: {
      en: "Education at UM1 spans the full medical journey — from entry to specialty practice.",
      mm: "UM1 ၏ ပညာရေးသည် စတင်ဝင်ခွင့်မှ အထူးကုဆေးပညာအထိ ပြည့်စုံသည်။",
    },
    features: [
      {
        id: "prog-mbbs",
        title: { en: "MBBS Programme", mm: "MBBS သင်တန်း" },
        description: {
          en: "Six-year Bachelor of Medicine and Bachelor of Surgery degree — the foundation of clinical practice in Myanmar.",
          mm: "ခြောက်နှစ်တာ ဆေးပညာဘွဲ့ - မြန်မာနိုင်ငံ ဆေးကုသမှု၏ အခြေခံ။",
        },
        link: { url: "/programs/mbbs", text: { en: "Programme details", mm: "သင်တန်း အသေးစိတ်" }, openInNewTab: false },
      },
      {
        id: "prog-postgraduate",
        title: { en: "Postgraduate Studies", mm: "ဘွဲ့လွန်" },
        description: {
          en: "Master's, diploma, and PhD pathways across more than 20 medical and surgical specialties.",
          mm: "မဟာဘွဲ့၊ ဒီပလိုမာ၊ ပါရဂူဘွဲ့ - ဆေးပညာအထူးပြု ၂၀ ကျော်။",
        },
        link: { url: "/programs/postgraduate", text: { en: "View specialties", mm: "အထူးပြုများ" }, openInNewTab: false },
      },
      {
        id: "prog-cme",
        title: { en: "Continuing Medical Education", mm: "ဆက်စပ် ဆေးပညာ" },
        description: {
          en: "Short courses and workshops keeping practising clinicians at the frontier of evidence-based medicine.",
          mm: "လက်တွေ့ဆရာဝန်များအတွက် တိုတို သင်တန်းနှင့် အလုပ်ရုံ ဆွေးနွေးပွဲများ။",
        },
        link: { url: "/programs/cme", text: { en: "Upcoming courses", mm: "သင်တန်းများ" }, openInNewTab: false },
      },
    ],
    layout: "grid",
    columns: 3,
    showIcons: false,
    showImages: false,
  },

  // ── 4. Faculty quote ──────────────────────────────────────────────
  {
    _id: "dummy-faculty",
    name: "faculty-voice",
    type: "testimonials",
    order: 3,
    isEnabled: true,
    testimonials: [
      {
        quote: {
          en: "Medicine is, at its heart, a conversation between clinician and patient. Everything we teach at UM1 begins with learning how to listen.",
          mm:
            "ဆေးပညာဆိုသည်မှာ ဆရာဝန်နှင့် လူနာ၏ စကားပြောခြင်းပင်။ UM1 မှာ သင်ကြားပေးသမျှ နားထောင်ခြင်းမှ စတင်သည်။",
        },
        author: {
          name: { en: "Prof. Dr. Aye Aye Thant", mm: "ပါမောက္ခ ဒေါက်တာ အေးအေးသန့်" },
          title: { en: "Department of Internal Medicine", mm: "အတွင်းကု ဌာန" },
        },
      },
    ],
    layout: "single",
    showRatings: false,
    showAvatars: false,
  },

  // ── 5. Stats (big-number tiles via FeatureList + marker class) ────
  {
    _id: "dummy-stats",
    name: "research-stats",
    type: "featureList",
    order: 4,
    isEnabled: true,
    customClasses: ["um1sf-stats"],
    headline: { en: "Research", mm: "သုတေသန" },
    description: {
      en: "By the numbers — UM1's contribution to medical knowledge and public health.",
      mm: "ကိန်းဂဏန်းများဖြင့် - UM1 ၏ ဆေးပညာနှင့် ပြည်သူ့ကျန်းမာရေး ပေးဆပ်မှုများ။",
    },
    features: [
      {
        id: "stat-pubs",
        title: { en: "1,200+", mm: "၁,၂၀၀+" },
        description: { en: "Peer-reviewed publications", mm: "သုတေသန စာတမ်းများ" },
      },
      {
        id: "stat-grants",
        title: { en: "85", mm: "၈၅" },
        description: { en: "Active research grants", mm: "သုတေသန ထောက်ပံ့ငွေများ" },
      },
      {
        id: "stat-trials",
        title: { en: "40+", mm: "၄၀+" },
        description: { en: "Ongoing clinical trials", mm: "လက်ရှိ စမ်းသပ်ကုသမှုများ" },
      },
    ],
    layout: "grid",
    columns: 3,
    showIcons: false,
    showImages: false,
  },

  // ── 6. Student profile ────────────────────────────────────────────
  {
    _id: "dummy-student",
    name: "student-voice",
    type: "testimonials",
    order: 5,
    isEnabled: true,
    testimonials: [
      {
        quote: {
          en: "I came to UM1 thinking I'd be a city doctor. Three years in, I'm planning to take what I've learned back to my home village in Sagaing.",
          mm: "မြို့ပြ ဆရာဝန်ဖြစ်မယ်လို့ ထင်လာခဲ့တယ်။ သုံးနှစ်ကြာပြီးနောက် စစ်ကိုင်း ရွာရင်းကို ပြန်ဖို့ ဆုံးဖြတ်ထား။",
        },
        author: {
          name: { en: "Khin Mar Aye, MBBS Year 4", mm: "ခင်မာအေး၊ MBBS စတုတ္ထနှစ်" },
          title: { en: "Student Story", mm: "ကျောင်းသား ဇာတ်လမ်း" },
        },
      },
    ],
    layout: "single",
    showRatings: false,
    showAvatars: false,
  },

  // ── 7. Campus life (3 cards) ──────────────────────────────────────
  {
    _id: "dummy-campus",
    name: "campus-life",
    type: "featureList",
    order: 6,
    isEnabled: true,
    headline: { en: "Campus Life", mm: "ကျောင်းတွင်းဘဝ" },
    description: {
      en: "Beyond the classroom and ward — the people, clubs, and traditions that shape UM1.",
      mm: "စာသင်ခန်းများကိုကျော်လွန်၍ - UM1 ကို ပုံဖော်သော လူများ၊ အသင်းအဖွဲ့များနှင့် ထုံးတမ်းများ။",
    },
    features: [
      {
        id: "campus-clubs",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600",
        title: { en: "Student Organisations", mm: "ကျောင်းသား အသင်းအဖွဲ့များ" },
        description: {
          en: "From debate to surgical society — over 30 student-run organisations on campus.",
          mm: "ဆွေးနွေးပွဲမှ ခွဲစိတ်ပညာအသင်း - ၃၀ ကျော် အသင်းအဖွဲ့များ။",
        },
        link: { url: "/campus/organisations", text: { en: "Explore", mm: "လေ့လာရန်" }, openInNewTab: false },
      },
      {
        id: "campus-wellness",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600",
        title: { en: "Wellness & Support", mm: "ကျန်းမာရေးနှင့် အထောက်အပံ့" },
        description: {
          en: "Counselling, mentorship, and peer-support programmes for the demanding journey of medical school.",
          mm: "ပညာရေးခက်ခဲမှုများကို ကျော်နိုင်ရန် ဆွေးနွေးခြင်း၊ လမ်းညွှန်ခြင်းနှင့် အပြန်အလှန် ထောက်ပံ့မှု။",
        },
        link: { url: "/campus/wellness", text: { en: "Resources", mm: "အရင်းအမြစ်များ" }, openInNewTab: false },
      },
      {
        id: "campus-traditions",
        image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600",
        title: { en: "Centennial Traditions", mm: "ရာပြည့် ရိုးရာများ" },
        description: {
          en: "White-coat ceremony, oath-of-office, alumni reunion week — rituals that span generations.",
          mm: "ဝတ်စုံ ဆုပေးပွဲ၊ ကတိ ပြုမြိုးသုံးခြင်း၊ ကျောင်းသားဟောင်း ပြန်လည် တွေ့ဆုံပွဲ။",
        },
        link: { url: "/campus/traditions", text: { en: "Calendar", mm: "ပြက္ခဒိန်" }, openInNewTab: false },
      },
    ],
    layout: "grid",
    columns: 3,
    showIcons: false,
    showImages: true,
  },

  // ── 8. Admission band (CTA) ───────────────────────────────────────
  {
    _id: "dummy-admission",
    name: "admission-band",
    type: "cta",
    order: 7,
    isEnabled: true,
    headline: {
      en: "Begin your journey at UM1",
      mm: "UM1 မှ စတင် လမ်းခရီး",
    },
    description: {
      en:
        "Applications for the next academic year open in May. Need-based scholarships available for qualified candidates from across the country.",
      mm: "နောက်နှစ် ပညာသင်နှစ်အတွက် မေလမှ ဝင်ခွင့် လျှောက်လွှာ ဖွင့်ထားသည်။ ပညာသင်ဆုများ ရရှိနိုင်ပါသည်။",
    },
    buttons: [
      {
        text: { en: "Apply", mm: "လျှောက်ထား" },
        url: "/admission/apply",
        style: "primary",
        openInNewTab: false,
      },
      {
        text: { en: "Financial aid", mm: "ပညာသင်ဆု" },
        url: "/admission/aid",
        style: "outline",
        openInNewTab: false,
      },
    ],
    alignment: "center",
    size: "large",
  },
];
