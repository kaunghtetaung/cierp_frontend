'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FormFieldRenderer } from './FormFieldRenderer'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { ModuleSchema, WizardStep } from '@repo/types'

export interface WizardFormRendererProps {
  module: ModuleSchema
  currentLanguage?: string
}

export function WizardFormRenderer({ module, currentLanguage = 'en' }: WizardFormRendererProps) {
  const { trigger, formState: { errors } } = useFormContext()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())
  
  const wizardConfig = module.wizardConfig!
  const steps = wizardConfig.steps
  const currentStepData = steps[currentStep]
  
  // Calculate progress
  const progress = ((currentStep + 1) / steps.length) * 100
  
  // Get step title and description
  const getStepTitle = (step: WizardStep) => {
    if (typeof step.title === 'string') return step.title
    return step.title[currentLanguage as keyof typeof step.title] || step.title.en
  }
  
  const getStepDescription = (step: WizardStep) => {
    if (!step.description) return undefined
    if (typeof step.description === 'string') return step.description
    return step.description[currentLanguage as keyof typeof step.description] || step.description.en
  }
  
  // Validate current step fields
  const validateStep = async (stepIndex: number) => {
    const step = steps[stepIndex]
    const fieldsToValidate = step.fields
    
    if (fieldsToValidate.length === 0) return true
    
    const result = await trigger(fieldsToValidate)
    return result
  }
  
  // Handle next step
  const handleNext = async () => {
    if (wizardConfig.validation.validateOnStepChange) {
      const isValid = await validateStep(currentStep)
      if (!isValid) return
    }
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStep))
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  // Handle previous step
  const handlePrevious = () => {
    if (wizardConfig.navigation.allowBackNavigation && currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Handle step click (if allowed)
  const handleStepClick = async (stepIndex: number) => {
    if (!wizardConfig.navigation.allowSkipSteps) {
      // Only allow going to previous steps or next immediate step
      if (stepIndex > currentStep + 1) return
      if (stepIndex < currentStep && !wizardConfig.navigation.allowBackNavigation) return
    }
    
    // If going forward, validate intermediate steps
    if (stepIndex > currentStep && wizardConfig.validation.validateOnStepChange) {
      for (let i = currentStep; i < stepIndex; i++) {
        const isValid = await validateStep(i)
        if (!isValid) return
        setCompletedSteps(prev => new Set(prev).add(i))
      }
    }
    
    setCurrentStep(stepIndex)
  }
  
  // Check if a step has errors
  const stepHasErrors = (step: WizardStep) => {
    return step.fields.some(fieldName => errors[fieldName])
  }
  
  // Get fields to display for current step
  const getCurrentStepFields = () => {
    return module.formFields.filter(field => 
      currentStepData.fields.includes(field.fieldName)
    )
  }
  
  return (
    <div className="w-full space-y-6">
      {/* Progress bar */}
      {wizardConfig.navigation.showProgressBar && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      )}
      
      {/* Step navigation */}
      {wizardConfig.navigation.showStepNumbers && (
        <div className={`flex gap-2 ${wizardConfig.theme?.stepLayout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = completedSteps.has(index)
            const hasErrors = stepHasErrors(step)
            const isClickable = wizardConfig.navigation.allowSkipSteps || 
                              index <= currentStep + 1 || 
                              (index < currentStep && wizardConfig.navigation.allowBackNavigation)
            
            return (
              <Button
                key={step.stepKey}
                variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
                size="sm"
                className={`
                  ${wizardConfig.theme?.stepLayout === 'vertical' ? 'justify-start' : ''}
                  ${hasErrors ? 'border-red-500 text-red-500' : ''}
                  ${!isClickable ? 'cursor-not-allowed opacity-50' : ''}
                `}
                onClick={() => isClickable && handleStepClick(index)}
                disabled={!isClickable}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current text-current-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  {wizardConfig.navigation.showStepTitles && (
                    <span>{getStepTitle(step)}</span>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      )}
      
      {/* Current step content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">
              Step {currentStep + 1}
            </Badge>
            {getStepTitle(currentStepData)}
          </CardTitle>
          {wizardConfig.navigation.showStepDescription && getStepDescription(currentStepData) && (
            <CardDescription>
              {getStepDescription(currentStepData)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {getCurrentStepFields().map((field) => (
            <FormFieldRenderer 
              key={field.fieldName} 
              field={field}
              currentLanguage={currentLanguage}
            />
          ))}
        </CardContent>
      </Card>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || !wizardConfig.navigation.allowBackNavigation}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          type={currentStep === steps.length - 1 ? "submit" : "button"}
          onClick={currentStep === steps.length - 1 ? undefined : handleNext}
          className="flex items-center gap-2"
        >
          {currentStep === steps.length - 1 ? (
            'Submit'
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
      
      {/* Summary step - show all entered data */}
      {currentStep === steps.length - 1 && currentStepData.fields.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Information</CardTitle>
            <CardDescription>
              Please review all the information you've entered before submitting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.slice(0, -1).map((step, stepIndex) => (
              <div key={step.stepKey} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {getStepTitle(step)}
                </h4>
                <div className="grid gap-2 pl-4 border-l-2 border-muted">
                  {step.fields.map(fieldName => {
                    const field = module.formFields.find(f => f.fieldName === fieldName)
                    if (!field) return null
                    
                    return (
                      <div key={fieldName} className="text-sm">
                        <span className="font-medium">
                          {typeof field.label === 'string' 
                            ? field.label 
                            : field.label[currentLanguage as keyof typeof field.label] || field.label.en}:
                        </span>
                        {/* You can add value display logic here */}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}