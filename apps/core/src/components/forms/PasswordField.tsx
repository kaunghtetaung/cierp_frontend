'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePasswordValidation } from './hooks/usePasswordValidation'
import type { PasswordStrengthConfig } from '@repo/types'

interface PasswordFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  readOnly?: boolean
  strengthConfig?: PasswordStrengthConfig
  currentLanguage?: string
  showStrengthIndicator?: boolean
  validationProps?: Record<string, any>
}

export function PasswordField({
  value,
  onChange,
  placeholder = 'Enter password',
  className,
  disabled = false,
  readOnly = false,
  strengthConfig,
  currentLanguage = 'en',
  showStrengthIndicator = true,
  validationProps = {}
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    strengthResult,
    score,
    level,
    requirements,
    errors,
    isValid,
    strengthLabel,
    strengthColor,
    config
  } = usePasswordValidation(value, {
    config: strengthConfig,
    currentLanguage,
    debounceMs: 200
  })

  const togglePasswordVisibility = () => {
    if (!readOnly && !disabled) {
      setShowPassword(!showPassword)
    }
  }

  const getProgressColor = () => {
    switch (level) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500' 
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getRequirementStatus = (requirement: boolean) => 
    requirement ? 'text-green-600' : 'text-gray-400'

  const getRequirementIcon = (requirement: boolean) =>
    requirement ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />

  return (
    <div className="space-y-3">
      {/* Password Input with Toggle */}
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn('pr-10', className)}
          disabled={disabled}
          readOnly={readOnly}
          {...validationProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          disabled={disabled || readOnly}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      </div>

      {/* Strength Indicator */}
      {showStrengthIndicator && value && config.showStrengthMeter && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {currentLanguage === 'mm' ? 'စကားဝှက်အင်အား' : 'Password strength'}:
            </span>
            <span className={cn(
              'font-medium',
              level === 'strong' ? 'text-green-600' : 
              level === 'medium' ? 'text-yellow-600' : 
              'text-red-600'
            )}>
              {strengthLabel}
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={score} 
              className="h-2"
            />
            <div 
              className={cn(
                'absolute top-0 left-0 h-2 rounded-full transition-all duration-300',
                getProgressColor()
              )}
              style={{ width: `${Math.max(score, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {showStrengthIndicator && value && config.showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {currentLanguage === 'mm' ? 'လိုအပ်ချက်များ' : 'Requirements'}:
          </h4>
          <div className="space-y-1 text-sm">
            <div className={cn(
              'flex items-center gap-2 transition-colors duration-200',
              getRequirementStatus(requirements.minLength)
            )}>
              {getRequirementIcon(requirements.minLength)}
              <span>
                {typeof config.requirementMessages.minLength === 'string' 
                  ? config.requirementMessages.minLength 
                  : config.requirementMessages.minLength[currentLanguage] || config.requirementMessages.minLength.en}
              </span>
            </div>

            {config.requireUppercase && (
              <div className={cn(
                'flex items-center gap-2 transition-colors duration-200',
                getRequirementStatus(requirements.uppercase)
              )}>
                {getRequirementIcon(requirements.uppercase)}
                <span>
                  {typeof config.requirementMessages.uppercase === 'string'
                    ? config.requirementMessages.uppercase
                    : config.requirementMessages.uppercase[currentLanguage] || config.requirementMessages.uppercase.en}
                </span>
              </div>
            )}

            {config.requireLowercase && (
              <div className={cn(
                'flex items-center gap-2 transition-colors duration-200',
                getRequirementStatus(requirements.lowercase)
              )}>
                {getRequirementIcon(requirements.lowercase)}
                <span>
                  {typeof config.requirementMessages.lowercase === 'string'
                    ? config.requirementMessages.lowercase
                    : config.requirementMessages.lowercase[currentLanguage] || config.requirementMessages.lowercase.en}
                </span>
              </div>
            )}

            {config.requireNumbers && (
              <div className={cn(
                'flex items-center gap-2 transition-colors duration-200',
                getRequirementStatus(requirements.numbers)
              )}>
                {getRequirementIcon(requirements.numbers)}
                <span>
                  {typeof config.requirementMessages.numbers === 'string'
                    ? config.requirementMessages.numbers
                    : config.requirementMessages.numbers[currentLanguage] || config.requirementMessages.numbers.en}
                </span>
              </div>
            )}

            {config.requireSpecialChars && (
              <div className={cn(
                'flex items-center gap-2 transition-colors duration-200',
                getRequirementStatus(requirements.specialChars)
              )}>
                {getRequirementIcon(requirements.specialChars)}
                <span>
                  {typeof config.requirementMessages.specialChars === 'string'
                    ? config.requirementMessages.specialChars
                    : config.requirementMessages.specialChars[currentLanguage] || config.requirementMessages.specialChars.en}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Summary (for form validation integration) */}
      {showStrengthIndicator && value && errors.length > 0 && (
        <div className="text-xs text-red-600 space-y-1">
          {errors.slice(0, 2).map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
          {errors.length > 2 && (
            <div>• {currentLanguage === 'mm' ? 'နောက်ထပ်' : 'And'} {errors.length - 2} {currentLanguage === 'mm' ? 'ခု ထပ်...' : 'more...'}</div>
          )}
        </div>
      )}
    </div>
  )
}