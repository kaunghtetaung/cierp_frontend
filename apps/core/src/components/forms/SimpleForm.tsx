"use client"

import React from 'react'
import { getLocalizedText } from '@repo/utils'
import { Button } from '@/components/ui/button'
import { IconComponent, IconSelector } from '@repo/ui/components/icons'
import { MultiLanguageInput } from './MultiLanguageInput'
import type { ModuleSchema, FormField, LocalizedText } from '@repo/types'

interface SimpleFormProps {
  module: ModuleSchema
  action: 'create' | 'update'
  initialData?: Record<string, any>
  serverAction: (formData: FormData) => Promise<void>
  currentLanguage: string
}

// Generate HTML5 validation attributes from schema
function getValidationProps(field: FormField) {
  const props: Record<string, any> = {}
  
  if (field.validationRule.required) {
    props.required = true
  }
  
  if (field.fieldType === 'email') {
    props.type = 'email'
  }
  
  if (field.fieldType === 'number') {
    props.type = 'number'
    if (field.validationRule.min !== undefined) props.min = field.validationRule.min
    if (field.validationRule.max !== undefined) props.max = field.validationRule.max
  }
  
  if (field.fieldType === 'date') {
    props.type = 'date'
  }
  
  if (field.validationRule.minLength) {
    props.minLength = field.validationRule.minLength
  }
  
  if (field.validationRule.maxLength) {
    props.maxLength = field.validationRule.maxLength
  }
  
  if (field.validationRule.pattern) {
    props.pattern = field.validationRule.pattern
  }
  
  return props
}

// Icon field component with state management
function IconFieldComponent({ field, defaultValue, currentLanguage }: { field: FormField, defaultValue: any, currentLanguage: string }) {
  const [selectedIcon, setSelectedIcon] = React.useState(defaultValue || '');
  
  return (
    <div key={field.fieldName} className="space-y-2">
      <label htmlFor={field.fieldName} className="block text-sm font-medium">
        {getLocalizedText(field.label, currentLanguage)} {field.validationRule.required && <span className="text-red-500">*</span>}
      </label>
      <input type="hidden" name={field.fieldName} value={selectedIcon} />
      <IconSelector
        value={selectedIcon}
        onSelect={(iconName: string) => {
          setSelectedIcon(iconName);
        }}
        placeholder={field.placeHolder || 'Select an icon...'}
        disabled={field.readonly}
        className="w-full"
      />
      {field.validationRule.errorMessage && (
        <p className="text-xs text-muted-foreground">
          {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
        </p>
      )}
    </div>
  );
}

// Render form field based on type
function renderField(field: FormField, initialData: any, currentLanguage: string) {
  // Skip hidden fields
  if (field.hidden) return null;

  // Use MultiLanguageInput for multilanguage fields
  if (field.isMultiLang && (field.fieldType === 'text' || field.fieldType === 'textArea')) {
    const defaultValue = initialData?.[field.fieldName];
    return (
      <MultiLanguageInput
        key={field.fieldName}
        field={field}
        defaultValue={defaultValue}
        currentLanguage={currentLanguage}
      />
    );
  }
  
  const validationProps = getValidationProps(field)
  const label = getLocalizedText(field.label, currentLanguage)
  const placeholder = field.placeHolder || ''
  const defaultValue = initialData?.[field.fieldName] || ''
  
  const commonProps = {
    name: field.fieldName,
    id: field.fieldName,
    defaultValue,
    placeholder,
    disabled: field.readonly,
    className: `w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
      field.readonly ? 'bg-muted cursor-not-allowed' : ''
    }`,
    ...validationProps
  }

  // Handle different field types according to your schema
  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'password':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <input 
            type={field.fieldType === 'password' ? 'password' : field.fieldType === 'email' ? 'email' : 'text'}
            {...commonProps} 
          />
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
    
    case 'textArea':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <textarea {...commonProps} rows={field.rows || 4} />
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
    
    case 'select':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <select {...commonProps}>
            <option value="">
              {currentLanguage === 'mm' ? 'ရွေးချယ်ပါ' : 'Select option'}
            </option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {getLocalizedText(option.label, currentLanguage)}
              </option>
            ))}
          </select>
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )

    case 'multiSelect':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <select {...commonProps} multiple className={`${commonProps.className} min-h-[100px]`}>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {getLocalizedText(option.label, currentLanguage)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {currentLanguage === 'mm' ? 'Ctrl ကိုနှိပ်ပြီး မျိုးမျိုးရွေးချယ်နိုင်သည်' : 'Hold Ctrl to select multiple options'}
          </p>
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
    
    case 'date':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <input 
            type="date" 
            {...commonProps}
            defaultValue={defaultValue ? new Date(defaultValue).toISOString().split('T')[0] : ''}
          />
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
    
    case 'number':
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <input type="number" {...commonProps} />
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
    
    case 'boolean':
    case 'checkbox':
      return (
        <div key={field.fieldName} className="flex items-center space-x-2">
          <input
            type="checkbox"
            name={field.fieldName}
            id={field.fieldName}
            defaultChecked={defaultValue === true || defaultValue === 'true'}
            disabled={field.readonly}
            className="w-4 h-4 text-primary border-input rounded focus:ring-primary disabled:cursor-not-allowed"
          />
          <label htmlFor={field.fieldName} className="text-sm font-medium">
            {label}
            {field.validationRule.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )

    case 'icon':
      return (
        <IconFieldComponent 
          key={field.fieldName}
          field={field}
          defaultValue={defaultValue}
          currentLanguage={currentLanguage}
        />
      )
    
    default:
      // Fallback for unknown field types
      return (
        <div key={field.fieldName} className="space-y-2">
          <label htmlFor={field.fieldName} className="block text-sm font-medium">
            {label} {field.validationRule.required && <span className="text-red-500">*</span>}
          </label>
          <input type="text" {...commonProps} />
          {field.validationRule.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
            </p>
          )}
        </div>
      )
  }
}

export function SimpleForm({ 
  module, 
  action, 
  initialData, 
  serverAction, 
  currentLanguage 
}: SimpleFormProps) {
  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconComponent name={module.iconName} className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            {action === 'create' ? 'Create' : 'Update'} {getLocalizedText(module.name, currentLanguage)}
          </h1>
          <p className="text-muted-foreground">
            {getLocalizedText(module.description, currentLanguage)}
          </p>
        </div>
      </div>

      {/* Dynamic Form Layout */}
      <form action={serverAction} className="space-y-6">
        {/* Render all form fields with proper layout */}
        <div className={`gap-6 ${
          module.formLayout === 'vertical' ? 'flex flex-col' :
          module.formLayout === 'horizontal' ? 'flex flex-wrap' :
          module.formLayout === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3' :
          module.formLayout === 'wizard' ? 'space-y-8' :
          'grid md:grid-cols-2'  // default grid layout
        }`}>
          {module.formFields
            .filter(field => !field.hidden)  // Filter out hidden fields
            .map(field => renderField(field, initialData, currentLanguage))
          }
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" size="lg">
            <IconComponent name="Save" className="w-4 h-4 mr-2" />
            {action === 'create' 
              ? (currentLanguage === 'mm' ? 'ဖန်တီးမည်' : 'Create')
              : (currentLanguage === 'mm' ? 'အပ်ဒိတ်လုပ်မည်' : 'Update')
            }
          </Button>
        </div>
      </form>
    </div>
  )
}