'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getModuleReferenceAction } from '@repo/app-modules/server-actions'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
  
  // Watch the dependent field value
  const dependentFieldValue = watch(field.dataSource?.dependsOn || '')
  
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
      if (!field.dataSource) return
      
      // Clear current selection when dependent value changes
      if (formField.value && dependentFieldValue !== watch(field.dataSource.dependsOn || '')) {
        formField.onChange('')
      }
      
      // Don't load if no dependent value is selected
      if (!dependentFieldValue) {
        setOptions([])
        setError(null)
        return
      }
      
      const module = getModuleFromEndpoint(field.dataSource.endpoint)
      if (!module) {
        setError('Invalid endpoint configuration')
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      try {
        const params = buildParams(field.dataSource.params, dependentFieldValue)
        
        const result = await getModuleReferenceAction(module, {
          dependsOn: field.dataSource.dependsOn,
          parentValue: dependentFieldValue,
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
  }, [dependentFieldValue, field.dataSource, formField, watch])
  
  if (error) {
    return (
      <div className="text-sm text-red-500 border rounded-md p-2 bg-red-50">
        Error loading options: {error}
      </div>
    )
  }
  
  // Show message if no dependent value selected
  if (!dependentFieldValue) {
    return (
      <Select disabled>
        <SelectTrigger className="bg-muted">
          <SelectValue placeholder={`Please select ${field.dataSource?.dependsOn?.replace(/Id$/, '')} first`} />
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