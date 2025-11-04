/**
 * Translation strings for student registration form
 */

export const translations = {
  en: {
    // Personal Info Step
    nameMyanmarLabel: "Name (Myanmar)",
    nameMyanmarPlaceholder: "Enter name in Myanmar (Without Mg/Ma)",
    nameEnglishLabel: "Name (English)",
    nameEnglishPlaceholder: "Type in english (Without Mg/Ma)",
    genderLabel: "Gender",
    genderPlaceholder: "Select gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    raceLabel: "Race/Ethnicity",
    racePlaceholder: "Select or type ethnicity",
    religionLabel: "Religion",
    religionPlaceholder: "Select or type religion",
    bloodTypeLabel: "Blood Type",
    bloodTypePlaceholder: "Select blood type",
    placeOfBirthLabel: "Place of Birth",
    dateOfBirthLabel: "Date of Birth",
    nrcLabel: "NRC Number",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    emailPlaceholder: "email@example.com",
    studentPhotoLabel: "Student Photo",
    searchOrType: "Search or type custom...",
    pressEnterToUse: 'Press Enter to use "{value}"',

    // Wizard Steps
    personalInfoTitle: "Personal Information",
    personalInfoDesc: "Basic personal details and photo",
    addressInfoTitle: "Address Information",
    addressInfoDesc: "Location and address details",
    familyInfoTitle: "Family Information",
    familyInfoDesc: "Parent and guardian details",
    academicInfoTitle: "Academic History",
    academicInfoDesc: "Previous education information",
    currentAcademicTitle: "Current Academic",
    currentAcademicDesc: "Current enrollment details",
    additionalInfoTitle: "Additional Information",
    additionalInfoDesc: "Supporting documents and info",

    // Validation messages
    required: "This field is required",

    // Common
    loading: "Loading...",
    error: "Error",
  },
  mm: {
    // Personal Info Step
    nameMyanmarLabel: "အမည် (မြန်မာ)",
    nameMyanmarPlaceholder: "မြန်မာလို အမည်ထည့်ပါ (မောင်/မ) မပါရ",
    nameEnglishLabel: "အမည် (အင်္ဂလိပ်)",
    nameEnglishPlaceholder: "အင်္ဂလိပ်လို ရိုက်ထည့်ပါ (မောင်/မ မပါရ)",
    genderLabel: "ကျား/မ",
    genderPlaceholder: "ကျား/မ ရွေးချယ်ပါ",
    genderMale: "ကျား",
    genderFemale: "မ",
    genderOther: "အခြား",
    raceLabel: "လူမျိုး",
    racePlaceholder: "လူမျိုး ရွေးချယ် သို့မဟုတ် ရိုက်ထည့်ပါ",
    religionLabel: "ကိုးကွယ်သည့်ဘာသာ",
    religionPlaceholder: "ဘာသာ ရွေးချယ် သို့မဟုတ် ရိုက်ထည့်ပါ",
    bloodTypeLabel: "သွေးအမျိုးအစား",
    bloodTypePlaceholder: "သွေးအမျိုးအစား ရွေးချယ်ပါ",
    placeOfBirthLabel: "မွေးဖွားရာဇာတိ",
    dateOfBirthLabel: "မွေးသက္ကရာဇ်",
    nrcLabel: "မှတ်ပုံတင်အမှတ်",
    phoneLabel: "ဖုန်းနံပါတ်",
    emailLabel: "အီးမေးလ်လိပ်စာ",
    emailPlaceholder: "email@example.com",
    studentPhotoLabel: "ကျောင်းသားဓာတ်ပုံ",
    searchOrType: "ရှာဖွေရန် သို့မဟုတ် စာရိုက်ရန်...",
    pressEnterToUse: 'Enter နှိပ်ပြီး "{value}" သုံးပါ',

    // Wizard Steps
    personalInfoTitle: "ကိုယ်ရေးကိုယ်တာအချက်အလက်",
    personalInfoDesc: "အခြေခံကိုယ်ရေးအချက်အလက်နှင့် ဓာတ်ပုံ",
    addressInfoTitle: "လိပ်စာအချက်အလက်",
    addressInfoDesc: "တည်နေရာနှင့် လိပ်စာအသေးစိတ်",
    familyInfoTitle: "မိသားစုအချက်အလက်",
    familyInfoDesc: "မိဘနှင့် အုပ်ထိန်းသူအသေးစိတ်",
    academicInfoTitle: "ပညာရေးမှတ်တမ်း",
    academicInfoDesc: "ယခင်ပညာရေးအချက်အလက်",
    currentAcademicTitle: "လက်ရှိပညာရေး",
    currentAcademicDesc: "လက်ရှိစာရင်းသွင်းမှုအသေးစိတ်",
    additionalInfoTitle: "ထပ်ဆောင်းအချက်အလက်",
    additionalInfoDesc: "ပံ့ပိုးစာရွက်စာတမ်းများနှင့် သတင်းအချက်အလက်",

    // Validation messages
    required: "ဤအကွက်ဖြည့်ရန် လိုအပ်သည်",

    // Common
    loading: "ရယူနေသည်...",
    error: "အမှား",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Language = keyof typeof translations;
