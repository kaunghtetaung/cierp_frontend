'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { getModuleReferenceAction } from '@repo/app-modules/server-actions'
import { LoadingSpinner } from '@repo/ui'
import type { FormField as SchemaFormField } from '@repo/types'
import type { ReferenceOption } from '@repo/app-modules/types'

export interface DependentSelectProps {
  field: SchemaFormField
  formField: any
  isReadonly: boolean
  currentLanguage: string
}

export function DependentSelect({ 
  field, 
  formField, 
  isReadonly, 
  currentLanguage 
}: DependentSelectProps) {
  const { watch } = useFormContext()
  const [options, setOptions] = React.useState<ReferenceOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Early validation
  if (!field || !formField) {
    console.error('DependentSelect: Invalid field or formField configuration')
    return null
  }
  
  // Watch the dependent field values (now supports multiple dependencies)
  const dependsOn = field.dropdownConfig?.dependsOn || []
  const dependentFieldValues = dependsOn.filter(Boolean).map(fieldName => watch(fieldName))
  
  // Extract module from endpoint
  const getModuleFromEndpoint = (endpoint: string) => {
    // Extract module from endpoint like "/departments/ref" -> "departments"
    const match = endpoint.match(/\/([^\/]+)\/ref/)
    return match ? match[1] : null
  }
  
  // Build parameters for the API call
  const buildParams = (params: Record<string, string> | undefined, dependentValue: any) => {
    if (!params) return {}
    
    const result: Record<string, string> = {}
    Object.entries(params).forEach(([key, template]) => {
      // Replace template variables like {{organizationId}} with actual values
      if (template.includes('{{') && template.includes('}}')) {
        const variable = template.replace(/\{\{|\}\}/g, '')
        result[key] = String(dependentValue || '')
      } else {
        result[key] = template
      }
    })
    return result
  }
  
  React.useEffect(() => {
    const loadOptions = async () => {
      if (!field.dropdownConfig?.refPath) return
      
      // Clear current selection when dependent values change
      if (formField.value && dependentFieldValues.some(val => val !== undefined)) {
        formField.onChange('')
      }
      
      // Don't load if no dependent values are selected
      if (!dependentFieldValues.some(val => val !== undefined && val !== '')) {
        setOptions([])
        setError(null)
        return
      }
      
      const module = getModuleFromEndpoint(field.dropdownConfig.refPath)
      if (!module) {
        setError('Invalid refPath configuration')
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Build query parameters using dependentFieldValues and queryParams mapping
        const params: Record<string, any> = {}
        if (field.dropdownConfig.queryParams) {
          field.dropdownConfig.queryParams.forEach((paramName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[paramName] = dependentFieldValues[index]
            }
          })
        } else {
          // Default mapping: use field names as parameter names
          dependsOn.forEach((fieldName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[fieldName] = dependentFieldValues[index]
            }
          })
        }
        
        const result = await getModuleReferenceAction(module, {
          dependsOn: dependsOn,
          ...params
        })
        
        if (result.success && result.data) {
          setOptions(result.data)
        } else {
          setError(result.error || 'Failed to load options')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadOptions()
  }, [dependentFieldValues, field.dropdownConfig, formField, dependsOn])
  
  if (error) {
    return (
      <div className="text-sm text-red-500 border rounded-md p-2 bg-red-50">
        Error loading options: {error}
      </div>
    )
  }
  
  // Show message if no dependent values selected
  if (!dependentFieldValues.some(val => val !== undefined && val !== '')) {
    const dependencyNames = dependsOn.map(name => name.replace(/Id$/, '')).join(', ')
    return (
      <Select disabled>
        <SelectTrigger className="bg-muted">
          <SelectValue placeholder={`Please select ${dependencyNames} first`} />
        </SelectTrigger>
        <SelectContent>
          {/* Empty content */}
        </SelectContent>
      </Select>
    )
  }
  
  return (
    <Select 
      value={formField.value || ''}
      onValueChange={formField.onChange}
      disabled={isReadonly || isLoading}
    >
      <SelectTrigger className={isReadonly ? 'bg-muted' : ''}>
        <SelectValue placeholder={
          isLoading 
            ? 'Loading...' 
            : field.placeHolder || 'Select an option'
        } />
        {isLoading && <LoadingSpinner className="w-4 h-4" />}
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {typeof option.label === 'string' 
              ? option.label 
              : option.label[currentLanguage as keyof typeof option.label] || option.label.en || String(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}