'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import { Button } from '@/components/ui/button'
import { IconComponent } from '@repo/ui/components/icons'
import { FormLayout } from './FormLayouts'
import { generateZodSchema, generateDefaultValues } from '@/lib/form-schema'
import { 
  useCreateModuleItem, 
  useUpdateModuleItem,
  useModuleItem 
} from '@/hooks/use-module-query'
import type { ModuleSchema } from '@repo/types'

interface DynamicFormProps {
  module: ModuleSchema
  action: 'create' | 'update'
  id?: string
  initialData?: any
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  className?: string
  redirectOnSuccess?: boolean // New prop to control redirect behavior
}

export function DynamicForm({
  module,
  action,
  id,
  initialData: serverInitialData,
  onSuccess,
  onError,
  className,
  redirectOnSuccess = true
}: DynamicFormProps) {
  const { currentLanguage } = useLanguage()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Generate form schema and default values first
  const schema = generateZodSchema(module.formFields)
  const defaultValues = generateDefaultValues(module.formFields)

  // TanStack Query hooks - only fetch if we don't have server-side data
  const { data: moduleItemResponse, isLoading: isLoadingItem } = useModuleItem(
    module.slug, 
    id || '', 
    { enabled: action === 'update' && !!id && !serverInitialData }
  )

  const createMutation = useCreateModuleItem(module.slug, schema)
  const updateMutation = useUpdateModuleItem(module.slug, schema)

  const isPending = createMutation.isPending || updateMutation.isPending
  // Prefer server-side initialData over client-side query data
  const initialData = serverInitialData || moduleItemResponse
  
  // Check if we're still waiting for data in update mode
  const isWaitingForData = action === 'update' && !initialData && (isLoadingItem || !serverInitialData)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: action === 'update' && initialData ? initialData : defaultValues,
    mode: 'onChange'
  })

  // Reset form with fetched data when it loads (only if we don't have initial data already)
  useEffect(() => {
    if (initialData && action === 'update') {
      reset(initialData)
    }
  }, [initialData, reset, action])

  // Calculate steps for wizard layout
  const isWizard = module.formLayout === 'wizard'
  const totalSteps = isWizard ? Math.ceil(module.formFields.length / 3) : 1
  const canGoNext = currentStep < totalSteps - 1
  const canGoPrevious = currentStep > 0

  const handleNext = async () => {
    if (!canGoNext) return
    
    // Validate current step fields
    const stepSize = Math.ceil(module.formFields.length / totalSteps)
    const stepFields = module.formFields.slice(
      currentStep * stepSize,
      (currentStep + 1) * stepSize
    )
    
    const fieldNames = stepFields.map(field => field.fieldName)
    const isStepValid = await trigger(fieldNames)
    
    if (isStepValid) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Helper function to convert object to FormData
  const objectToFormData = (obj: any): FormData => {
    const formData = new FormData()
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !(value instanceof File)) {
          // Handle nested objects (e.g., displayName.en)
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue !== null && subValue !== undefined) {
              formData.append(`${key}.${subKey}`, String(subValue))
            }
          })
        } else {
          formData.append(key, String(value))
        }
      }
    })
    
    return formData
  }

  const onSubmit = async (data: any) => {
    setSubmitError(null)
    
    try {
      const formData = objectToFormData(data)
      
      if (action === 'create') {
        const result = await createMutation.mutateAsync(formData)
        if (result.success) {
          onSuccess?.(result.data)
          reset()
          setCurrentStep(0)
          // Only redirect if redirectOnSuccess is true
          if (redirectOnSuccess) {
            router.push(`/${module.slug}`)
            router.refresh() // Force server-side refresh
          }
        } else {
          const errorMessage = result.error || 'An error occurred while creating'
          setSubmitError(errorMessage)
          onError?.(errorMessage)
        }
      } else if (action === 'update' && id) {
        const result = await updateMutation.mutateAsync({ id, data: formData })
        if (result.success) {
          onSuccess?.(result.data)
          // Only redirect if redirectOnSuccess is true
          if (redirectOnSuccess) {
            router.push(`/${module.slug}`)
            router.refresh() // Force server-side refresh
          }
        } else {
          const errorMessage = result.error || 'An error occurred while updating'
          setSubmitError(errorMessage)
          onError?.(errorMessage)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const submitButtonText = () => {
    if (isPending) {
      return currentLanguage === 'mm' ? 'သိမ်းဆည်းနေသည်...' : 'Saving...'
    }
    
    if (isWizard && canGoNext) {
      return currentLanguage === 'mm' ? 'နောက်သို့' : 'Next'
    }
    
    if (action === 'create') {
      return currentLanguage === 'mm' ? 'ဖန်တီးမည်' : 'Create'
    }
    
    return currentLanguage === 'mm' ? 'အပ်ဒိတ်လုပ်မည်' : 'Update'
  }

  // Show loading state when waiting for data in update mode
  if (isWaitingForData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <IconComponent name="Loader2" className="w-6 h-6 animate-spin" />
          <span className="text-lg">
            {currentLanguage === "mm" ? "ရယူနေသည်..." : "Loading..."}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout
          fields={module.formFields}
          control={control}
          errors={errors}
          layout={module.formLayout}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {/* Submit Error */}
        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2">
              <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {isWizard && canGoPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isPending}
              >
                <IconComponent name="ChevronLeft" className="w-4 h-4 mr-2" />
                {currentLanguage === 'mm' ? 'နောက်သို့' : 'Previous'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setCurrentStep(0)
                setSubmitError(null)
              }}
              disabled={isPending}
            >
              {currentLanguage === 'mm' ? 'ပြန်လည်သတ်မှတ်မည်' : 'Reset'}
            </Button>

            {isWizard && canGoNext ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isPending}
              >
                {submitButtonText()}
                <IconComponent name="ChevronRight" className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending || !isValid}
              >
                {isPending && (
                  <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                )}
                {submitButtonText()}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}