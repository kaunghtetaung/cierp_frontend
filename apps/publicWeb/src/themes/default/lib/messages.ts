/**
 * UI strings for the default theme. Mirrors the per-route `translations.ts`
 * pattern used elsewhere in publicWeb (see e.g. signup/translations.ts).
 *
 * Keys are grouped by template so an editor can scan the messages a
 * single template renders in one place. Add a Myanmar (`mm`) entry for
 * every English key — `pickMessage` falls back to `en` if the `mm`
 * value is missing, which keeps the renderer working when a new key
 * lands ahead of its translation.
 */

export type SupportedLanguage = "en" | "mm";

interface MessageMap {
  homePage: {
    notFoundTitle: string;
    notFoundMessage: string;
    notFoundHint: string;
    welcomeTitle: string;
    welcomeMessage: string;
  };
  contentPage: {
    notFoundTitle: string;
    notFoundMessageWithSlug: (slug: string) => string;
    notFoundMessage: string;
  };
  postPage: {
    notFoundTitle: string;
    notFoundMessageWithSlug: (slug: string) => string;
    notFoundMessage: string;
  };
  postList: {
    noPostsYet: string;
    onePost: string;
    countSuffix: string; // "posts"
    pageSuffix: string;
    emptyTitle: string;
    emptyMessage: string;
    viewMode: string;
    viewList: string;
    viewCard: string;
    viewTable: string;
  };
  faq: {
    emptyTitle: string;
    emptyMessage: string;
  };
  recentPosts: {
    noPosts: string;
  };
  section: {
    unknownTitle: string;
    unknownMessage: (type: string) => string;
    noEnrollmentTitle: string;
    noEnrollmentMessage: string;
    noProfileTitle: string;
    noProfileMessage: string;
    noOrgStructureTitle: string;
    noOrgStructureMessage: string;
  };
}

export const messages: Record<SupportedLanguage, MessageMap> = {
  en: {
    homePage: {
      notFoundTitle: "Home Page Not Found",
      notFoundMessage: "The home page has not been configured for this tenant.",
      notFoundHint: "Please contact the administrator to set up the home page.",
      welcomeTitle: "Welcome",
      welcomeMessage:
        "This home page is ready for content. Add sections to get started.",
    },
    contentPage: {
      notFoundTitle: "Page Not Found",
      notFoundMessageWithSlug: (slug: string) =>
        `The page "${slug}" could not be found.`,
      notFoundMessage: "The requested page could not be found.",
    },
    postPage: {
      notFoundTitle: "Post Not Found",
      notFoundMessageWithSlug: (slug: string) =>
        `The post "${slug}" could not be found.`,
      notFoundMessage: "The requested post could not be found.",
    },
    postList: {
      noPostsYet: "No posts yet",
      onePost: "1 post",
      countSuffix: "posts",
      pageSuffix: "page",
      emptyTitle: "No posts to show",
      emptyMessage: "Nothing has been published in this section yet.",
      viewMode: "View mode",
      viewList: "List view",
      viewCard: "Card view",
      viewTable: "Table view",
    },
    faq: {
      emptyTitle: "No FAQs Available",
      emptyMessage:
        "Frequently asked questions will be displayed here when available.",
    },
    recentPosts: {
      noPosts: "No posts available.",
    },
    section: {
      unknownTitle: "Unknown Section Type",
      unknownMessage: (type: string) =>
        `Section type "${type}" is not yet supported by the renderer.`,
      noEnrollmentTitle: "No Enrollment Data Available",
      noEnrollmentMessage:
        "Enrollment cards will be displayed here when configured.",
      noProfileTitle: "No Profile Available",
      noProfileMessage:
        "Leadership profile will be displayed here when configured.",
      noOrgStructureTitle: "No Organization Structure Available",
      noOrgStructureMessage:
        "Organization structure will be displayed here when available.",
    },
  },
  mm: {
    homePage: {
      notFoundTitle: "ပင်မစာမျက်နှာ မတွေ့ပါ",
      notFoundMessage: "ဤ tenant အတွက် ပင်မစာမျက်နှာကို configure မလုပ်ရသေးပါ။",
      notFoundHint: "ပင်မစာမျက်နှာကို စတင်ဖို့ administrator ကို ဆက်သွယ်ပါ။",
      welcomeTitle: "ကြိုဆိုပါသည်",
      welcomeMessage:
        "ဤပင်မစာမျက်နှာက အသုံးပြုဖို့ အသင့်ဖြစ်ပါပြီ။ စတင်ဖို့ sections တွေ ထည့်ပါ။",
    },
    contentPage: {
      notFoundTitle: "စာမျက်နှာ မတွေ့ပါ",
      notFoundMessageWithSlug: (slug: string) =>
        `"${slug}" စာမျက်နှာကို ရှာမတွေ့ပါ။`,
      notFoundMessage: "တောင်းဆိုသော စာမျက်နှာကို ရှာမတွေ့ပါ။",
    },
    postPage: {
      notFoundTitle: "Post မတွေ့ပါ",
      notFoundMessageWithSlug: (slug: string) =>
        `"${slug}" post ကို ရှာမတွေ့ပါ။`,
      notFoundMessage: "တောင်းဆိုသော post ကို ရှာမတွေ့ပါ။",
    },
    postList: {
      noPostsYet: "Post မရှိသေးပါ",
      onePost: "Post ၁ ခု",
      countSuffix: "ခု",
      pageSuffix: "စာမျက်နှာ",
      emptyTitle: "ပြသရန် post မရှိပါ",
      emptyMessage: "ဤ section တွင် ထုတ်ဝေထားသော post မရှိသေးပါ။",
      viewMode: "ပြသမှု ပုံစံ",
      viewList: "List ပုံစံ",
      viewCard: "Card ပုံစံ",
      viewTable: "Table ပုံစံ",
    },
    faq: {
      emptyTitle: "FAQ မရှိသေးပါ",
      emptyMessage:
        "မေးလေ့ရှိသော မေးခွန်းများကို ဤနေရာတွင် ပြသပါမည်။",
    },
    recentPosts: {
      noPosts: "Post မရှိပါ။",
    },
    section: {
      unknownTitle: "မသိရှိသော Section အမျိုးအစား",
      unknownMessage: (type: string) =>
        `"${type}" section အမျိုးအစားကို renderer က မ support ရသေးပါ။`,
      noEnrollmentTitle: "Enrollment ဒေတာ မရှိပါ",
      noEnrollmentMessage:
        "Configure လုပ်ပြီးပါက enrollment cards များကို ဤနေရာတွင် ပြသပါမည်။",
      noProfileTitle: "Profile မရှိပါ",
      noProfileMessage:
        "Configure လုပ်ပြီးပါက ခေါင်းဆောင် profile ကို ဤနေရာတွင် ပြသပါမည်။",
      noOrgStructureTitle: "ဖွဲ့စည်းပုံ မရှိပါ",
      noOrgStructureMessage:
        "ဖွဲ့စည်းပုံကို ဤနေရာတွင် ပြသပါမည်။",
    },
  },
};

/**
 * Pick the right language bundle. Falls back to English when the
 * caller passes an unsupported code so renderer paths can't crash on
 * an unexpected language value coming out of cookies/headers.
 */
export function getMessages(language: string | undefined): MessageMap {
  if (language === "mm") return messages.mm;
  return messages.en;
}
