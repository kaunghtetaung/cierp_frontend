'use client'

import React from 'react'
import { useController, Control, FieldError, useWatch } from 'react-hook-form'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormField } from '@/types/module-schema'

interface DynamicFormFieldProps {
  field: FormField
  control: Control<any>
  error?: FieldError
  className?: string
}

export function DynamicFormField({ field, control, error, className }: DynamicFormFieldProps) {
  const { currentLanguage } = useLanguage()
  
  const {
    field: { value, onChange, onBlur },
    fieldState: { invalid }
  } = useController({
    name: field.fieldName,
    control,
  })

  // Watch dependent field values for conditional rendering
  const watchedValues = useWatch({ control })
  
  // Get options based on dependencies
  const getFieldOptions = () => {
    if (!field.options) return []
    
    // If field has dependency, filter options based on parent field value
    if (field.dependency) {
      const parentValue = watchedValues[field.dependency.dependsOn]
      if (!parentValue || !field.dependency.values[parentValue]) {
        return []
      }
      return field.dependency.values[parentValue].map((option: any) => ({
        label: typeof option === 'string' ? { en: option, mm: option } : option.label,
        value: typeof option === 'string' ? option : option.value
      }))
    }
    
    return field.options
  }

  const availableOptions = getFieldOptions()

  const fieldId = `field-${field.fieldName.replace('.', '-')}`
  const isRequired = field.validationRule.required
  const isReadonly = field.readonly
  const isHidden = field.hidden

  if (isHidden) {
    return null
  }

  const renderFieldInput = () => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <Input
            id={fieldId}
            type={field.fieldType}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={field.placeHolder}
            disabled={isReadonly}
            className={`${invalid ? 'border-destructive' : ''} ${className}`}
          />
        )

      case 'textArea':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={field.placeHolder}
            disabled={isReadonly}
            rows={field.rows || 3}
            className={`${invalid ? 'border-destructive' : ''} ${className}`}
          />
        )

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value) || '')}
            onBlur={onBlur}
            placeholder={field.placeHolder}
            disabled={isReadonly}
            min={field.validationRule.min}
            max={field.validationRule.max}
            className={`${invalid ? 'border-destructive' : ''} ${className}`}
          />
        )

      case 'boolean':
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={isReadonly}
            />
            <Label
              htmlFor={fieldId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {getLocalizedText(field.label, currentLanguage)}
            </Label>
          </div>
        )

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={isReadonly}
            className={`${invalid ? 'border-destructive' : ''} ${className}`}
          />
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Select
              value={value || ''}
              onValueChange={onChange}
              disabled={isReadonly || availableOptions.length === 0}
            >
              <SelectTrigger className={`${invalid ? 'border-destructive' : ''} ${className}`}>
                <SelectValue placeholder={
                  availableOptions.length === 0 && field.dependency 
                    ? (currentLanguage === 'mm' 
                        ? `ပထမ ${field.dependency.dependsOn} ရွေးချယ်ပါ`
                        : `Select ${field.dependency.dependsOn} first`)
                    : field.placeHolder
                } />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {getLocalizedText(option.label, currentLanguage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multiSelect':
        return (
          <div className="space-y-2">
            {availableOptions.map((option) => (
              <div key={String(option.value)} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldId}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || []
                    if (checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.value))
                    }
                  }}
                  disabled={isReadonly || availableOptions.length === 0}
                />
                <Label
                  htmlFor={`${fieldId}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {getLocalizedText(option.label, currentLanguage)}
                </Label>
              </div>
            ))}
            {availableOptions.length === 0 && field.dependency && (
              <p className="text-sm text-muted-foreground">
                {currentLanguage === 'mm' 
                  ? `ပထမ ${field.dependency.dependsOn} ရွေးချယ်ပါ`
                  : `Please select ${field.dependency.dependsOn} first`}
              </p>
            )}
          </div>
        )

      default:
        return (
          <Input
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={field.placeHolder}
            disabled={isReadonly}
            className={`${invalid ? 'border-destructive' : ''} ${className}`}
          />
        )
    }
  }

  if (field.fieldType === 'boolean' || field.fieldType === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderFieldInput()}
        {error && (
          <p className="text-sm text-destructive">
            {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {getLocalizedText(field.label, currentLanguage)}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderFieldInput()}
      {error && (
        <p className="text-sm text-destructive">
          {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
        </p>
      )}
    </div>
  )
}