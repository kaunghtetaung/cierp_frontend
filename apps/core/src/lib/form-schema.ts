import { z } from 'zod'
import type { FormField, ValidationRule } from '@/types/module-schema'

/**
 * Generate Zod schema from form fields
 */
export function generateZodSchema(formFields: FormField[]): z.ZodSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  formFields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny

    // Base schema based on field type
    switch (field.fieldType) {
      case 'email':
        fieldSchema = z.string().email(field.validationRule.errorMessage.en)
        break
      case 'password':
        fieldSchema = z.string().min(8, field.validationRule.errorMessage.en)
        break
      case 'number':
        fieldSchema = z.number()
        if (field.validationRule.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validationRule.min)
        }
        if (field.validationRule.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validationRule.max)
        }
        break
      case 'boolean':
      case 'checkbox':
        fieldSchema = z.boolean()
        break
      case 'date':
        fieldSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: field.validationRule.errorMessage.en
        })
        break
      case 'select':
      case 'multiSelect':
        fieldSchema = z.string()
        break
      case 'icon':
        fieldSchema = z.string()
        break
      default:
        fieldSchema = z.string()
    }

    // Apply validation rules
    if (field.fieldType === 'text' || field.fieldType === 'textArea' || field.fieldType === 'email' || field.fieldType === 'password') {
      if (field.validationRule.minLength) {
        fieldSchema = (fieldSchema as z.ZodString).min(
          field.validationRule.minLength,
          field.validationRule.errorMessage.en
        )
      }
      if (field.validationRule.maxLength) {
        fieldSchema = (fieldSchema as z.ZodString).max(
          field.validationRule.maxLength,
          field.validationRule.errorMessage.en
        )
      }
      if (field.validationRule.pattern) {
        fieldSchema = (fieldSchema as z.ZodString).regex(
          new RegExp(field.validationRule.pattern),
          field.validationRule.errorMessage.en
        )
      }
    }

    // Handle required/optional
    if (!field.validationRule.required) {
      fieldSchema = fieldSchema.optional()
    }

    // Handle multilanguage fields
    if (field.isMultiLang) {
      const multilangSchema = z.object({
        en: fieldSchema,
        mm: fieldSchema
      })
      schemaFields[field.fieldName] = multilangSchema
    }
    // Handle nested field names (e.g., "displayName.en")
    else if (field.fieldName.includes('.')) {
      const [parentKey, childKey] = field.fieldName.split('.')
      if (!schemaFields[parentKey]) {
        schemaFields[parentKey] = z.object({})
      }
      if (schemaFields[parentKey] instanceof z.ZodObject) {
        schemaFields[parentKey] = (schemaFields[parentKey] as z.ZodObject<any>).extend({
          [childKey]: fieldSchema
        })
      }
    } else {
      schemaFields[field.fieldName] = fieldSchema
    }
  })

  return z.object(schemaFields)
}

/**
 * Generate default values from form fields
 */
export function generateDefaultValues(formFields: FormField[]): Record<string, any> {
  const defaultValues: Record<string, any> = {}

  formFields.forEach((field) => {
    let defaultValue: any

    switch (field.fieldType) {
      case 'boolean':
      case 'checkbox':
        defaultValue = false
        break
      case 'number':
        defaultValue = field.validationRule?.min || 0
        break
      case 'multiSelect':
        defaultValue = []
        break
      default:
        defaultValue = ''
    }

    // Handle multilanguage fields
    if (field.isMultiLang) {
      defaultValues[field.fieldName] = {
        en: defaultValue,
        mm: defaultValue
      }
    }
    // Handle nested field names
    else if (field.fieldName.includes('.')) {
      const [parentKey, childKey] = field.fieldName.split('.')
      if (!defaultValues[parentKey]) {
        defaultValues[parentKey] = {}
      }
      defaultValues[parentKey][childKey] = defaultValue
    } else {
      defaultValues[field.fieldName] = defaultValue
    }
  })

  return defaultValues
}

/**
 * Validate field value
 */
export function validateFieldValue(
  value: any,
  validationRule: ValidationRule,
  fieldType: FormField['fieldType']
): string | null {
  if (validationRule.required && (!value || value === '')) {
    return validationRule.errorMessage.en
  }

  if (!value) return null

  switch (fieldType) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return validationRule.errorMessage.en
      }
      break
    case 'text':
    case 'textArea':
      if (validationRule.minLength && value.length < validationRule.minLength) {
        return validationRule.errorMessage.en
      }
      if (validationRule.maxLength && value.length > validationRule.maxLength) {
        return validationRule.errorMessage.en
      }
      if (validationRule.pattern && !new RegExp(validationRule.pattern).test(value)) {
        return validationRule.errorMessage.en
      }
      break
    case 'number':
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return validationRule.errorMessage.en
      }
      if (validationRule.min !== undefined && numValue < validationRule.min) {
        return validationRule.errorMessage.en
      }
      if (validationRule.max !== undefined && numValue > validationRule.max) {
        return validationRule.errorMessage.en
      }
      break
  }

  return null
}