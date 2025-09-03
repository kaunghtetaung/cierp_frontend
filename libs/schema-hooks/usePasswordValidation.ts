'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { validatePassword } from '@repo/utils/common/validation'
import type { PasswordStrengthConfig, PasswordStrengthResult } from '@repo/types'

interface UsePasswordValidationOptions {
  config?: PasswordStrengthConfig
  currentLanguage?: string
  debounceMs?: number
}

/**
 * Enhanced password validation hook with real-time strength checking
 */
export function usePasswordValidation(
  password: string,
  options: UsePasswordValidationOptions = {}
) {
  const { config, currentLanguage = 'en', debounceMs = 300 } = options
  const [debouncedPassword, setDebouncedPassword] = useState(password)

  // Debounce password input to avoid excessive computation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPassword(password)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [password, debounceMs])

  // Default configuration with multilingual messages
  const defaultConfig: Required<PasswordStrengthConfig> = useMemo(() => ({
    minLength: config?.minLength ?? 8,
    requireUppercase: config?.requireUppercase ?? true,
    requireLowercase: config?.requireLowercase ?? true,
    requireNumbers: config?.requireNumbers ?? true,
    requireSpecialChars: config?.requireSpecialChars ?? true,
    specialChars: config?.specialChars ?? '@$!%*?&',
    showRequirements: config?.showRequirements ?? true,
    showStrengthMeter: config?.showStrengthMeter ?? true,
    strengthLabels: config?.strengthLabels ?? {
      weak: { en: 'Weak', mm: 'အားနည်း' },
      medium: { en: 'Medium', mm: 'အသင့်အတင့်' },
      strong: { en: 'Strong', mm: 'အားကောင်း' }
    },
    requirementMessages: config?.requirementMessages ?? {
      minLength: { 
        en: `At least ${config?.minLength ?? 8} characters`, 
        mm: `အနည်းဆုံး ${config?.minLength ?? 8} လုံး` 
      },
      uppercase: { en: 'Contains uppercase letters', mm: 'စာလုံးကြီးများ ပါဝင်ရမည်' },
      lowercase: { en: 'Contains lowercase letters', mm: 'စာလုံးသေးများ ပါဝင်ရမည်' },
      numbers: { en: 'Contains numbers', mm: 'ဂဏန်းများ ပါဝင်ရမည်' },
      specialChars: { 
        en: 'Contains special characters', 
        mm: 'အထူးအက္ခရာများ ပါဝင်ရမည်' 
      }
    }
  }), [config, currentLanguage])

  // Enhanced password validation with custom configuration
  const validatePasswordStrength = useCallback((pwd: string): PasswordStrengthResult => {
    if (!pwd) {
      return {
        score: 0,
        level: 'weak',
        requirements: {
          minLength: false,
          uppercase: false,
          lowercase: false,
          numbers: false,
          specialChars: false
        },
        errors: [],
        isValid: false
      }
    }

    // Use existing validation utility as base
    const baseValidation = validatePassword(pwd)
    
    // Enhanced validation with custom config
    const requirements = {
      minLength: pwd.length >= defaultConfig.minLength,
      uppercase: defaultConfig.requireUppercase ? /[A-Z]/.test(pwd) : true,
      lowercase: defaultConfig.requireLowercase ? /[a-z]/.test(pwd) : true,
      numbers: defaultConfig.requireNumbers ? /[0-9]/.test(pwd) : true,
      specialChars: defaultConfig.requireSpecialChars 
        ? new RegExp(`[${defaultConfig.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(pwd)
        : true
    }

    // Calculate score based on requirements
    let score = 0
    const totalRequirements = Object.values(requirements).filter(Boolean).length
    const metRequirements = Object.values(requirements).reduce((count, met) => count + (met ? 1 : 0), 0)
    
    // Base score from requirement completion
    score = (metRequirements / Object.keys(requirements).length) * 70
    
    // Bonus points for length
    if (pwd.length >= 12) score += 15
    else if (pwd.length >= 10) score += 10
    else if (pwd.length >= 8) score += 5
    
    // Bonus for variety
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) {
      score += 15
    }

    score = Math.min(100, Math.max(0, score))

    // Determine strength level
    let level: 'weak' | 'medium' | 'strong'
    if (score >= 70) level = 'strong'
    else if (score >= 40) level = 'medium'
    else level = 'weak'

    // Generate errors for unmet requirements
    const errors: string[] = []
    if (!requirements.minLength) {
      const message = defaultConfig.requirementMessages.minLength
      errors.push(typeof message === 'string' ? message : message[currentLanguage] || message.en)
    }
    if (!requirements.uppercase && defaultConfig.requireUppercase) {
      const message = defaultConfig.requirementMessages.uppercase
      errors.push(typeof message === 'string' ? message : message[currentLanguage] || message.en)
    }
    if (!requirements.lowercase && defaultConfig.requireLowercase) {
      const message = defaultConfig.requirementMessages.lowercase
      errors.push(typeof message === 'string' ? message : message[currentLanguage] || message.en)
    }
    if (!requirements.numbers && defaultConfig.requireNumbers) {
      const message = defaultConfig.requirementMessages.numbers
      errors.push(typeof message === 'string' ? message : message[currentLanguage] || message.en)
    }
    if (!requirements.specialChars && defaultConfig.requireSpecialChars) {
      const message = defaultConfig.requirementMessages.specialChars
      errors.push(typeof message === 'string' ? message : message[currentLanguage] || message.en)
    }

    return {
      score,
      level,
      requirements,
      errors,
      isValid: errors.length === 0 && score >= 40 // Minimum medium strength required
    }
  }, [defaultConfig, currentLanguage])

  // Calculate strength result
  const strengthResult = useMemo(() => 
    validatePasswordStrength(debouncedPassword), 
    [debouncedPassword, validatePasswordStrength]
  )

  // Get localized strength label
  const getStrengthLabel = useCallback(() => {
    const labels = defaultConfig.strengthLabels[strengthResult.level]
    return typeof labels === 'string' ? labels : labels[currentLanguage] || labels.en
  }, [strengthResult.level, defaultConfig.strengthLabels, currentLanguage])

  // Get strength color
  const getStrengthColor = useCallback(() => {
    switch (strengthResult.level) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }, [strengthResult.level])

  return {
    // Results
    strengthResult,
    score: strengthResult.score,
    level: strengthResult.level,
    requirements: strengthResult.requirements,
    errors: strengthResult.errors,
    isValid: strengthResult.isValid,
    
    // Display helpers
    strengthLabel: getStrengthLabel(),
    strengthColor: getStrengthColor(),
    
    // Configuration
    config: defaultConfig,
    
    // Utilities
    validatePasswordStrength
  }
}