// Frontend Multilingual Error Messages Repository
// Provides localized error messages for client-side errors that don't come from backend

export interface LocalizedMessage {
  en: string;
  mm: string;
}

/**
 * Frontend-specific error messages for client-side scenarios
 * Backend errors should use the localized message from backend response
 */
export const frontendErrorMessages: Record<string, LocalizedMessage> = {
  // Network and connectivity errors
  NETWORK_CONNECTION_FAILED: {
    en: "Network connection failed. Please check your internet connection and try again.",
    mm: "ကွန်ယက် ချိတ်ဆက်မှု မအောင်မြင်ပါ။ သင့်အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။"
  },
  
  NETWORK_TIMEOUT: {
    en: "Request timed out. Please check your connection and try again.",
    mm: "တောင်းဆိုမှု အချိန်ကုန်သွားသည်။ သင့်ချိတ်ဆက်မှုကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။"
  },
  
  NETWORK_OFFLINE: {
    en: "You appear to be offline. Please check your internet connection.",
    mm: "သင် အော့ဖ်လိုင်းဖြစ်နေပုံရသည်။ ကျေးဇူးပြု၍ သင့်အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ။"
  },

  // Client-side validation errors
  CLIENT_VALIDATION_FAILED: {
    en: "Please check your input and correct any errors before submitting.",
    mm: "ကျေးဇူးပြု၍ သင့်ထည့်သွင်းမှုကို စစ်ဆေး၍ အမှားများကို ပြင်ဆင်ပြီး တင်သွင်းပါ។"
  },
  
  REQUIRED_FIELD_MISSING: {
    en: "Please fill in all required fields.",
    mm: "ကျေးဇူးပြု၍ လိုအပ်သော အကွက်များအားလုံးကို ဖြည့်စွက်ပါ။"
  },

  INVALID_EMAIL_FORMAT: {
    en: "Please enter a valid email address.",
    mm: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာကို ထည့်သွင်းပါ။"
  },

  INVALID_PASSWORD_FORMAT: {
    en: "Password must be at least 8 characters long and contain letters and numbers.",
    mm: "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်ဖြစ်ပြီး စာလုံးများနှင့် ဂဏန်းများ ပါဝင်ရမည်။"
  },

  // Component and UI errors
  COMPONENT_LOAD_FAILED: {
    en: "Failed to load component. Please refresh the page and try again.",
    mm: "ကွန်ပိုနန့်ကို တင်ရန် မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေ၍ ထပ်မံကြိုးစားပါ။"
  },

  FORM_SUBMISSION_FAILED: {
    en: "Failed to submit form. Please check your input and try again.",
    mm: "ဖောင်ကို တင်သွင်းရန် မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ သင့်ထည့်သွင်းမှုကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။"
  },

  FILE_UPLOAD_FAILED: {
    en: "File upload failed. Please check the file size and format, then try again.",
    mm: "ဖိုင်တင်ခြင်း မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ ဖိုင်အရွယ်အစားနှင့် ပုံစံကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။"
  },

  // Data loading errors
  DATA_LOAD_FAILED: {
    en: "Failed to load data. Please refresh the page or try again later.",
    mm: "ဒေတာ တင်ရန် မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေ သို့မဟုတ် နောက်မှ ထပ်မံကြိုးစားပါ။"
  },

  SEARCH_FAILED: {
    en: "Search failed. Please check your search terms and try again.",
    mm: "ရှာဖွေခြင်း မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ သင့်ရှာဖွေသော စကားလုံးများကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။"
  },

  // Permission and access errors (frontend detection)
  INSUFFICIENT_PERMISSIONS: {
    en: "You don't have permission to perform this action. Please contact your administrator.",
    mm: "ဤလုပ်ဆောင်ချက်ကို ပြုလုပ်ရန် သင့်တွင် ခွင့်ပြုချက် မရှိပါ။ ကျေးဇူးပြု၍ သင့်အုပ်ချုပ်ရေးမှူးကို ဆက်သွယ်ပါ။"
  },

  SESSION_EXPIRED: {
    en: "Your session has expired. Please log in again.",
    mm: "သင့်သုံးစွဲချိန် ကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ ထပ်မံ လော့ဂ်အင်ဝင်ပါ။"
  },

  // Generic fallback messages
  UNEXPECTED_ERROR: {
    en: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    mm: "မမျှော်လင့်ထားသော အမှားအယွင်းတစ်ခု ဖြစ်ပွားခဲ့သည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစား သို့မဟုတ် ပြဿနာ ဆက်လက်ရှိနေပါက ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ။"
  },

  GENERIC_ERROR: {
    en: "Something went wrong. Please try again.",
    mm: "တစ်ခုခု မှားယွင်းနေသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။"
  },

  OPERATION_CANCELLED: {
    en: "Operation was cancelled.",
    mm: "လုပ်ဆောင်ချက်ကို ပယ်ဖျက်လိုက်ပါပြီ။"
  },

  // Navigation and routing errors
  PAGE_NOT_FOUND: {
    en: "The page you're looking for doesn't exist.",
    mm: "သင်ရှာဖွေနေသော စာမျက်နှာ မရှိပါ။"
  },

  NAVIGATION_FAILED: {
    en: "Failed to navigate to the requested page.",
    mm: "တောင်းဆိုထားသော စာမျက်နှာသို့ သွားရန် မအောင်မြင်ပါ။"
  },

  // Feature-specific errors
  LANGUAGE_SWITCH_FAILED: {
    en: "Failed to switch language. Please try again.",
    mm: "ဘာသာစကား ပြောင်းလဲရန် မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။"
  },

  THEME_SWITCH_FAILED: {
    en: "Failed to switch theme. Please try again.",
    mm: "အပြင်အဆင် ပြောင်းလဲရန် မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။"
  }
};

/**
 * Recovery action suggestions for different error types
 */
export const errorRecoveryActions: Record<string, LocalizedMessage[]> = {
  NETWORK_CONNECTION_FAILED: [
    {
      en: "Check your internet connection",
      mm: "သင့်အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ"
    },
    {
      en: "Try refreshing the page",
      mm: "စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေကြည့်ပါ"
    },
    {
      en: "Contact support if problem persists",
      mm: "ပြဿနာ ဆက်လက်ရှိနေပါက ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ"
    }
  ],

  CLIENT_VALIDATION_FAILED: [
    {
      en: "Check all required fields",
      mm: "လိုအပ်သော အကွက်များအားလုံးကို စစ်ဆေးပါ"
    },
    {
      en: "Verify input formats",
      mm: "ထည့်သွင်းမှု ပုံစံများကို စစ်ဆေးပါ"
    },
    {
      en: "Try submitting again",
      mm: "ထပ်မံ တင်သွင်းကြည့်ပါ"
    }
  ],

  INSUFFICIENT_PERMISSIONS: [
    {
      en: "Contact your administrator",
      mm: "သင့်အုပ်ချုပ်ရေးမှူးကို ဆက်သွယ်ပါ"
    },
    {
      en: "Check your user role",
      mm: "သင့်သုံးစွဲသူ အခန်းကဏ္ဍကို စစ်ဆေးပါ"
    },
    {
      en: "Request access permissions",
      mm: "ဝင်ရောက်ခွင့် ခွင့်ပြုချက်ကို တောင်းဆိုပါ"
    }
  ]
};

/**
 * Get localized error message
 */
export function getLocalizedErrorMessage(
  errorKey: string, 
  language: 'en' | 'mm' = 'en'
): string {
  const message = frontendErrorMessages[errorKey];
  if (!message) {
    return frontendErrorMessages.GENERIC_ERROR[language];
  }
  return message[language] || message.en;
}

/**
 * Get localized recovery actions
 */
export function getLocalizedRecoveryActions(
  errorKey: string,
  language: 'en' | 'mm' = 'en'
): string[] {
  const actions = errorRecoveryActions[errorKey];
  if (!actions) {
    return [];
  }
  return actions.map(action => action[language] || action.en);
}

/**
 * Error message categories for better organization
 */
export const ErrorMessageCategories = {
  NETWORK: ['NETWORK_CONNECTION_FAILED', 'NETWORK_TIMEOUT', 'NETWORK_OFFLINE'],
  VALIDATION: ['CLIENT_VALIDATION_FAILED', 'REQUIRED_FIELD_MISSING', 'INVALID_EMAIL_FORMAT', 'INVALID_PASSWORD_FORMAT'],
  COMPONENT: ['COMPONENT_LOAD_FAILED', 'FORM_SUBMISSION_FAILED', 'FILE_UPLOAD_FAILED'],
  DATA: ['DATA_LOAD_FAILED', 'SEARCH_FAILED'],
  PERMISSION: ['INSUFFICIENT_PERMISSIONS', 'SESSION_EXPIRED'],
  NAVIGATION: ['PAGE_NOT_FOUND', 'NAVIGATION_FAILED'],
  FEATURE: ['LANGUAGE_SWITCH_FAILED', 'THEME_SWITCH_FAILED'],
  GENERIC: ['UNEXPECTED_ERROR', 'GENERIC_ERROR', 'OPERATION_CANCELLED']
} as const;