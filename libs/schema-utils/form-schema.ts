import { z } from 'zod'
import type { FormField, ValidationRule } from '@repo/types/form-types'
import { validatePhoneNumber } from '@repo/utils/common/phone-validation'

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
      case 'phone':
        fieldSchema = z.string().refine((val) => {
          if (!val) return true // Let required validation handle empty values
          
          const validation = validatePhoneNumber(val, {
            defaultCountry: field.validationRule?.phoneCountry,
            requireE164: field.validationRule?.e164 || false,
            allowInternational: field.validationRule?.allowInternational !== false
          })
          
          return validation.isValid
        }, {
          message: field.validationRule?.errorMessage?.en || 'Invalid phone number format'
        })
        break
      case 'number':
        // Accept both strings and numbers, transform to number for validation
        fieldSchema = z.union([z.string(), z.number()]).transform((val) => {
          if (typeof val === 'string') {
            return val === '' ? 0 : Number(val)
          }
          return val
        })
        if (field.validationRule?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodEffects<any, any>).refine(
            (val) => val >= (field.validationRule?.min || 0),
            { message: field.validationRule?.errorMessage?.en || `Must be at least ${field.validationRule?.min}` }
          )
        }
        if (field.validationRule?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodEffects<any, any>).refine(
            (val) => val <= (field.validationRule?.max || 0),
            { message: field.validationRule?.errorMessage?.en || `Must be at most ${field.validationRule?.max}` }
          )
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
        // Accept either string ID or object with id/_id field
        fieldSchema = z.union([
          z.string(),
          z.object({
            id: z.string().optional(),
            _id: z.string().optional()
          }).passthrough()
        ]).transform((val) => {
          // Transform object to ID string for validation
          if (typeof val === 'string') return val
          if (val && typeof val === 'object') return val._id || val.id || val
          return val
        })
        break
      case 'multiSelect':
        // For multi-select, handle array of strings or objects
        fieldSchema = z.array(
          z.union([
            z.string(),
            z.object({
              id: z.string().optional(),
              _id: z.string().optional()
            }).passthrough()
          ]).transform((val) => {
            if (typeof val === 'string') return val
            if (val && typeof val === 'object') return val._id || val.id || val
            return val
          })
        )
        break
      case 'dynamicSelect':
      case 'dependentSelect':
      case 'typeaheadSelect':
        // Check if this is a multi-select dynamic field
        if (field.multiple || field.dropdownConfig?.multiple) {
          fieldSchema = z.array(
            z.union([
              z.string(),
              z.object({
                id: z.string().optional(),
                _id: z.string().optional()
              }).passthrough()
            ]).transform((val) => {
              if (typeof val === 'string') return val
              if (val && typeof val === 'object') return val._id || val.id || val
              return val
            })
          )
        } else {
          fieldSchema = z.union([
            z.string(),
            z.object({
              id: z.string().optional(),
              _id: z.string().optional()
            }).passthrough()
          ]).transform((val) => {
            if (typeof val === 'string') return val
            if (val && typeof val === 'object') return val._id || val.id || val
            return val
          })
        }
        break
      case 'icon':
        fieldSchema = z.string()
        break
      case 'arrayField':
        // For array fields, create a schema for array of objects
        if (field.children && field.children.length > 0) {
          // Recursively generate schema for child fields
          const childSchemaFields: Record<string, z.ZodTypeAny> = {}

          field.children.forEach((childField) => {
            let childFieldSchema: z.ZodTypeAny

            // Generate schema for child field (reuse existing logic)
            switch (childField.fieldType) {
              case 'email':
                childFieldSchema = z.string().email(childField.validationRule?.errorMessage?.en || 'Invalid email')
                break
              case 'number':
                // Accept both strings and numbers, transform to number for validation
                childFieldSchema = z.union([z.string(), z.number()]).transform((val) => {
                  if (typeof val === 'string') {
                    return val === '' ? 0 : Number(val)
                  }
                  return val
                })
                if (childField.validationRule?.min !== undefined) {
                  childFieldSchema = (childFieldSchema as z.ZodEffects<any, any>).refine(
                    (val) => val >= (childField.validationRule?.min || 0),
                    { message: childField.validationRule?.errorMessage?.en || `Must be at least ${childField.validationRule?.min}` }
                  )
                }
                if (childField.validationRule?.max !== undefined) {
                  childFieldSchema = (childFieldSchema as z.ZodEffects<any, any>).refine(
                    (val) => val <= (childField.validationRule?.max || 0),
                    { message: childField.validationRule?.errorMessage?.en || `Must be at most ${childField.validationRule?.max}` }
                  )
                }
                break
              case 'select':
              case 'dynamicSelect':
              case 'dependentSelect':
              case 'typeaheadSelect':
                childFieldSchema = z.union([
                  z.string(),
                  z.object({
                    id: z.string().optional(),
                    _id: z.string().optional()
                  }).passthrough()
                ]).transform((val) => {
                  if (typeof val === 'string') return val
                  if (val && typeof val === 'object') return val._id || val.id || val
                  return val
                })
                break
              case 'boolean':
              case 'checkbox':
                childFieldSchema = z.boolean()
                break
              case 'date':
                childFieldSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
                  message: childField.validationRule?.errorMessage?.en || 'Invalid date'
                })
                break
              case 'arrayField':
                // Handle nested array fields recursively
                if (childField.children && childField.children.length > 0) {
                  const nestedChildSchemaFields: Record<string, z.ZodTypeAny> = {}

                  childField.children.forEach((nestedChild) => {
                    let nestedChildSchema: z.ZodTypeAny

                    // Generate schema for nested child fields
                    switch (nestedChild.fieldType) {
                      case 'email':
                        nestedChildSchema = z.string().email(nestedChild.validationRule?.errorMessage?.en || 'Invalid email')
                        break
                      case 'number':
                        nestedChildSchema = z.union([z.string(), z.number()]).transform((val) => {
                          if (typeof val === 'string') {
                            return val === '' ? 0 : Number(val)
                          }
                          return val
                        })
                        break
                      case 'select':
                      case 'dynamicSelect':
                      case 'dependentSelect':
                      case 'typeaheadSelect':
                        nestedChildSchema = z.union([
                          z.string(),
                          z.object({
                            id: z.string().optional(),
                            _id: z.string().optional()
                          }).passthrough()
                        ]).transform((val) => {
                          if (typeof val === 'string') return val
                          if (val && typeof val === 'object') return val._id || val.id || val
                          return val
                        })
                        break
                      case 'boolean':
                      case 'checkbox':
                        nestedChildSchema = z.boolean()
                        break
                      case 'date':
                        nestedChildSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
                          message: nestedChild.validationRule?.errorMessage?.en || 'Invalid date'
                        })
                        break
                      default:
                        nestedChildSchema = z.string()
                    }

                    // Handle required/optional for nested child fields
                    if (!nestedChild.validationRule?.required) {
                      nestedChildSchema = nestedChildSchema.optional()
                    } else {
                      // For required text/email/password fields, ensure they are not empty strings
                      if (nestedChild.fieldType === 'text' || nestedChild.fieldType === 'textArea' || nestedChild.fieldType === 'email' || nestedChild.fieldType === 'password') {
                        nestedChildSchema = (nestedChildSchema as z.ZodString).min(1, nestedChild.validationRule?.errorMessage?.en || `${nestedChild.fieldName} is required`)
                      }
                    }

                    nestedChildSchemaFields[nestedChild.fieldName] = nestedChildSchema
                  })

                  // Create array schema of nested objects
                  childFieldSchema = z.array(z.object(nestedChildSchemaFields))
                } else {
                  // Fallback for nested array fields without children
                  childFieldSchema = z.array(z.any())
                }
                break
              default:
                childFieldSchema = z.string()
            }

            // Apply validation rules for text fields
            if (childField.fieldType === 'text' || childField.fieldType === 'textArea') {
              if (childField.validationRule?.minLength) {
                childFieldSchema = (childFieldSchema as z.ZodString).min(
                  childField.validationRule.minLength,
                  childField.validationRule.errorMessage?.en || 'Too short'
                )
              }
              if (childField.validationRule?.maxLength) {
                childFieldSchema = (childFieldSchema as z.ZodString).max(
                  childField.validationRule.maxLength,
                  childField.validationRule.errorMessage?.en || 'Too long'
                )
              }
            }

            // Handle required/optional for child fields
            if (!childField.validationRule?.required) {
              childFieldSchema = childFieldSchema.optional()
            } else {
              // For required text/email/password fields, ensure they are not empty strings
              if (childField.fieldType === 'text' || childField.fieldType === 'textArea' || childField.fieldType === 'email' || childField.fieldType === 'password') {
                childFieldSchema = (childFieldSchema as z.ZodString).min(1, childField.validationRule?.errorMessage?.en || `${childField.fieldName} is required`)
              }
            }

            childSchemaFields[childField.fieldName] = childFieldSchema
          })

          // Create array schema of objects
          fieldSchema = z.array(z.object(childSchemaFields))

          // Add minimum length validation for required array fields
          if (field.validationRule?.required) {
            fieldSchema = (fieldSchema as z.ZodArray<any>).min(1,
              field.validationRule?.errorMessage?.en || `At least one ${field.fieldName} is required`
            )
          }
        } else {
          // Fallback for array fields without children
          fieldSchema = z.array(z.any())
        }
        break
      default:
        fieldSchema = z.string()
    }

    // Apply validation rules (exclude phone fields as they have custom validation)
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
    } else {
      // For required text/email/password fields, ensure they are not empty strings
      if (field.fieldType === 'text' || field.fieldType === 'textArea' || field.fieldType === 'email' || field.fieldType === 'password') {
        fieldSchema = (fieldSchema as z.ZodString).min(1, field.validationRule.errorMessage?.en || `${field.fieldName} is required`)
      }
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
      case 'dynamicSelect':
        // Check if this is a multi-select dynamic field
        if (field.multiple) {
          defaultValue = []
        } else {
          defaultValue = ''
        }
        break
      case 'arrayField':
        // For array fields, provide an empty array as default
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