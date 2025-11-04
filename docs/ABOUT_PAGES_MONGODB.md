# About Menu and Pages - MongoDB Documents

This document contains the MongoDB structure for:
1. Navigation menu update (About with children: History, Campuses)
2. History page document
3. Campuses page document

---

## 1. Navigation Menu Update

Update your Content Settings document's `headerMenu` array. Find the "About" menu item and replace it with:

```json
{
  "id": "about",
  "title": {
    "en": "About",
    "mm": "အကြောင်း"
  },
  "url": "#",
  "icon": "",
  "cssClass": "",
  "openInNewTab": false,
  "requiresAuth": false,
  "allowedRoles": [],
  "children": [
    {
      "id": "history",
      "title": {
        "en": "History",
        "mm": "သမိုင်း"
      },
      "url": "/history",
      "icon": "",
      "cssClass": "",
      "openInNewTab": false,
      "requiresAuth": false,
      "allowedRoles": [],
      "children": []
    },
    {
      "id": "campuses",
      "title": {
        "en": "Campuses",
        "mm": "ကျောင်းဝင်းများ"
      },
      "url": "/campuses",
      "icon": "",
      "cssClass": "",
      "openInNewTab": false,
      "requiresAuth": false,
      "allowedRoles": [],
      "children": []
    }
  ]
}
```

---

## 2. History Page Document

Insert this as a new document in your **Pages** collection:

```json
{
  "_id": "history-page-001",
  "title": {
    "en": "History",
    "mm": "သမိုင်း"
  },
  "slug": "history",
  "description": {
    "en": "The history of University of Medicine 1, Yangon from 1907 to present",
    "mm": "ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ၁၉၀၇ ခုနှစ်မှ ယနေ့အထိ သမိုင်း"
  },
  "organizationId": "YOUR_ORG_ID",
  "status": "published",
  "publishedAt": "2025-01-03T00:00:00.000Z",
  "sections": [
    {
      "_id": "history-hero-001",
      "name": "History Hero",
      "type": "hero",
      "order": 1,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "History",
          "mm": "သမိုင်း"
        },
        "subtitle": {
          "en": "The Legacy of University of Medicine 1, Yangon",
          "mm": "ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ အမွေအနှစ်"
        },
        "description": {
          "en": "From 1907 to present - A century of medical education excellence",
          "mm": "၁၉၀၇ မှ ယနေ့အထိ - ဆေးပညာအရည်အသွေးမြင့် ပညာရေး ရာစုနှစ်တစ်ခု"
        }
      },
      "layout": "centered",
      "textAlign": "center",
      "backgroundImage": "",
      "overlay": {
        "enabled": true,
        "color": "#1F5CB7",
        "opacity": 0.7
      }
    },
    {
      "_id": "history-content-001",
      "name": "Historical Overview",
      "type": "featureList",
      "order": 2,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Our Journey Through Time",
          "mm": "ကျွန်ုပ်တို့၏ အချိန်ကာလအတွင်း ခရီးသွား"
        },
        "description": {
          "en": "The institution's origins trace back to 1907 with the establishment of the Government Medical School in Myanmar at the old Rangoon General Hospital. The foundational four-year curriculum was the Licentiate in Medical Practice (LMP) course.",
          "mm": "အဖွဲ့အစည်း၏ မူလအစသည် ၁၉၀၇ ခုနှစ်တွင် ရန်ကုန်ယေဘုယျ ဆေးရုံဟောင်းတွင် မြန်မာနိုင်ငံ အစိုးရဆေးတက္ကသိုလ် တည်ထောင်ခြင်းနှင့် စတင်ခဲ့သည်"
        },
        "features": [
          {
            "id": "milestone-1",
            "icon": "calendar",
            "title": {
              "en": "1907 - Foundation",
              "mm": "၁၉၀၇ - တည်ထောင်ခြင်း"
            },
            "description": {
              "en": "Establishment of the Government Medical School in Myanmar at the old Rangoon General Hospital with a four-year Licentiate in Medical Practice (LMP) course.",
              "mm": "ရန်ကုန်ယေဘုယျဆေးရုံဟောင်းတွင် အစိုးရဆေးတက္ကသိုလ် တည်ထောင်ပြီး လေးနှစ်သင်တန်း LMP သင်ခန်းစာစတင်ခဲ့သည်"
            }
          },
          {
            "id": "milestone-2",
            "icon": "award",
            "title": {
              "en": "1923-24 - MBBS Introduction",
              "mm": "၁၉၂၃-၂၄ - MBBS စတင်"
            },
            "description": {
              "en": "Bachelor of Medicine and Bachelor of Surgery (MBBS) course was introduced at Rangoon College building.",
              "mm": "ရန်ကုန်ကောလိပ် အဆောက်အအုံတွင် ဆေးပညာဘွဲ့နှင့် ခွဲစိတ်ဘွဲ့ (MBBS) သင်တန်း စတင်ခဲ့သည်"
            }
          },
          {
            "id": "milestone-3",
            "icon": "building",
            "title": {
              "en": "1927 - New Campus",
              "mm": "၁၉၂၇ - ကျောင်းဝင်းအသစ်"
            },
            "description": {
              "en": "Foundation stone laid by Sir Harcourt Butler on February 2nd for the main Medical College building at Myomakyaung Road. Classes transferred in 1929.",
              "mm": "ဖေဖော်ဝါရီ ၂ ရက်နေ့တွင် Sir Harcourt Butler မြို့မကျောင်းလမ်းရှိ အဓိက ဆေးကောလိပ်အဆောက်အအုံအတွက် အုတ်မြစ်ချခဲ့သည်"
            }
          },
          {
            "id": "milestone-4",
            "icon": "graduation-cap",
            "title": {
              "en": "1930 - University Status",
              "mm": "၁၉၃၀ - တက္ကသိုလ်အဆင့်"
            },
            "description": {
              "en": "Medical College became a constituent college under University of Rangoon.",
              "mm": "ဆေးကောလိပ်သည် ရန်ကုန်တက္ကသိုလ်အောက်တွင် အစိတ်အပိုင်းကောလိပ်တစ်ခု ဖြစ်လာခဲ့သည်"
            }
          },
          {
            "id": "milestone-5",
            "icon": "check-circle",
            "title": {
              "en": "1937 - International Recognition",
              "mm": "၁၉၃၇ - နိုင်ငံတကာအသိအမှတ်ပြု"
            },
            "description": {
              "en": "MBBS degree gained recognition from the General Medical Council of Great Britain.",
              "mm": "MBBS ဘွဲ့သည် ဗြိတိန်နိုင်ငံ အထွေထွေဆေးဘက်ဆိုင်ရာကောင်စီမှ အသိအမှတ်ပြုခြင်း ရရှိခဲ့သည်"
            }
          },
          {
            "id": "milestone-6",
            "icon": "alert-triangle",
            "title": {
              "en": "1942-1945 - War Years",
              "mm": "၁၉၄၂-၁၉၄၅ - စစ်ပွဲနှစ်များ"
            },
            "description": {
              "en": "Temporary suspension of MBBS course during World War II. A modified curriculum was offered instead.",
              "mm": "ဒုတိယကမ္ဘာစစ်အတွင်း MBBS သင်တန်း ယာယီရပ်ဆိုင်းခဲ့သည်။ ပြုပြင်ထားသော သင်ရိုးညွှန်းတမ်းကို ပေးအပ်ခဲ့သည်"
            }
          },
          {
            "id": "milestone-7",
            "icon": "book",
            "title": {
              "en": "1946 - Faculty of Medicine",
              "mm": "၁၉၄၆ - ဆေးတက္ကသိုလ်"
            },
            "description": {
              "en": "Transformed into 'Faculty of Medicine' under University of Rangoon on September 26th.",
              "mm": "စက်တင်ဘာ ၂၆ ရက်နေ့တွင် ရန်ကုန်တက္ကသိုလ်အောက်ရှိ 'ဆေးတက္ကသိုလ်' အဖြစ် ပြောင်းလဲခဲ့သည်"
            }
          },
          {
            "id": "milestone-8",
            "icon": "flag",
            "title": {
              "en": "1948 - Independence Era",
              "mm": "၁၉၄၈ - လွတ်လပ်ရေးခေတ်"
            },
            "description": {
              "en": "Burma gained independence. The institution faced significant staffing challenges during this transition period.",
              "mm": "မြန်မာနိုင်ငံ လွတ်လပ်ရေးရခဲ့သည်။ ဤအကူးအပြောင်းကာလတွင် အဖွဲ့အစည်းသည် ဝန်ထမ်းအင်အား စိန်ခေါ်မှုများကို ရင်ဆိုင်ခဲ့ရသည်"
            }
          },
          {
            "id": "milestone-9",
            "icon": "users",
            "title": {
              "en": "1962-1964 - Institute Era",
              "mm": "၁၉၆၂-၁၉၆၄ - အင်စတီကျုအခေျ"
            },
            "description": {
              "en": "Administrative restructuring established the Institute of Medicine with a Rector as head. Postgraduate courses were introduced during this period.",
              "mm": "စီမံခန့်ခွဲမှု ပြန်လည်ဖွဲ့စည်းခြင်းဖြင့် ဆေးတက္ကသိုလ်အင်စတီကျုကို ဌာနမှူးတစ်ဦးဖြင့် တည်ထောင်ခဲ့သည်"
            }
          }
        ]
      },
      "layout": "grid",
      "columns": 3,
      "showIcons": true
    },
    {
      "_id": "history-cta-001",
      "name": "Learn More CTA",
      "type": "cta",
      "order": 3,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Explore Our Campuses",
          "mm": "ကျွန်ုပ်တို့၏ ကျောင်းဝင်းများကို လေ့လာပါ"
        },
        "description": {
          "en": "Discover our three modern campuses equipped with state-of-the-art facilities for medical education.",
          "mm": "ဆေးပညာရေးအတွက် ခေတ်မှီအဆင့်မြင့် အထောက်အပံ့များဖြင့် တပ်ဆင်ထားသော ကျွန်ုပ်တို့၏ ခေတ်မီကျောင်းဝင်းသုံးခုကို ရှာဖွေပါ"
        },
        "primaryButton": {
          "text": {
            "en": "View Campuses",
            "mm": "ကျောင်းဝင်းများကြည့်ရှုပါ"
          },
          "url": "/campuses",
          "style": "primary"
        }
      },
      "background": {
        "type": "color",
        "value": "#1F5CB7"
      },
      "alignment": "center",
      "size": "medium"
    }
  ],
  "metadata": {
    "seo": {
      "title": {
        "en": "History - University of Medicine 1, Yangon",
        "mm": "သမိုင်း - ရန်ကုန်ဆေးတက္ကသိုလ် (၁)"
      },
      "description": {
        "en": "Discover the rich history of University of Medicine 1, Yangon from its founding in 1907 to becoming one of Myanmar's leading medical institutions.",
        "mm": "၁၉၀၇ ခုနှစ်တွင် တည်ထောင်ခြင်းမှ မြန်မာနိုင်ငံ၏ ထိပ်တန်းဆေးဘက်ဆိုင်ရာ အဖွဲ့အစည်းများထဲမှ တစ်ခု ဖြစ်လာခြင်းအထိ ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ကြွယ်ဝသော သမိုင်းကို ရှာဖွေပါ"
      },
      "keywords": ["history", "university of medicine", "yangon", "medical education", "MBBS", "myanmar"]
    },
    "openGraph": {
      "title": {
        "en": "History - University of Medicine 1, Yangon",
        "mm": "သမိုင်း - ရန်ကုန်ဆေးတက္ကသိုလ် (၁)"
      },
      "description": {
        "en": "From 1907 to present - A century of medical education excellence",
        "mm": "၁၉၀၇ မှ ယနေ့အထိ - ဆေးပညာအရည်အသွေးမြင့် ပညာရေး ရာစုနှစ်တစ်ခု"
      },
      "image": ""
    }
  },
  "settings": {
    "showBreadcrumbs": true,
    "showTableOfContents": false,
    "allowComments": false,
    "showSocialShare": true,
    "showRelatedPages": true
  },
  "author": "admin",
  "lastModifiedBy": "admin",
  "version": 1,
  "createdAt": "2025-01-03T00:00:00.000Z",
  "updatedAt": "2025-01-03T00:00:00.000Z"
}
```

---

## 3. Campuses Page Document

Insert this as a new document in your **Pages** collection:

```json
{
  "_id": "campuses-page-001",
  "title": {
    "en": "Campuses",
    "mm": "ကျောင်းဝင်းများ"
  },
  "slug": "campuses",
  "description": {
    "en": "The three campuses of University of Medicine 1, Yangon",
    "mm": "ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ကျောင်းဝင်းသုံးခု"
  },
  "organizationId": "YOUR_ORG_ID",
  "status": "published",
  "publishedAt": "2025-01-03T00:00:00.000Z",
  "sections": [
    {
      "_id": "campuses-hero-001",
      "name": "Campuses Hero",
      "type": "hero",
      "order": 1,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Our Campuses",
          "mm": "ကျွန်ုပ်တို့၏ ကျောင်းဝင်းများ"
        },
        "subtitle": {
          "en": "Three Modern Medical Education Facilities",
          "mm": "ခေတ်မီဆေးပညာရေး အဆောက်အအုံသုံးခု"
        },
        "description": {
          "en": "The University of Medicine (1) operates three distinct campuses across Yangon, each designed to provide the best medical education experience.",
          "mm": "ဆေးတက္ကသိုလ် (၁) သည် ရန်ကုန်တစ်ဝှမ်းတွင် ကျောင်းဝင်းသုံးခု လည်ပတ်လျက်ရှိပြီး၊ အကောင်းဆုံးဆေးပညာရေး အတွေ့အကြုံကို ပေးအပ်ရန် ဒီဇိုင်းထုတ်ထားသည်"
        }
      },
      "layout": "centered",
      "textAlign": "center",
      "backgroundImage": "",
      "overlay": {
        "enabled": true,
        "color": "#1F5CB7",
        "opacity": 0.7
      }
    },
    {
      "_id": "campuses-overview-001",
      "name": "Campuses Overview",
      "type": "featureList",
      "order": 2,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Campus Locations",
          "mm": "ကျောင်းဝင်း တည်နေရာများ"
        },
        "description": {
          "en": "Our three campuses are strategically located across Yangon to serve different stages of medical education.",
          "mm": "ကျွန်ုပ်တို့၏ ကျောင်းဝင်းသုံးခုသည် ဆေးပညာရေး အဆင့်များစွာကို ဝန်ဆောင်မှုပေးရန် ရန်ကုန်မြို့တစ်ဝှမ်းတွင် မဟာဗျူဟာကျစွာ တည်ရှိပါသည်"
        },
        "features": [
          {
            "id": "campus-1",
            "icon": "map-pin",
            "title": {
              "en": "Lanmadaw Campus",
              "mm": "လမ်းမတော်ကျောင်းဝင်း"
            },
            "description": {
              "en": "Established in 1927 • Para-clinical Education • 2 Acres",
              "mm": "၁၉၂၇ တွင် တည်ထောင် • Para-clinical ပညာရေး • ဧက ၂"
            }
          },
          {
            "id": "campus-2",
            "icon": "map-pin",
            "title": {
              "en": "Pyay Campus",
              "mm": "ပြည်ကျောင်းဝင်း"
            },
            "description": {
              "en": "Preclinical Education • Years 1-2 Students • Modern Facilities",
              "mm": "Preclinical ပညာရေး • နှစ် ၁-၂ ကျောင်းသားများ • ခေတ်မီအဆောက်အအုံများ"
            }
          },
          {
            "id": "campus-3",
            "icon": "map-pin",
            "title": {
              "en": "Thahtone Campus",
              "mm": "သထုံးကျောင်းဝင်း"
            },
            "description": {
              "en": "Preclinical Education • Adjacent to Pyay Campus • 3 Acres Combined",
              "mm": "Preclinical ပညာရေး • ပြည်ကျောင်းဝင်းနှင့် ကပ်လျက် • ပေါင်းဧက ၃"
            }
          }
        ]
      },
      "layout": "grid",
      "columns": 3,
      "showIcons": true
    },
    {
      "_id": "campuses-pyay-001",
      "name": "Pyay & Thahtone Campuses",
      "type": "contentWithImage",
      "order": 3,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Pyay and Thahtone Campuses",
          "mm": "ပြည်နှင့် သထုံးကျောင်းဝင်းများ"
        },
        "description": {
          "en": "These two adjacent facilities span approximately 3 acres, separated by Thahtone street. They focus on preclinical education for first and second-year medical students.\n\n**Facilities include:**\n• 3 lecture halls (250-person capacity)\n• Botany and zoology laboratories\n• Chemistry and physics laboratories\n• Anatomy dissection hall\n• Physiology and biochemistry laboratories\n• Library services\n• Student recreation areas and canteen",
          "mm": "ဤကျောင်းဝင်းနှစ်ခုသည် သထုံးလမ်းဖြင့် ခွဲထားပြီး၊ ဧကခန့် ၃ ကျယ်ဝန်းသည်။ ပထမနှင့် ဒုတိယနှစ် ဆေးကျောင်းသားများအတွက် preclinical ပညာရေးကို အာရုံစိုက်သည်။\n\n**အဆောက်အအုံများတွင်:**\n• ကျောင်းခန်း ၃ ခန်း (လူ ၂၅၀ ဆံ့)\n• ရုက္ခဗေဒနှင့် သတ္တဗေဒဓါတ်ခွဲခန်းများ\n• ဓာတုဗေဒနှင့် ရူပဗေဒဓါတ်ခွဲခန်းများ\n• ခန္ဓာဗေဒခွဲခန်း\n• ဇီဝကမ္မဗေဒနှင့် ဇီဝဓာတုဗေဒဓါတ်ခွဲခန်းများ\n• စာကြည့်တိုက်ဝန်ဆောင်မှုများ\n• ကျောင်းသား အပန်းဖြေနေရာများနှင့် စားသောက်ဆိုင်"
        },
        "image": {
          "url": "",
          "alt": {
            "en": "Pyay and Thahtone Campuses",
            "mm": "ပြည်နှင့် သထုံးကျောင်းဝင်းများ"
          }
        }
      },
      "layout": "imageRight"
    },
    {
      "_id": "campuses-lanmadaw-001",
      "name": "Lanmadaw Campus",
      "type": "contentWithImage",
      "order": 4,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Lanmadaw Campus",
          "mm": "လမ်းမတော်ကျောင်းဝင်း"
        },
        "description": {
          "en": "Established in 1927, this 2-acre facility serves as the oldest campus and houses para-clinical instruction.\n\n**Key features:**\n• 3 lecture halls (300-person capacity)\n• 4 lecture halls (200-person capacity)\n• Multimedia teaching auditorium\n• Microbiology, pathology, and pharmacology laboratories\n• Common research laboratory\n• Medical resource center and skill laboratory\n• Medical Skill, Simulation and Research Center (opened December 2, 2019)\n• Administrative offices and library facilities\n• Canteen services",
          "mm": "၁၉၂၇ ခုနှစ်တွင် တည်ထောင်ခဲ့သော ဧက ၂ အကျယ်အဝန်းရှိ ဤအဆောက်အအုံသည် အသက်ကြီးဆုံး ကျောင်းဝင်းအဖြစ် para-clinical သင်ကြားမှုကို ဆောင်ရွက်ပေးသည်။\n\n**အဓိက အင်္ဂါရပ်များ:**\n• ကျောင်းခန်း ၃ ခန်း (လူ ၃၀၀ ဆံ့)\n• ကျောင်းခန်း ၄ ခန်း (လူ ၂၀၀ ဆံ့)\n• မာလ်တီမီဒီယာ သင်ကြားမှုခန်းမ\n• အဏုဇီဝဗေဒ၊ ရောဂါဗေဒနှင့် ဆေးဝါးဗေဒ ဓါတ်ခွဲခန်းများ\n• အများသုံး သုတေသနဓါတ်ခွဲခန်း\n• ဆေးပညာအရင်းအမြစ်ဗဟိုနှင့် ကျွမ်းကျင်မှုဓါတ်ခွဲခန်း\n• ဆေးပညာကျွမ်းကျင်မှု၊ တုပခြင်းနှင့် သုတေသနဗဟိုဌာန (ဒီဇင်ဘာ ၂၊ ၂၀၁၉ တွင် ဖွင့်လှစ်)\n• စီမံခန့်ခွဲရေးရုံးများနှင့် စာကြည့်တိုက်အဆောက်အအုံများ\n• စားသောက်ဆိုင်ဝန်ဆောင်မှုများ"
        },
        "image": {
          "url": "",
          "alt": {
            "en": "Lanmadaw Campus - Established 1927",
            "mm": "လမ်းမတော်ကျောင်းဝင်း - ၁၉၂၇ တွင် တည်ထောင်"
          }
        }
      },
      "layout": "imageLeft"
    },
    {
      "_id": "campuses-cta-001",
      "name": "History CTA",
      "type": "cta",
      "order": 5,
      "isEnabled": true,
      "content": {
        "title": {
          "en": "Learn About Our History",
          "mm": "ကျွန်ုပ်တို့၏ သမိုင်းကို လေ့လာပါ"
        },
        "description": {
          "en": "Discover the rich history of University of Medicine 1, Yangon from 1907 to present.",
          "mm": "၁၉၀၇ မှ ယနေ့အထိ ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ကြွယ်ဝသော သမိုင်းကို ရှာဖွေပါ"
        },
        "primaryButton": {
          "text": {
            "en": "View History",
            "mm": "သမိုင်းကြည့်ရှုပါ"
          },
          "url": "/history",
          "style": "primary"
        }
      },
      "background": {
        "type": "color",
        "value": "#1F5CB7"
      },
      "alignment": "center",
      "size": "medium"
    }
  ],
  "metadata": {
    "seo": {
      "title": {
        "en": "Campuses - University of Medicine 1, Yangon",
        "mm": "ကျောင်းဝင်းများ - ရန်ကုန်ဆေးတက္ကသိုလ် (၁)"
      },
      "description": {
        "en": "Explore the three modern campuses of University of Medicine 1, Yangon - Lanmadaw, Pyay, and Thahtone campuses equipped with state-of-the-art facilities.",
        "mm": "ခေတ်မီအဆောက်အအုံများဖြင့် တပ်ဆင်ထားသော ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ခေတ်မီကျောင်းဝင်းသုံးခု - လမ်းမတော်၊ ပြည်နှင့် သထုံးကျောင်းဝင်းများကို လေ့လာပါ"
      },
      "keywords": ["campuses", "university of medicine", "yangon", "medical facilities", "lanmadaw", "pyay", "thahtone"]
    },
    "openGraph": {
      "title": {
        "en": "Campuses - University of Medicine 1, Yangon",
        "mm": "ကျောင်းဝင်းများ - ရန်ကုန်ဆေးတက္ကသိုလ် (၁)"
      },
      "description": {
        "en": "Three modern medical education facilities across Yangon",
        "mm": "ရန်ကုန်တစ်ဝှမ်းရှိ ခေတ်မီဆေးပညာရေးအဆောက်အအုံသုံးခု"
      },
      "image": ""
    }
  },
  "settings": {
    "showBreadcrumbs": true,
    "showTableOfContents": false,
    "allowComments": false,
    "showSocialShare": true,
    "showRelatedPages": true
  },
  "author": "admin",
  "lastModifiedBy": "admin",
  "version": 1,
  "createdAt": "2025-01-03T00:00:00.000Z",
  "updatedAt": "2025-01-03T00:00:00.000Z"
}
```

---

## Implementation Steps

1. **Update Navigation Menu:**
   - Open MongoDB Compass or mongo shell
   - Find your Content Settings document
   - Locate the `headerMenu` array
   - Replace the existing "About" menu item with the structure from section 1

2. **Insert History Page:**
   - Insert the History page document from section 2 into your Pages collection
   - Update `organizationId` to match your organization ID

3. **Insert Campuses Page:**
   - Insert the Campuses page document from section 3 into your Pages collection
   - Update `organizationId` to match your organization ID

4. **Clear Cache:**
   - After updating, clear your Redis cache for content settings and pages
   - Restart your Next.js application or wait for cache to expire

5. **Test Navigation:**
   - Visit your website
   - Click on "About" in the navigation menu
   - You should see a dropdown with "History" and "Campuses" options
   - Click each link to verify the pages load correctly

---

## Notes

- Replace `YOUR_ORG_ID` with your actual organization ID from the database
- You can add images later by updating the `backgroundImage` fields in hero sections and `image.url` fields in content sections
- The Myanmar translations are provided but you should review them with a native speaker
- Section IDs are prefixed (e.g., `history-hero-001`) for easy identification
- All sections are enabled (`isEnabled: true`) but you can disable any section without deleting it

---

## URL Routes

Once implemented, the pages will be accessible at:
- **History:** `https://yourdomain.com/history`
- **Campuses:** `https://yourdomain.com/campuses`

Make sure your Next.js dynamic route `/[slug]/page.tsx` is set up to handle these slug-based pages.
