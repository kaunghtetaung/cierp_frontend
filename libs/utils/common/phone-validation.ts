// Enhanced phone number validation using libphonenumber-js for E.164 compliance
import { 
  isValidNumber, 
  parsePhoneNumber, 
  formatNumber,
  getNumberType,
  validatePhoneNumberLength,
  isSupportedCountry,
  type PhoneNumber
} from 'libphonenumber-js'

/**
 * Phone validation result with detailed information
 */
export interface PhoneValidationResult {
  isValid: boolean
  isE164: boolean
  isPossible: boolean
  country?: string
  type?: string
  nationalNumber?: string
  internationalNumber?: string
  e164Format?: string
  error?: string
  validationErrors: string[]
}

/**
 * Phone number information extracted from a valid number
 */
export interface PhoneNumberInfo {
  country?: string
  countryCallingCode?: string
  nationalNumber?: string
  internationalFormat?: string
  nationalFormat?: string
  e164Format?: string
  uri?: string
  type?: string
  isPossible: boolean
  isValid: boolean
}

/**
 * Validates if a phone number is in proper E.164 format
 * E.164 format: +[country code][national number] (no spaces, dashes, or other formatting)
 */
export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  // E.164 must start with + and contain only digits after that
  if (!phone.startsWith('+')) return false
  
  // Remove the + and check if the rest are all digits
  const digits = phone.slice(1)
  if (!/^\d+$/.test(digits)) return false
  
  // Length check: E.164 allows 7-15 digits after the +
  if (digits.length < 7 || digits.length > 15) return false
  
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber ? phoneNumber.isValid() : false
  } catch {
    return false
  }
}

/**
 * Converts a phone number to E.164 format
 * Returns null if the number cannot be converted to valid E.164
 */
export function formatToE164(phone: string, defaultCountry?: string): string | null {
  if (!phone || typeof phone !== 'string') return null
  
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry as any)
    if (!phoneNumber || !phoneNumber.isValid()) return null
    
    return phoneNumber.number // This returns E.164 format
  } catch {
    return null
  }
}

/**
 * Comprehensive phone number validation with detailed results
 */
export function validatePhoneNumber(
  phone: string, 
  options: {
    defaultCountry?: string
    requireE164?: boolean
    allowInternational?: boolean
  } = {}
): PhoneValidationResult {
  const { defaultCountry, requireE164 = false, allowInternational = true } = options
  const result: PhoneValidationResult = {
    isValid: false,
    isE164: false,
    isPossible: false,
    validationErrors: []
  }
  
  if (!phone || typeof phone !== 'string') {
    result.validationErrors.push('Phone number is required')
    result.error = 'Phone number is required'
    return result
  }
  
  // Clean the phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Check if E.164 format is required
  if (requireE164) {
    result.isE164 = isValidE164(cleanPhone)
    if (!result.isE164) {
      result.validationErrors.push('Phone number must be in E.164 format (e.g., +1234567890)')
      result.error = 'Invalid E.164 format'
      return result
    }
  }
  
  try {
    // Parse the phone number
    const phoneNumber = parsePhoneNumber(cleanPhone, defaultCountry as any)
    
    if (!phoneNumber) {
      result.validationErrors.push('Unable to parse phone number')
      result.error = 'Invalid phone number format'
      return result
    }
    
    // Check if international format is allowed
    if (!allowInternational && phoneNumber.country !== defaultCountry) {
      result.validationErrors.push(`Phone number must be from ${defaultCountry}`)
      result.error = `Invalid country code`
      return result
    }
    
    // Set basic information
    result.country = phoneNumber.country
    result.nationalNumber = phoneNumber.nationalNumber
    result.internationalNumber = phoneNumber.formatInternational()
    result.e164Format = phoneNumber.number
    result.isPossible = phoneNumber.isPossible()
    result.isValid = phoneNumber.isValid()
    result.isE164 = isValidE164(phoneNumber.number)
    
    // Get phone number type
    try {
      result.type = phoneNumber.getType()
    } catch {
      // Type detection might fail for some numbers, that's okay
    }
    
    // Validate length
    const lengthValidation = validatePhoneNumberLength(cleanPhone, defaultCountry as any)
    if (lengthValidation) {
      result.validationErrors.push(`Phone number length is invalid: ${lengthValidation}`)
      if (!result.error) result.error = lengthValidation
    }
    
    // Final validation
    if (!result.isValid) {
      result.validationErrors.push('Phone number is not valid')
      if (!result.error) result.error = 'Invalid phone number'
    }
    
    return result
  } catch (error) {
    result.validationErrors.push('Phone number parsing failed')
    result.error = error instanceof Error ? error.message : 'Phone number parsing failed'
    return result
  }
}

/**
 * Get detailed information about a phone number
 */
export function getPhoneNumberInfo(phone: string, defaultCountry?: string): PhoneNumberInfo | null {
  if (!phone || typeof phone !== 'string') return null
  
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry as any)
    if (!phoneNumber) return null
    
    return {
      country: phoneNumber.country,
      countryCallingCode: phoneNumber.countryCallingCode,
      nationalNumber: phoneNumber.nationalNumber,
      internationalFormat: phoneNumber.formatInternational(),
      nationalFormat: phoneNumber.formatNational(),
      e164Format: phoneNumber.number,
      uri: phoneNumber.getURI(),
      type: phoneNumber.getType(),
      isPossible: phoneNumber.isPossible(),
      isValid: phoneNumber.isValid()
    }
  } catch {
    return null
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(
  phone: string, 
  format: 'international' | 'national' | 'e164' | 'uri' = 'international',
  defaultCountry?: string
): string {
  if (!phone) return phone
  
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry as any)
    if (!phoneNumber) return phone
    
    switch (format) {
      case 'international':
        return phoneNumber.formatInternational()
      case 'national':
        return phoneNumber.formatNational()
      case 'e164':
        return phoneNumber.number
      case 'uri':
        return phoneNumber.getURI()
      default:
        return phoneNumber.formatInternational()
    }
  } catch {
    return phone
  }
}

/**
 * Check if a country code is supported
 */
export function isSupportedPhoneCountry(countryCode: string): boolean {
  return isSupportedCountry(countryCode)
}

/**
 * Get example phone number for a country (for placeholder text)
 */
export function getExamplePhoneNumber(countryCode: string): string | null {
  try {
    // This is a simplified example - in a real implementation,
    // you might want to import examples from libphonenumber-js/examples
    const examples: Record<string, string> = {
      'US': '+1 (555) 000-0000',
      'MM': '+95 9 000 000 000',
      'GB': '+44 20 0000 0000',
      'DE': '+49 30 00000000',
      'FR': '+33 1 00 00 00 00',
      'JP': '+81 3-0000-0000',
      'AU': '+61 2 0000 0000',
      'CA': '+1 (555) 000-0000',
      'IN': '+91 11111 11111',
      'CN': '+86 138 0000 0000'
    }
    
    return examples[countryCode] || null
  } catch {
    return null
  }
}

/**
 * Validation for React Hook Form / Zod integration
 */
export function createPhoneValidation(options: {
  required?: boolean
  requireE164?: boolean
  defaultCountry?: string
  allowInternational?: boolean
  customErrorMessage?: string
} = {}) {
  return (value: string) => {
    if (!options.required && !value) return true
    if (options.required && !value) return 'Phone number is required'
    
    const validation = validatePhoneNumber(value, {
      defaultCountry: options.defaultCountry,
      requireE164: options.requireE164,
      allowInternational: options.allowInternational
    })
    
    if (!validation.isValid) {
      return options.customErrorMessage || validation.error || 'Invalid phone number'
    }
    
    return true
  }
}