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

    // Navigation
    previousButton: "Previous",
    nextButton: "Next",

    // Helper Text
    personalInfoHelper: "Please provide your basic personal information including your full name, date of birth, and contact details. Make sure all information matches your official documents.",
    addressInfoHelper: "Enter your current residential address and permanent address. If both addresses are the same, you can check 'Same as permanent address'.",
    familyInfoHelper: "Provide information about your parents or legal guardian. This information is required for emergency contacts and official records.",
    academicInfoHelper: "Fill in your previous education details including the examination board, class, roll number, and marks obtained. For matriculation exam (တက္ကသိုလ်ဝင်တန်း), please include all subjects and marks.",
    currentAcademicHelper: "Select your current academic year and batch. If you have a MEDM number, please provide it here.",
    additionalInfoHelper: "Provide any additional information such as hobbies, skills, medical conditions, or special requirements that the institution should be aware of.",

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

    // Navigation
    previousButton: "နောက်သို့",
    nextButton: "ရှေ့သို့",

    // Helper Text
    personalInfoHelper: "သင်၏ အခြေခံကိုယ်ရေးအချက်အလက်များဖြစ်သော အမည်အပြည့်အစုံ၊ မွေးသက္ကရာဇ်နှင့် ဆက်သွယ်ရန်အချက်အလက်များကို ထည့်သွင်းပေးပါ။ သင့်တရားဝင်စာရွက်စာတမ်းများနှင့် ကိုက်ညီကြောင်း သေချာစေပါ။",
    addressInfoHelper: "သင်၏ လက်ရှိနေထိုင်သည့်လိပ်စာနှင့် အမြဲတမ်းနေရပ်လိပ်စာကို ဖြည့်သွင်းပါ။ နှစ်ခုလုံးတူညီပါက 'အမြဲတမ်းလိပ်စာနှင့်တူသည်' ကို အမှန်ခြစ်နိုင်ပါသည်။",
    familyInfoHelper: "သင်၏မိဘ သို့မဟုတ် တရားဝင်အုပ်ထိန်းသူ၏ အချက်အလက်များကို ထည့်သွင်းပေးပါ။ ဤအချက်အလက်များသည် အရေးပေါ်ဆက်သွယ်ရန်နှင့် တရားဝင်မှတ်တမ်းများအတွက် လိုအပ်ပါသည်။",
    academicInfoHelper: "သင်၏ယခင်ပညာရေးအချက်အလက်များဖြစ်သော စာမေးပွဲအဖွဲ့၊ တန်း၊ ခုံအမှတ်နှင့် ရမှတ်များကို ဖြည့်သွင်းပါ။ တက္ကသိုလ်ဝင်တန်းအတွက် ဘာသာရပ်အားလုံးနှင့် ရမှတ်များကို ပါဝင်ပါစေ။",
    currentAcademicHelper: "သင်၏လက်ရှိပညာသင်နှစ်နှင့် အုပ်စုကို ရွေးချယ်ပါ။ MEDM နံပါတ်ရှိပါက ဤနေရာတွင် ထည့်သွင်းပေးပါ။",
    additionalInfoHelper: "အခြားထပ်ဆောင်းအချက်အလက်များဖြစ်သော ဝါသနာများ၊ ကျွမ်းကျင်မှုများ၊ ကျန်းမာရေးအခြေအနေများ သို့မဟုတ် အထူးလိုအပ်ချက်များကို ဖြည့်သွင်းပေးပါ။",

    // Common
    loading: "ရယူနေသည်...",
    error: "အမှား",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Language = keyof typeof translations;
