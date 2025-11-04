// Script to create About menu with History and Campuses pages
// Usage: mongosh -u cidbaccess -p cidb1234 --authenticationDatabase admin ciapp setup-about-pages.js

const organizationId = ObjectId('68d12d98e776d47ad2004ef6');
const currentDate = new Date();

// =============================================================================
// 1. Create History Page with Sections
// =============================================================================

print('Creating History page...');

const historyPage = {
  title: {
    en: 'History',
    mm: 'သမိုင်း'
  },
  slug: 'history',
  content: {
    en: '',  // Empty because we use sections
    mm: ''
  },
  excerpt: {
    en: 'The history of University of Medicine 1, Yangon from 1907 to present',
    mm: 'ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ၁၉၀၇ ခုနှစ်မှ ယနေ့အထိ သမိုင်း'
  },
  sections: [
    {
      _id: ObjectId(),
      name: 'History Hero',
      type: 'hero',
      order: 1,
      isEnabled: true,
      content: {
        title: {
          en: 'History',
          mm: 'သမိုင်း'
        },
        subtitle: {
          en: 'The Legacy of University of Medicine 1, Yangon',
          mm: 'ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ အမွေအနှစ်'
        },
        description: {
          en: 'From 1907 to present - A century of medical education excellence',
          mm: '၁၉၀၇ မှ ယနေ့အထိ - ဆေးပညာအရည်အသွေးမြင့် ပညာရေး ရာစုနှစ်တစ်ခု'
        }
      },
      layout: 'centered',
      textAlign: 'center',
      backgroundImage: '',
      overlay: {
        enabled: true,
        color: '#1F5CB7',
        opacity: 0.7
      }
    },
    {
      _id: ObjectId(),
      name: 'Historical Timeline',
      type: 'featureList',
      order: 2,
      isEnabled: true,
      headline: {
        en: 'Our Journey Through Time',
        mm: 'ကျွန်ုပ်တို့၏ အချိန်ကာလအတွင်း ခရီးသွား'
      },
      description: {
        en: 'The institution\'s origins trace back to 1907 with the establishment of the Government Medical School in Myanmar at the old Rangoon General Hospital.',
        mm: 'အဖွဲ့အစည်း၏ မူလအစသည် ၁၉၀၇ ခုနှစ်တွင် ရန်ကုန်ယေဘုယျ ဆေးရုံဟောင်းတွင် မြန်မာနိုင်ငံ အစိုးရဆေးတက္ကသိုလ် တည်ထောင်ခြင်းနှင့် စတင်ခဲ့သည်'
      },
      features: [
        {
          id: 'milestone-1',
          icon: 'calendar',
          title: {
            en: '1907 - Foundation',
            mm: '၁၉၀၇ - တည်ထောင်ခြင်း'
          },
          description: {
            en: 'Establishment of the Government Medical School in Myanmar at the old Rangoon General Hospital with a four-year Licentiate in Medical Practice (LMP) course.',
            mm: 'ရန်ကုန်ယေဘုယျဆေးရုံဟောင်းတွင် အစိုးရဆေးတက္ကသိုလ် တည်ထောင်ပြီး လေးနှစ်သင်တန်း LMP သင်ခန်းစာစတင်ခဲ့သည်'
          }
        },
        {
          id: 'milestone-2',
          icon: 'award',
          title: {
            en: '1923-24 - MBBS Introduction',
            mm: '၁၉၂၃-၂၄ - MBBS စတင်'
          },
          description: {
            en: 'Bachelor of Medicine and Bachelor of Surgery (MBBS) course was introduced at Rangoon College building.',
            mm: 'ရန်ကုန်ကောလိပ် အဆောက်အအုံတွင် ဆေးပညာဘွဲ့နှင့် ခွဲစိတ်ဘွဲ့ (MBBS) သင်တန်း စတင်ခဲ့သည်'
          }
        },
        {
          id: 'milestone-3',
          icon: 'building',
          title: {
            en: '1927 - New Campus',
            mm: '၁၉၂၇ - ကျောင်းဝင်းအသစ်'
          },
          description: {
            en: 'Foundation stone laid by Sir Harcourt Butler on February 2nd for the main Medical College building at Myomakyaung Road. Classes transferred in 1929.',
            mm: 'ဖေဖော်ဝါရီ ၂ ရက်နေ့တွင် Sir Harcourt Butler မြို့မကျောင်းလမ်းရှိ အဓိက ဆေးကောလိပ်အဆောက်အအုံအတွက် အုတ်မြစ်ချခဲ့သည်'
          }
        },
        {
          id: 'milestone-4',
          icon: 'graduation-cap',
          title: {
            en: '1930 - University Status',
            mm: '၁၉၃၀ - တက္ကသိုလ်အဆင့်'
          },
          description: {
            en: 'Medical College became a constituent college under University of Rangoon.',
            mm: 'ဆေးကောလိပ်သည် ရန်ကုန်တက္ကသိုလ်အောက်တွင် အစိတ်အပိုင်းကောလိပ်တစ်ခု ဖြစ်လာခဲ့သည်'
          }
        },
        {
          id: 'milestone-5',
          icon: 'check-circle',
          title: {
            en: '1937 - International Recognition',
            mm: '၁၉၃၇ - နိုင်ငံတကာအသိအမှတ်ပြု'
          },
          description: {
            en: 'MBBS degree gained recognition from the General Medical Council of Great Britain.',
            mm: 'MBBS ဘွဲ့သည် ဗြိတိန်နိုင်ငံ အထွေထွေဆေးဘက်ဆိုင်ရာကောင်စီမှ အသိအမှတ်ပြုခြင်း ရရှိခဲ့သည်'
          }
        },
        {
          id: 'milestone-6',
          icon: 'alert-triangle',
          title: {
            en: '1942-1945 - War Years',
            mm: '၁၉၄၂-၁၉၄၅ - စစ်ပွဲနှစ်များ'
          },
          description: {
            en: 'Temporary suspension of MBBS course during World War II. A modified curriculum was offered instead.',
            mm: 'ဒုတိယကမ္ဘာစစ်အတွင်း MBBS သင်တန်း ယာယီရပ်ဆိုင်းခဲ့သည်။ ပြုပြင်ထားသော သင်ရိုးညွှန်းတမ်းကို ပေးအပ်ခဲ့သည်'
          }
        },
        {
          id: 'milestone-7',
          icon: 'book',
          title: {
            en: '1946 - Faculty of Medicine',
            mm: '၁၉၄၆ - ဆေးတက္ကသိုလ်'
          },
          description: {
            en: 'Transformed into \'Faculty of Medicine\' under University of Rangoon on September 26th.',
            mm: 'စက်တင်ဘာ ၂၆ ရက်နေ့တွင် ရန်ကုန်တက္ကသိုလ်အောက်ရှိ \'ဆေးတက္ကသိုလ်\' အဖြစ် ပြောင်းလဲခဲ့သည်'
          }
        },
        {
          id: 'milestone-8',
          icon: 'flag',
          title: {
            en: '1948 - Independence Era',
            mm: '၁၉၄၈ - လွတ်လပ်ရေးခေတ်'
          },
          description: {
            en: 'Burma gained independence. The institution faced significant staffing challenges during this transition period.',
            mm: 'မြန်မာနိုင်ငံ လွတ်လပ်ရေးရခဲ့သည်။ ဤအကူးအပြောင်းကာလတွင် အဖွဲ့အစည်းသည် ဝန်ထမ်းအင်အား စိန်ခေါ်မှုများကို ရင်ဆိုင်ခဲ့ရသည်'
          }
        },
        {
          id: 'milestone-9',
          icon: 'users',
          title: {
            en: '1962-1964 - Institute Era',
            mm: '၁၉၆၂-၁၉၆၄ - အင်စတီကျုအခေျ'
          },
          description: {
            en: 'Administrative restructuring established the Institute of Medicine with a Rector as head. Postgraduate courses were introduced during this period.',
            mm: 'စီမံခန့်ခွဲမှု ပြန်လည်ဖွဲ့စည်းခြင်းဖြင့် ဆေးတက္ကသိုလ်အင်စတီကျုကို ဌာနမှူးတစ်ဦးဖြင့် တည်ထောင်ခဲ့သည်'
          }
        }
      ],
      layout: 'grid',
      columns: 3,
      showIcons: true
    },
    {
      _id: ObjectId(),
      name: 'CTA to Campuses',
      type: 'cta',
      order: 3,
      isEnabled: true,
      headline: {
        en: 'Explore Our Campuses',
        mm: 'ကျွန်ုပ်တို့၏ ကျောင်းဝင်းများကို လေ့လာပါ'
      },
      description: {
        en: 'Discover our three modern campuses equipped with state-of-the-art facilities for medical education.',
        mm: 'ဆေးပညာရေးအတွက် ခေတ်မှီအဆင့်မြင့် အထောက်အပံ့များဖြင့် တပ်ဆင်ထားသော ကျွန်ုပ်တို့၏ ခေတ်မီကျောင်းဝင်းသုံးခုကို ရှာဖွေပါ'
      },
      buttons: [
        {
          text: {
            en: 'View Campuses',
            mm: 'ကျောင်းဝင်းများကြည့်ရှုပါ'
          },
          url: '/campuses',
          style: 'primary',
          openInNewTab: false
        }
      ],
      backgroundColor: '#1F5CB7',
      alignment: 'center',
      size: 'medium'
    }
  ],
  organizationId: organizationId,
  departmentId: null,
  status: 'Published',
  publishedAt: currentDate,
  featuredImage: '',
  seo: {
    title: 'History - University of Medicine 1, Yangon',
    description: 'Discover the rich history of University of Medicine 1, Yangon from its founding in 1907 to becoming one of Myanmar\'s leading medical institutions.',
    keywords: ['history', 'university of medicine', 'yangon', 'medical education', 'MBBS', 'myanmar'],
    ogTitle: 'History - University of Medicine 1, Yangon',
    ogDescription: 'From 1907 to present - A century of medical education excellence'
  },
  template: 'default',
  layout: {
    type: 'boxed',
    background: {
      type: 'color',
      value: '#ffffff',
      opacity: 1
    }
  },
  viewCount: 0,
  isHomePage: false,
  isPublic: true,
  version: 1,
  createdBy: organizationId,
  updatedBy: organizationId,
  createdAt: currentDate,
  updatedAt: currentDate
};

const historyPageResult = db.pages.insertOne(historyPage);
const historyPageId = historyPageResult.insertedId;
print('History page created with ID:', historyPageId);

// =============================================================================
// 2. Create Campuses Page with Sections
// =============================================================================

print('Creating Campuses page...');

const campusesPage = {
  title: {
    en: 'Campuses',
    mm: 'ကျောင်းဝင်းများ'
  },
  slug: 'campuses',
  content: {
    en: '',  // Empty because we use sections
    mm: ''
  },
  excerpt: {
    en: 'The three campuses of University of Medicine 1, Yangon',
    mm: 'ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ကျောင်းဝင်းသုံးခု'
  },
  sections: [
    {
      _id: ObjectId(),
      name: 'Campuses Hero',
      type: 'hero',
      order: 1,
      isEnabled: true,
      content: {
        title: {
          en: 'Our Campuses',
          mm: 'ကျွန်ုပ်တို့၏ ကျောင်းဝင်းများ'
        },
        subtitle: {
          en: 'Three Modern Medical Education Facilities',
          mm: 'ခေတ်မီဆေးပညာရေး အဆောက်အအုံသုံးခု'
        },
        description: {
          en: 'The University of Medicine (1) operates three distinct campuses across Yangon, each designed to provide the best medical education experience.',
          mm: 'ဆေးတက္ကသိုလ် (၁) သည် ရန်ကုန်တစ်ဝှမ်းတွင် ကျောင်းဝင်းသုံးခု လည်ပတ်လျက်ရှိပြီး၊ အကောင်းဆုံးဆေးပညာရေး အတွေ့အကြုံကို ပေးအပ်ရန် ဒီဇိုင်းထုတ်ထားသည်'
        }
      },
      layout: 'centered',
      textAlign: 'center',
      backgroundImage: '',
      overlay: {
        enabled: true,
        color: '#1F5CB7',
        opacity: 0.7
      }
    },
    {
      _id: ObjectId(),
      name: 'Campus Overview',
      type: 'featureList',
      order: 2,
      isEnabled: true,
      headline: {
        en: 'Campus Locations',
        mm: 'ကျောင်းဝင်း တည်နေရာများ'
      },
      description: {
        en: 'Our three campuses are strategically located across Yangon to serve different stages of medical education.',
        mm: 'ကျွန်ုပ်တို့၏ ကျောင်းဝင်းသုံးခုသည် ဆေးပညာရေး အဆင့်များစွာကို ဝန်ဆောင်မှုပေးရန် ရန်ကုန်မြို့တစ်ဝှမ်းတွင် မဟာဗျူဟာကျစွာ တည်ရှိပါသည်'
      },
      features: [
        {
          id: 'campus-1',
          icon: 'map-pin',
          title: {
            en: 'Lanmadaw Campus',
            mm: 'လမ်းမတော်ကျောင်းဝင်း'
          },
          description: {
            en: 'Established in 1927 • Para-clinical Education • 2 Acres',
            mm: '၁၉၂၇ တွင် တည်ထောင် • Para-clinical ပညာရေး • ဧက ၂'
          }
        },
        {
          id: 'campus-2',
          icon: 'map-pin',
          title: {
            en: 'Pyay Campus',
            mm: 'ပြည်ကျောင်းဝင်း'
          },
          description: {
            en: 'Preclinical Education • Years 1-2 Students • Modern Facilities',
            mm: 'Preclinical ပညာရေး • နှစ် ၁-၂ ကျောင်းသားများ • ခေတ်မီအဆောက်အအုံများ'
          }
        },
        {
          id: 'campus-3',
          icon: 'map-pin',
          title: {
            en: 'Thahtone Campus',
            mm: 'သထုံးကျောင်းဝင်း'
          },
          description: {
            en: 'Preclinical Education • Adjacent to Pyay Campus • 3 Acres Combined',
            mm: 'Preclinical ပညာရေး • ပြည်ကျောင်းဝင်းနှင့် ကပ်လျက် • ပေါင်းဧက ၃'
          }
        }
      ],
      layout: 'grid',
      columns: 3,
      showIcons: true
    },
    {
      _id: ObjectId(),
      name: 'Pyay & Thahtone Details',
      type: 'content',
      order: 3,
      isEnabled: true,
      title: {
        en: 'Pyay and Thahtone Campuses',
        mm: 'ပြည်နှင့် သထုံးကျောင်းဝင်းများ'
      },
      content: {
        en: 'These two adjacent facilities span approximately 3 acres, separated by Thahtone street. They focus on preclinical education for first and second-year medical students.\n\n**Facilities include:**\n• 3 lecture halls (250-person capacity)\n• Botany and zoology laboratories\n• Chemistry and physics laboratories\n• Anatomy dissection hall\n• Physiology and biochemistry laboratories\n• Library services\n• Student recreation areas and canteen',
        mm: 'ဤကျောင်းဝင်းနှစ်ခုသည် သထုံးလမ်းဖြင့် ခွဲထားပြီး၊ ဧကခန့် ၃ ကျယ်ဝန်းသည်။ ပထမနှင့် ဒုတိယနှစ် ဆေးကျောင်းသားများအတွက် preclinical ပညာရေးကို အာရုံစိုက်သည်။\n\n**အဆောက်အအုံများတွင်:**\n• ကျောင်းခန်း ၃ ခန်း (လူ ၂၅၀ ဆံ့)\n• ရုက္ခဗေဒနှင့် သတ္တဗေဒဓါတ်ခွဲခန်းများ\n• ဓာတုဗေဒနှင့် ရူပဗေဒဓါတ်ခွဲခန်းများ\n• ခန္ဓာဗေဒခွဲခန်း\n• ဇီဝကမ္မဗေဒနှင့် ဇီဝဓာတုဗေဒဓါတ်ခွဲခန်းများ\n• စာကြည့်တိုက်ဝန်ဆောင်မှုများ\n• ကျောင်းသား အပန်းဖြေနေရာများနှင့် စားသောက်ဆိုင်'
      }
    },
    {
      _id: ObjectId(),
      name: 'Lanmadaw Details',
      type: 'content',
      order: 4,
      isEnabled: true,
      title: {
        en: 'Lanmadaw Campus',
        mm: 'လမ်းမတော်ကျောင်းဝင်း'
      },
      content: {
        en: 'Established in 1927, this 2-acre facility serves as the oldest campus and houses para-clinical instruction.\n\n**Key features:**\n• 3 lecture halls (300-person capacity)\n• 4 lecture halls (200-person capacity)\n• Multimedia teaching auditorium\n• Microbiology, pathology, and pharmacology laboratories\n• Common research laboratory\n• Medical resource center and skill laboratory\n• Medical Skill, Simulation and Research Center (opened December 2, 2019)\n• Administrative offices and library facilities\n• Canteen services',
        mm: '၁၉၂၇ ခုနှစ်တွင် တည်ထောင်ခဲ့သော ဧက ၂ အကျယ်အဝန်းရှိ ဤအဆောက်အအုံသည် အသက်ကြီးဆုံး ကျောင်းဝင်းအဖြစ် para-clinical သင်ကြားမှုကို ဆောင်ရွက်ပေးသည်။\n\n**အဓိက အင်္ဂါရပ်များ:**\n• ကျောင်းခန်း ၃ ခန်း (လူ ၃၀၀ ဆံ့)\n• ကျောင်းခန်း ၄ ခန်း (လူ ၂၀၀ ဆံ့)\n• မာလ်တီမီဒီယာ သင်ကြားမှုခန်းမ\n• အဏုဇီဝဗေဒ၊ ရောဂါဗေဒနှင့် ဆေးဝါးဗေဒ ဓါတ်ခွဲခန်းများ\n• အများသုံး သုတေသနဓါတ်ခွဲခန်း\n• ဆေးပညာအရင်းအမြစ်ဗဟိုနှင့် ကျွမ်းကျင်မှုဓါတ်ခွဲခန်း\n• ဆေးပညာကျွမ်းကျင်မှု၊ တုပခြင်းနှင့် သုတေသနဗဟိုဌာန (ဒီဇင်ဘာ ၂၊ ၂၀၁၉ တွင် ဖွင့်လှစ်)\n• စီမံခန့်ခွဲရေးရုံးများနှင့် စာကြည့်တိုက်အဆောက်အအုံများ\n• စားသောက်ဆိုင်ဝန်ဆောင်မှုများ'
      }
    },
    {
      _id: ObjectId(),
      name: 'CTA to History',
      type: 'cta',
      order: 5,
      isEnabled: true,
      headline: {
        en: 'Learn About Our History',
        mm: 'ကျွန်ုပ်တို့၏ သမိုင်းကို လေ့လာပါ'
      },
      description: {
        en: 'Discover the rich history of University of Medicine 1, Yangon from 1907 to present.',
        mm: '၁၉၀၇ မှ ယနေ့အထိ ရန်ကုန်ဆေးတက္ကသိုလ် (၁) ၏ ကြွယ်ဝသော သမိုင်းကို ရှာဖွေပါ'
      },
      buttons: [
        {
          text: {
            en: 'View History',
            mm: 'သမိုင်းကြည့်ရှုပါ'
          },
          url: '/history',
          style: 'primary',
          openInNewTab: false
        }
      ],
      backgroundColor: '#1F5CB7',
      alignment: 'center',
      size: 'medium'
    }
  ],
  organizationId: organizationId,
  departmentId: null,
  status: 'Published',
  publishedAt: currentDate,
  featuredImage: '',
  seo: {
    title: 'Campuses - University of Medicine 1, Yangon',
    description: 'Explore the three modern campuses of University of Medicine 1, Yangon - Lanmadaw, Pyay, and Thahtone campuses equipped with state-of-the-art facilities.',
    keywords: ['campuses', 'university of medicine', 'yangon', 'medical facilities', 'lanmadaw', 'pyay', 'thahtone'],
    ogTitle: 'Campuses - University of Medicine 1, Yangon',
    ogDescription: 'Three modern medical education facilities across Yangon'
  },
  template: 'default',
  layout: {
    type: 'boxed',
    background: {
      type: 'color',
      value: '#ffffff',
      opacity: 1
    }
  },
  viewCount: 0,
  isHomePage: false,
  isPublic: true,
  version: 1,
  createdBy: organizationId,
  updatedBy: organizationId,
  createdAt: currentDate,
  updatedAt: currentDate
};

const campusesPageResult = db.pages.insertOne(campusesPage);
const campusesPageId = campusesPageResult.insertedId;
print('Campuses page created with ID:', campusesPageId);

// =============================================================================
// 3. Update Navigation Menu in Settings
// =============================================================================

print('Updating navigation menu...');

const headerMenu = [
  {
    id: 'home',
    title: {
      en: 'Home',
      mm: 'ပင်မ'
    },
    url: '/',
    icon: '',
    cssClass: '',
    openInNewTab: false,
    requiresAuth: false,
    allowedRoles: [],
    children: []
  },
  {
    id: 'about',
    title: {
      en: 'About',
      mm: 'အကြောင်း'
    },
    url: '#',
    icon: '',
    cssClass: '',
    openInNewTab: false,
    requiresAuth: false,
    allowedRoles: [],
    children: [
      {
        id: 'history',
        title: {
          en: 'History',
          mm: 'သမိုင်း'
        },
        url: '/history',
        icon: '',
        cssClass: '',
        openInNewTab: false,
        requiresAuth: false,
        allowedRoles: [],
        children: []
      },
      {
        id: 'campuses',
        title: {
          en: 'Campuses',
          mm: 'ကျောင်းဝင်းများ'
        },
        url: '/campuses',
        icon: '',
        cssClass: '',
        openInNewTab: false,
        requiresAuth: false,
        allowedRoles: [],
        children: []
      }
    ]
  },
  {
    id: 'library',
    title: {
      en: 'Library',
      mm: 'စာကြည့်တိုက်'
    },
    url: '/library',
    icon: '',
    cssClass: '',
    openInNewTab: false,
    requiresAuth: false,
    allowedRoles: [],
    children: []
  }
];

const updateResult = db.settings.updateOne(
  { organizationId: organizationId },
  {
    $set: {
      headerMenu: headerMenu,
      updatedAt: currentDate
    }
  }
);

if (updateResult.modifiedCount > 0) {
  print('Navigation menu updated successfully');
} else {
  print('Warning: Navigation menu update did not modify any documents');
}

// =============================================================================
// Summary
// =============================================================================

print('\n=== Setup Complete ===');
print('History page ID:', historyPageId);
print('Campuses page ID:', campusesPageId);
print('Navigation menu: About > History, Campuses');
print('\nNext steps:');
print('1. Clear Redis cache');
print('2. Restart your Next.js application');
print('3. Visit your website and test the About dropdown menu');
