/**
 * Myanmar National Registration Card (NRC) validation utilities
 *
 * NRC Format: State/Township(CitizenshipType)SerialNumber
 * Example: 12/MaGaTa(N)123456
 */

// Myanmar State/Region codes and names
export const MYANMAR_STATES = [
  { code: 1, nameEn: "Kachin State", nameMm: "ကချင်ပြည်နယ်" },
  { code: 2, nameEn: "Kayah State", nameMm: "ကယားပြည်နယ်" },
  { code: 3, nameEn: "Kayin State", nameMm: "ကရင်ပြည်နယ်" },
  { code: 4, nameEn: "Chin State", nameMm: "ချင်းပြည်နယ်" },
  { code: 5, nameEn: "Sagaing Region", nameMm: "စစ်ကိုင်းတိုင်းဒေသကြီး" },
  { code: 6, nameEn: "Tanintharyi Region", nameMm: "တနင်္သာရီတိုင်းဒေသကြီး" },
  { code: 7, nameEn: "Bago Region", nameMm: "ပဲခူးတိုင်းဒေသကြီး" },
  { code: 8, nameEn: "Magway Region", nameMm: "မကွေးတိုင်းဒေသကြီး" },
  { code: 9, nameEn: "Mandalay Region", nameMm: "မန္တလေးတိုင်းဒေသကြီး" },
  { code: 10, nameEn: "Mon State", nameMm: "မွန်ပြည်နယ်" },
  { code: 11, nameEn: "Rakhine State", nameMm: "ရခိုင်ပြည်နယ်" },
  { code: 12, nameEn: "Yangon Region", nameMm: "ရန်ကုန်တိုင်းဒေသကြီး" },
  { code: 13, nameEn: "Shan State", nameMm: "ရှမ်းပြည်နယ်" },
  { code: 14, nameEn: "Ayeyarwady Region", nameMm: "ဧရာဝတီတိုင်းဒေသကြီး" }
] as const;

// Citizenship types
export const CITIZENSHIP_TYPES = [
  { code: "N", nameEn: "Citizen", nameMm: "နိုင်ငံသား", description: "Naing-ngan (Citizen)" },
  { code: "E", nameEn: "Associate Citizen", nameMm: "ဧည့်နိုင်ငံသား", description: "Associate Citizen" },
  { code: "A", nameEn: "Naturalized Citizen", nameMm: "နိုင်ငံသားပြု", description: "Naturalized Citizen" },
  { code: "P", nameEn: "Provisional ID", nameMm: "ယာယီကတ်", description: "Provisional ID" }
] as const;

// Common Myanmar township codes (comprehensive list would be larger)
export const COMMON_TOWNSHIP_CODES = [
  // Myanmar script
  "မဂတ", "ရမန", "တခက", "လမန", "မမတ", "ပဇတ", "သကက", "အလမ", "ကမရ",
  "ဗဟန", "ဗတန", "လန", "မလန", "သငန", "တငန", "ကရဇ", "ဒရမ", "ဒဂအ",
  "ဇတန", "ကဇန", "လကန", "မရဇ", "ရကန", "သနလ", "တကအ", "ဝမန", "ရသန",
  // English transliteration
  "MaGaTa", "YaMaNa", "TaKhaKa", "LaMaNa", "MaMaTa", "PaZaTa", "ThaKaKa",
  "AhLaMa", "KaMaYa", "BaHaNa", "BaTaNa", "LaNa", "MaLaNa", "ThaNgaNa",
  "TaNgaNa", "KaRaNa", "DaRaMa", "DaGaOo", "ZaTaNa", "KaNa", "LaKaNa",
  "MaRaNa", "YaKaNa", "ThaNaLa", "TaKaOo", "WaMaNa", "YaThaNa"
] as const;

export type CitizenshipType = typeof CITIZENSHIP_TYPES[number]['code'];
export type StateCode = typeof MYANMAR_STATES[number]['code'];

export interface NrcParts {
  state: string;
  township: string;
  citizenship: string;
  serial: string;
}

export interface NrcValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Regular expression pattern for Myanmar NRC validation
 * Format: State(1-2 digits)/Township(3-6 chars)(CitizenshipType)Serial(1-6 digits)
 */
export const NRC_REGEX = /^(\d{1,2})\/([A-Za-z\u1000-\u109F]{3,6})\(([NEAP])\)(\d{1,6})$/;

/**
 * Parse NRC string into its component parts
 */
export function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { state: "", township: "", citizenship: "", serial: "" };
  }

  const match = nrcString.match(NRC_REGEX);

  if (match) {
    return {
      state: match[1],
      township: match[2],
      citizenship: match[3] as CitizenshipType,
      serial: match[4]
    };
  }

  return { state: "", township: "", citizenship: "", serial: "" };
}

/**
 * Format NRC parts into complete string
 */
export function formatNrc(parts: NrcParts): string {
  const { state, township, citizenship, serial } = parts;

  if (!state || !township || !citizenship || !serial) {
    return "";
  }

  return `${state}/${township}(${citizenship})${serial}`;
}

/**
 * Validate Myanmar NRC format and components
 */
export function validateNrc(nrcString: string, options: {
  strictTownshipValidation?: boolean;
  allowPartial?: boolean;
} = {}): NrcValidationResult {
  const { strictTownshipValidation = false, allowPartial = false } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nrcString) {
    if (!allowPartial) {
      errors.push("NRC is required");
    }
    return { isValid: allowPartial, errors, warnings };
  }

  // Check overall format
  if (!NRC_REGEX.test(nrcString)) {
    errors.push("Invalid NRC format. Expected: State/Township(Type)Serial (e.g., 12/MaGaTa(N)123456)");
    return { isValid: false, errors, warnings };
  }

  const parts = parseNrc(nrcString);

  // State validation
  const stateNum = parseInt(parts.state);
  if (!parts.state || isNaN(stateNum) || stateNum < 1 || stateNum > 14) {
    errors.push("Invalid state/region code (must be 1-14)");
  }

  // Township validation
  if (!parts.township) {
    errors.push("Township code is required");
  } else if (parts.township.length < 3) {
    errors.push("Township code must be at least 3 characters");
  } else if (parts.township.length > 6) {
    errors.push("Township code must not exceed 6 characters");
  } else if (strictTownshipValidation && !COMMON_TOWNSHIP_CODES.includes(parts.township as any)) {
    warnings.push("Township code not found in common codes list. Please verify.");
  }

  // Citizenship validation
  if (!parts.citizenship) {
    errors.push("Citizenship type is required");
  } else if (!["N", "E", "A", "P"].includes(parts.citizenship)) {
    errors.push("Invalid citizenship type (must be N, E, A, or P)");
  }

  // Serial validation
  const serialNum = parseInt(parts.serial);
  if (!parts.serial) {
    errors.push("Serial number is required");
  } else if (isNaN(serialNum)) {
    errors.push("Serial number must be numeric");
  } else if (parts.serial.length > 6) {
    errors.push("Serial number must not exceed 6 digits");
  } else if (serialNum <= 0) {
    errors.push("Serial number must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate individual NRC components
 */
export function validateNrcParts(parts: NrcParts, options: {
  strictTownshipValidation?: boolean;
} = {}): NrcValidationResult {
  const { strictTownshipValidation = false } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  // State validation
  if (parts.state) {
    const stateNum = parseInt(parts.state);
    if (isNaN(stateNum) || stateNum < 1 || stateNum > 14) {
      errors.push("Invalid state/region code (must be 1-14)");
    }
  }

  // Township validation
  if (parts.township) {
    if (parts.township.length < 3) {
      errors.push("Township code must be at least 3 characters");
    } else if (parts.township.length > 6) {
      errors.push("Township code must not exceed 6 characters");
    } else if (strictTownshipValidation && !COMMON_TOWNSHIP_CODES.includes(parts.township as any)) {
      warnings.push("Township code not found in common codes list");
    }
  }

  // Citizenship validation
  if (parts.citizenship) {
    if (!["N", "E", "A", "P"].includes(parts.citizenship)) {
      errors.push("Invalid citizenship type (must be N, E, A, or P)");
    }
  }

  // Serial validation
  if (parts.serial) {
    const serialNum = parseInt(parts.serial);
    if (isNaN(serialNum)) {
      errors.push("Serial number must be numeric");
    } else if (parts.serial.length > 6) {
      errors.push("Serial number must not exceed 6 digits");
    } else if (serialNum <= 0) {
      errors.push("Serial number must be greater than 0");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Get state name by code
 */
export function getStateName(stateCode: number, language: 'en' | 'mm' = 'en'): string {
  const state = MYANMAR_STATES.find(s => s.code === stateCode);
  return state ? (language === 'mm' ? state.nameMm : state.nameEn) : '';
}

/**
 * Get citizenship type name by code
 */
export function getCitizenshipTypeName(code: CitizenshipType, language: 'en' | 'mm' = 'en'): string {
  const type = CITIZENSHIP_TYPES.find(t => t.code === code);
  return type ? (language === 'mm' ? type.nameMm : type.nameEn) : '';
}

/**
 * Check if township code exists in common codes
 */
export function isCommonTownshipCode(townshipCode: string): boolean {
  return COMMON_TOWNSHIP_CODES.includes(townshipCode as any);
}

/**
 * Normalize NRC string for storage/comparison
 */
export function normalizeNrc(nrcString: string): string {
  const parts = parseNrc(nrcString.trim());
  if (!parts.state || !parts.township || !parts.citizenship || !parts.serial) {
    return '';
  }
  return formatNrc(parts);
}

/**
 * Generate Zod schema for NRC validation
 */
export function createNrcZodSchema(options: {
  strictTownshipValidation?: boolean;
  required?: boolean;
} = {}) {
  const { strictTownshipValidation = false, required = true } = options;

  return {
    pattern: NRC_REGEX.source,
    errorMessage: {
      en: "Invalid NRC format. Expected: State/Township(Type)Serial (e.g., 12/MaGaTa(N)123456)",
      mm: "NRC ပုံစံမှားနေပါသည်။ မှန်ကန်သောပုံစံ: ပြည်နယ်/မြို့နယ်(အမျိုးအစား)ကြေးဇဇ (ဥပမာ: ၁၂/မဂတ(နိုင်)၁၂၃၄၅၆)"
    },
    required,
    custom: (value: string) => {
      const validation = validateNrc(value, { strictTownshipValidation });
      return validation.isValid;
    }
  };
}