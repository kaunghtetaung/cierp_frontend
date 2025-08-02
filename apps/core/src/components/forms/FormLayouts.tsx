'use client'

import React from 'react'
import { Control, FieldErrors } from 'react-hook-form'
import { DynamicFormField } from './DynamicFormField'
import type { FormField } from '@/types/module-schema'

interface FormLayoutProps {
  fields: FormField[]
  control: Control<any>
  errors: FieldErrors<any>
  layout: 'vertical' | 'horizontal' | 'grid' | 'wizard'
  currentStep?: number
  totalSteps?: number
}

export function VerticalFormLayout({ fields, control, errors }: Omit<FormLayoutProps, 'layout'>) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <DynamicFormField
          key={field.fieldName}
          field={field}
          control={control}
          error={errors[field.fieldName]}
          className="w-full"
        />
      ))}
    </div>
  )
}

export function HorizontalFormLayout({ fields, control, errors }: Omit<FormLayoutProps, 'layout'>) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.fieldName} className="flex items-center gap-4">
          <div className="w-1/3">
            <label className="text-sm font-medium">
              {field.label.en}
              {field.validationRule.required && <span className="text-destructive ml-1">*</span>}
            </label>
          </div>
          <div className="flex-1">
            <DynamicFormField
              field={field}
              control={control}
              error={errors[field.fieldName]}
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GridFormLayout({ fields, control, errors }: Omit<FormLayoutProps, 'layout'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => (
        <div
          key={field.fieldName}
          className={`${
            field.fieldType === 'textArea' ? 'md:col-span-2 lg:col-span-3' : ''
          }`}
        >
          <DynamicFormField
            field={field}
            control={control}
            error={errors[field.fieldName]}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}

export function WizardFormLayout({ 
  fields, 
  control, 
  errors, 
  currentStep = 0,
  totalSteps = 1 
}: FormLayoutProps) {
  // Split fields into steps based on logical grouping
  const fieldsPerStep = Math.ceil(fields.length / totalSteps)
  const stepFields = fields.slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep)

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          {Array.from({ length: totalSteps }, (_, index) => (
            <React.Fragment key={index}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      {/* Current step fields */}
      <div className="space-y-6">
        {stepFields.map((field) => (
          <DynamicFormField
            key={field.fieldName}
            field={field}
            control={control}
            error={errors[field.fieldName]}
            className="w-full"
          />
        ))}
      </div>
    </div>
  )
}

export function FormLayout({ layout, ...props }: FormLayoutProps) {
  switch (layout) {
    case 'horizontal':
      return <HorizontalFormLayout {...props} />
    case 'grid':
      return <GridFormLayout {...props} />
    case 'wizard':
      return <WizardFormLayout {...props} layout={layout} />
    case 'vertical':
    default:
      return <VerticalFormLayout {...props} />
  }
}