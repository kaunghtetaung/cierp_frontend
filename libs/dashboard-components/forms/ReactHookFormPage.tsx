'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { ReactHookFormWrapper } from './ReactHookFormWrapper'
import { toastSuccess, toastError } from '@repo/utils'
import type { ModuleSchema } from '@repo/types'

export interface ReactHookFormPageProps {
  module: ModuleSchema
  initialData?: Record<string, any>
  isCreateMode: boolean
  onSubmit: (formData: FormData) => Promise<void>
  onCancel?: () => void
  currentLanguage?: string
}

export function ReactHookFormPage({
  module,
  initialData,
  isCreateMode,
  onSubmit,
  onCancel,
  currentLanguage = 'en'
}: ReactHookFormPageProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Handle form submission
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    
    try {
      // Convert data to FormData
      const formData = new FormData()
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            // Handle array values (multiSelect)
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, String(item))
            })
          } else if (value instanceof File) {
            // Handle file uploads
            formData.append(key, value)
          } else {
            formData.append(key, String(value))
          }
        }
      })
      
      await onSubmit(formData)
      
      toastSuccess(
        isCreateMode 
          ? `${module.name.en} created successfully!`
          : `${module.name.en} updated successfully!`
      )
    } catch (error) {
      console.error('Form submission error:', error)
      toastError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while saving. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isCreateMode ? 'Create' : 'Edit'} {module.name[currentLanguage as keyof typeof module.name] || module.name.en}
          </h1>
          <p className="text-muted-foreground">
            {module.description[currentLanguage as keyof typeof module.description] || module.description.en}
          </p>
        </div>
      </div>
      
      {/* Form */}
      <ReactHookFormWrapper
        module={module}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isCreateMode ? 'Create' : 'Update'}
        cancelLabel="Cancel"
        onCancel={handleCancel}
        showCard={false}
      />
    </div>
  )
}