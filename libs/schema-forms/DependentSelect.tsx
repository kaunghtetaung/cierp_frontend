'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
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
  const [lastAttemptedKey, setLastAttemptedKey] = React.useState<string>('')
  const lastDependencyValues = React.useRef<string>('')
  
  // Early validation
  if (!field || !formField) {
    console.error('DependentSelect: Invalid field or formField configuration')
    return null
  }
  
  // Watch the dependent field values (now supports multiple dependencies)
  const dependsOn = field.dropdownConfig?.dependsOn || []
  const dependentFieldValues = dependsOn.filter(Boolean).map(fieldName => watch(fieldName))

  // Create dependency key string for tracking
  const dependencyKeyString = dependentFieldValues.join('|')
  
  // Extract module from endpoint
  const getModuleFromEndpoint = (endpoint: string) => {
    // Split by '?' to separate path from query parameters
    const [basePath] = endpoint.split('?');
    // Extract module from endpoint like "/departments/ref" -> "departments" or "/regions/ref" -> "regions"
    const match = basePath.match(/\/([^\/]+)\/ref/)
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

      // Stop refetching if there are validation errors on this field
      if (formField.invalid || formField.error) {
        return
      }

      // Only proceed if dependency values have actually changed
      if (dependencyKeyString === lastDependencyValues.current) {
        return
      }

      lastDependencyValues.current = dependencyKeyString

      // If there's an error and we're trying the same key, don't retry automatically
      if (error && dependencyKeyString === lastAttemptedKey) {
        return
      }

      // Don't load if no dependent values are selected
      if (!dependentFieldValues.some(val => val !== undefined && val !== '')) {
        setOptions([])
        setError(null)
        setLastAttemptedKey('')
        return
      }

      setLastAttemptedKey(dependencyKeyString)
      
      const module = getModuleFromEndpoint(field.dropdownConfig.refPath)
      if (!module) {
        setError('Invalid refPath configuration')
        return
      }
      
      setIsLoading(true)
      setError(null)

      try {
        // Extract predefined query parameters from refPath
        const [, queryString] = field.dropdownConfig.refPath.split('?');
        const predefinedParams: Record<string, any> = {};
        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          urlParams.forEach((value, key) => {
            predefinedParams[key] = value;
          });
        }

        // Build query parameters using dependentFieldValues and queryParams mapping, merging with predefined params
        const params: Record<string, any> = { ...predefinedParams }

        // Add searchType parameter for dynamicDependentSelect fields (avoid conflict with dataSource.searchParam)
        if (field.fieldType === 'dynamicDependentSelect' || field.fieldType === 'multiDependentSelect') {
          params.searchType = 'dynamicDependentSelect';
        }

        if (field.dropdownConfig.queryParams) {
          field.dropdownConfig.queryParams.forEach((paramName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[paramName] = dependentFieldValues[index]
            }
          })
        } else if (field.dataSource?.searchParam) {
          // Use searchParam from dataSource if specified (e.g., search=districtName_value)
          const searchParamName = field.dataSource.searchParam;
          dependsOn.forEach((fieldName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[searchParamName] = dependentFieldValues[index]
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
          // Deduplicate options based on value to prevent React key conflicts
          const uniqueOptions = result.data.filter((option, index, array) =>
            array.findIndex(opt => opt.value === option.value) === index
          );
          setOptions(uniqueOptions)
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
  }, [dependencyKeyString, error, formField.invalid, formField.error])
  
  // Manual retry function that directly triggers loading
  const handleRetry = React.useCallback(async () => {
    setError(null)
    setLastAttemptedKey('') // Clear the attempted key to allow retry
    setIsLoading(true)

    // Directly trigger the load without waiting for useEffect
    if (field.dropdownConfig?.refPath && dependentFieldValues.some(val => val !== undefined && val !== '')) {
      const currentKey = dependentFieldValues.join('|')
      setLastAttemptedKey(currentKey)

      const module = getModuleFromEndpoint(field.dropdownConfig.refPath)
      if (!module) {
        setError('Invalid refPath configuration')
        setIsLoading(false)
        return
      }

      try {
        // Extract predefined query parameters from refPath
        const [, queryString] = field.dropdownConfig.refPath.split('?');
        const predefinedParams: Record<string, any> = {};
        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          urlParams.forEach((value, key) => {
            predefinedParams[key] = value;
          });
        }

        // Build query parameters using dependentFieldValues and queryParams mapping, merging with predefined params
        const params: Record<string, any> = { ...predefinedParams }

        // Add searchType parameter for dynamicDependentSelect fields (avoid conflict with dataSource.searchParam)
        if (field.fieldType === 'dynamicDependentSelect' || field.fieldType === 'multiDependentSelect') {
          params.searchType = 'dynamicDependentSelect';
        }

        if (field.dropdownConfig.queryParams) {
          field.dropdownConfig.queryParams.forEach((paramName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[paramName] = dependentFieldValues[index]
            }
          })
        } else if (field.dataSource?.searchParam) {
          // Use searchParam from dataSource if specified (e.g., search=districtName_value)
          const searchParamName = field.dataSource.searchParam;
          dependsOn.forEach((fieldName, index) => {
            if (dependentFieldValues[index] !== undefined) {
              params[searchParamName] = dependentFieldValues[index]
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
          // Deduplicate options based on value to prevent React key conflicts
          const uniqueOptions = result.data.filter((option, index, array) =>
            array.findIndex(opt => opt.value === option.value) === index
          );
          setOptions(uniqueOptions)
          setError(null)
        } else {
          setError(result.error || 'Failed to load options')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options')
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [field.dropdownConfig, dependentFieldValues, dependsOn])

  if (error) {
    return (
      <div className="w-full">
        <div className="px-3 py-2 border border-destructive rounded-md bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconComponent name="AlertCircle" className="w-4 h-4 mr-2" />
              <span>Failed to load options</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isLoading}
              className="ml-2 h-6 px-2 text-xs"
            >
              <IconComponent
                name={isLoading ? "Loader2" : "RotateCcw"}
                className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading
                ? (currentLanguage === "mm" ? "လုပ်နေသည်..." : "Loading...")
                : (currentLanguage === "mm" ? "ပြန်လုပ်" : "Retry")
              }
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-1 text-xs opacity-75">
              {error}
            </div>
          )}
        </div>
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
        <SelectContent className="z-[100] max-h-[300px]">
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
      <SelectContent
        className="z-[100] max-h-[300px]"
        position="popper"
        sideOffset={8}
        collisionPadding={16}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          // Allow closing only if clicking on trigger or truly outside
          // Prevent closing if clicking on content, scrollbar, or items
          if (target.closest('[data-radix-select-viewport]') ||
              target.closest('[data-radix-select-content]') ||
              target.closest('[role="option"]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          // Prevent closing during any interaction with select components
          if (target.closest('[data-radix-select-viewport]') ||
              target.closest('[data-radix-select-content]') ||
              target.closest('[role="option"]')) {
            e.preventDefault();
          }
        }}
      >
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