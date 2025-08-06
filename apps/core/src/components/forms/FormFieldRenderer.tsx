'use client'

import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { DynamicSelect } from './DynamicSelect'
import { DependentSelect } from './DependentSelect'
import type { FormField as SchemaFormField } from '@repo/types'

export interface FormFieldRendererProps {
  field: SchemaFormField
  currentLanguage?: string
}

export function FormFieldRenderer({ field, currentLanguage = 'en' }: FormFieldRendererProps) {
  const { control, watch } = useFormContext()
  
  // Early validation - ensure field has required properties
  if (!field || !field.fieldName) {
    console.error('FormFieldRenderer: Invalid field configuration', field)
    return null
  }
  
  // Get current label for the field
  const getFieldLabel = (field: SchemaFormField) => {
    if (typeof field.label === 'string') return field.label
    return field.label[currentLanguage as keyof typeof field.label] || field.label.en
  }
  
  // Get validation error message
  const getErrorMessage = (field: SchemaFormField) => {
    if (!field.validationRule?.errorMessage) return undefined
    if (typeof field.validationRule.errorMessage === 'string') return field.validationRule.errorMessage
    return field.validationRule.errorMessage[currentLanguage as keyof typeof field.validationRule.errorMessage] || field.validationRule.errorMessage.en
  }
  
  // Don't render hidden fields
  if (field.hidden) {
    return null
  }
  
  const label = getFieldLabel(field)
  const isRequired = field.validationRule?.required ?? false
  const isReadonly = field.readonly ?? false
  
  // Additional validation before rendering
  if (!field.fieldName || typeof field.fieldName !== 'string') {
    console.error('FormFieldRenderer: fieldName must be a non-empty string', { field, fieldName: field.fieldName })
    return (
      <div className="text-red-500 text-sm p-2 border border-red-300 rounded">
        Error: Invalid field name configuration
      </div>
    )
  }

  return (
    <FormField
      control={control}
      name={field.fieldName}
      render={({ field: formField, fieldState }) => (
        <FormItem>
          <FormLabel className={isRequired ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}>
            {label}
          </FormLabel>
          <FormControl>
            <FormFieldInput 
              field={field}
              formField={formField}
              isReadonly={isReadonly}
              currentLanguage={currentLanguage}
            />
          </FormControl>
          {fieldState.error && (
            <FormMessage>{fieldState.error.message || getErrorMessage(field)}</FormMessage>
          )}
        </FormItem>
      )}
    />
  )
}

interface FormFieldInputProps {
  field: SchemaFormField
  formField: any
  isReadonly: boolean
  currentLanguage: string
}

function FormFieldInput({ field, formField, isReadonly, currentLanguage }: FormFieldInputProps) {
  const { control, watch } = useFormContext()
  
  switch (field.fieldType) {
    case 'text':
    case 'email':
      return (
        <Input
          {...formField}
          type={field.fieldType}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
    
    case 'number':
      return (
        <Input
          {...formField}
          type="number"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={isReadonly ? 'bg-muted' : ''}
          onChange={(e) => formField.onChange(e.target.valueAsNumber || '')}
        />
      )
    
    case 'password':
      return (
        <Input
          {...formField}
          type="password"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
    
    case 'textArea':
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 3}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
    
    case 'select':
      return (
        <Select 
          value={formField.value || ''}
          onValueChange={formField.onChange}
          disabled={isReadonly}
        >
          <SelectTrigger className={isReadonly ? 'bg-muted' : ''}>
            <SelectValue placeholder={field.placeHolder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {typeof option.label === 'string' 
                  ? option.label 
                  : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'multiSelect':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.fieldName}-${String(option.value)}`}
                    checked={Array.isArray(controllerField.value) && controllerField.value.includes(String(option.value))}
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(controllerField.value) ? controllerField.value : []
                      const newValue = checked
                        ? [...currentValue, String(option.value)]
                        : currentValue.filter((v: string) => v !== String(option.value))
                      controllerField.onChange(newValue)
                    }}
                    disabled={isReadonly}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === 'string' 
                      ? option.label 
                      : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
                  </Label>
                </div>
              ))}
            </div>
          )}
        />
      )
    
    case 'radio':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <RadioGroup
              value={controllerField.value}
              onValueChange={controllerField.onChange}
              disabled={isReadonly}
            >
              {field.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={String(option.value)} 
                    id={`${field.fieldName}-${String(option.value)}`}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === 'string' 
                      ? option.label 
                      : option.label[currentLanguage as keyof typeof option.label] || option.label.en}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      )
    
    case 'checkbox':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.fieldName}
                checked={controllerField.value}
                onCheckedChange={controllerField.onChange}
                disabled={isReadonly}
              />
              <Label htmlFor={field.fieldName}>
                {field.placeHolder || 'Enable'}
              </Label>
            </div>
          )}
        />
      )
    
    case 'boolean':
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <Select 
              value={controllerField.value === undefined ? '' : String(controllerField.value)}
              onValueChange={(value) => controllerField.onChange(value === 'true')}
              disabled={isReadonly}
            >
              <SelectTrigger className={isReadonly ? 'bg-muted' : ''}>
                <SelectValue placeholder={field.placeHolder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      )
    
    case 'date':
      return (
        <Input
          {...formField}
          type="date"
          readOnly={isReadonly}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
    
    case 'file':
      return (
        <Input
          type="file"
          accept={field.accept}
          readOnly={isReadonly}
          onChange={(e) => formField.onChange(e.target.files?.[0])}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
    
    case 'dynamicSelect':
      if (!field.dropdownConfig) return <div>Error: No dropdown configuration</div>
      return (
        <DynamicSelect
          field={field}
          formField={formField}
          isReadonly={isReadonly}
          currentLanguage={currentLanguage}
        />
      )
    
    case 'dependentSelect':
      if (!field.dropdownConfig) return <div>Error: No dropdown configuration</div>
      return (
        <DependentSelect
          field={field}
          formField={formField}
          isReadonly={isReadonly}
          currentLanguage={currentLanguage}
        />
      )
    
    case 'htmlContent':
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 5}
          className={`${isReadonly ? 'bg-muted' : ''} font-mono text-sm`}
        />
      )
    
    default:
      return (
        <Input
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={isReadonly ? 'bg-muted' : ''}
        />
      )
  }
}