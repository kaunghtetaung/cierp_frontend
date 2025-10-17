'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FieldValues, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@repo/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui'
import { Progress } from '@repo/ui'
import { ConfirmationDialog } from '@repo/ui'
import { toastSuccess, toastError, toastInfo, toastWarning } from '@repo/utils'
import { getLocalizedText } from '@repo/utils'
import { generateZodSchema } from '@repo/schema-utils'
import { useWizardStorage } from '@repo/schema-hooks/use-wizard-storage'
import { moduleKeys } from '@repo/schema-hooks'
import { submitModuleForm } from '@repo/app-modules/server-actions'
import { FieldRenderer } from './FieldRenderer'
import type { ModuleSchema } from '@repo/types'

interface ReactHookStaffWizardFormProps {
  module: ModuleSchema
  action: "create" | "update"
  initialData?: Record<string, any>
  moduleSlug: string
  itemId?: string
  currentLanguage: string
  navigation?: {
    hasNext: boolean
    hasPrevious: boolean
    nextId?: string
    previousId?: string
    currentIndex?: number
    totalRecords?: number
  }
  appId?: string
}

// Define wizard steps for staff admin form (full access including sensitive fields)
const WIZARD_STEPS = {
  personal: {
    title: { en: "Personal Information", mm: "ကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    description: { en: "Basic personal details and identification", mm: "အခြေခံကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    fields: ["staffId", "nameMyanmar", "nameEnglish", "gender", "ethnicity", "religion", "bloodGroup", "nrcNumber", "dateOfBirth", "placeOfBirth"],
    icon: "User",
    required: true
  },
  contact: {
    title: { en: "Contact & Address", mm: "ဆက်သွယ်ရေးနှင့်လိပ်စာ" },
    description: { en: "Contact information and address details", mm: "ဆက်သွယ်ရေးနှင့်လိပ်စာအချက်အလက်များ" },
    fields: ["phoneNumber", "email", "stateRegionName", "districtName", "townshipName", "townName", "wardVillageName", "permanentAddress", "currentAddress"],
    icon: "Phone",
    required: true
  },
  employment: {
    title: { en: "Employment Information", mm: "အလုပ်အကိုင်အချက်အလက်များ" },
    description: { en: "Job details and employment status", mm: "အလုပ်အကိုင်အချက်အလက်များ" },
    fields: ["primaryAppointmentId", "employmentStatus", "employmentType", "joiningDate", "registrationStatus", "approvedBy", "approvalDate", "rejectionReason"],
    icon: "Briefcase",
    required: true
  },
  family: {
    title: { en: "Family Information", mm: "မိသားစုအချက်အလက်များ" },
    description: { en: "Family member details", mm: "မိသားစုဝင်များအချက်အလက်များ" },
    fields: ["father.nameMyanmar", "father.nameEnglish", "father.nrcNumber", "father.occupation",
             "mother.nameMyanmar", "mother.nameEnglish", "mother.nrcNumber", "mother.occupation"],
    icon: "Users",
    required: false
  },
  emergency: {
    title: { en: "Emergency Contact", mm: "အရေးပေါ်ဆက်သွယ်ရန်" },
    description: { en: "Emergency contact information", mm: "အရေးပေါ်ဆက်သွယ်ရန်အချက်အလက်များ" },
    fields: ["emergencyContact.name", "emergencyContact.relationship", "emergencyContact.phoneNumber", "emergencyContact.email", "emergencyContact.address"],
    icon: "AlertCircle",
    required: true
  },
  background: {
    title: { en: "Background & Records", mm: "နောက်ခံအချက်အလက်များ" },
    description: { en: "Criminal record and travel history (admin only)", mm: "ရာဇဝတ်မှတ်တမ်းနှင့်ခရီးသွားမှတ်တမ်း" },
    fields: ["criminalRecord", "travelHistory"],
    icon: "FileText",
    required: false
  },
  additional: {
    title: { en: "Additional Information", mm: "အခြားအချက်အလက်များ" },
    description: { en: "Optional additional details", mm: "ထပ်ဆောင်းအချက်အလက်များ" },
    fields: ["hobbies", "skills", "disabilities", "medicalConditions", "specialRequirements"],
    icon: "Info",
    required: false
  }
}

export function ReactHookStaffWizardForm({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage,
  navigation,
  appId = "core"
}: ReactHookStaffWizardFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [pendingStoredData, setPendingStoredData] = useState<Record<string, any> | null>(null)

  // Family tab state
  const [activeTab, setActiveTab] = useState<'father' | 'mother'>('father')

  // Filter form fields
  const filteredFormFields = React.useMemo(() => {
    return module.formFields.filter((field) => {
      if (field.hidden) return false
      if (action === "update" && field.fieldType === "password") return false
      return true
    }).map(field => {
      if (!field.validationRule) {
        field = {
          ...field,
          validationRule: {
            required: false
          }
        }
      }
      return field
    })
  }, [module.formFields, action])

  // Generate Zod validation schema
  const validationSchema = React.useMemo(() => {
    return generateZodSchema(filteredFormFields, currentLanguage)
  }, [filteredFormFields, currentLanguage])

  // Initialize form with wizard storage
  const form = useForm({
    resolver: zodResolver(validationSchema as any),
    mode: 'onChange',
    defaultValues: initialData || {}
  })

  const { isDirty, isValid } = form.formState

  // Wizard storage with unique key per action
  const storageKey = action === 'create'
    ? `wizard_${appId}_${moduleSlug}_create`
    : `wizard_${appId}_${moduleSlug}_edit_${itemId}`

  const {
    saveProgress,
    loadProgress,
    clearProgress,
    hasStoredData,
    getLastSaveTime
  } = useWizardStorage(storageKey)

  // Check for stored data on mount
  useEffect(() => {
    if (!hasLoadedFromStorage && action === 'create') {
      const stored = hasStoredData()
      if (stored) {
        const data = loadProgress()
        if (data && Object.keys(data).length > 0) {
          setPendingStoredData(data)
          setRestoreConfirmOpen(true)
        }
      }
      setHasLoadedFromStorage(true)
    }
  }, [hasLoadedFromStorage, action, hasStoredData, loadProgress])

  // Handle restore confirmation
  const handleRestoreConfirm = () => {
    if (pendingStoredData) {
      Object.entries(pendingStoredData).forEach(([key, value]) => {
        form.setValue(key, value, { shouldDirty: true, shouldValidate: true })
      })
      toastInfo('Form data restored from previous session')
    }
    setRestoreConfirmOpen(false)
    setPendingStoredData(null)
  }

  const handleRestoreCancel = () => {
    clearProgress()
    setRestoreConfirmOpen(false)
    setPendingStoredData(null)
    toastInfo('Previous form data cleared')
  }

  // Auto-save progress
  useEffect(() => {
    if (isDirty && action === 'create') {
      const values = form.getValues()
      if (Object.keys(values).some(key => values[key] !== undefined && values[key] !== '')) {
        saveProgress(values)
      }
    }
  }, [form.watch(), isDirty, action, saveProgress])

  // Get step keys
  const stepKeys = Object.keys(WIZARD_STEPS) as Array<keyof typeof WIZARD_STEPS>
  const totalSteps = stepKeys.length
  const currentStepKey = stepKeys[currentStep]
  const currentStepData = WIZARD_STEPS[currentStepKey]

  // Get fields for current step
  const currentStepFields = React.useMemo(() => {
    return filteredFormFields.filter(field => {
      const fieldPath = field.fieldName
      return currentStepData.fields.some(stepField => {
        if (stepField.includes('.')) {
          return fieldPath.startsWith(stepField.split('.')[0])
        }
        return fieldPath === stepField
      })
    })
  }, [filteredFormFields, currentStepData])

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepFieldNames = currentStepFields.map(f => f.fieldName)
    const result = await form.trigger(stepFieldNames as any)
    return result
  }

  // Navigation handlers
  const handleNext = async () => {
    const isStepValid = await validateCurrentStep()

    if (!isStepValid) {
      toastWarning('Please fill in all required fields correctly')
      return
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex)
    } else if (stepIndex === currentStep + 1) {
      await handleNext()
    }
  }

  // Form submission
  const onSubmit = async (data: FieldValues) => {
    try {
      setIsSubmittingForm(true)
      setSubmitError(null)

      console.log('📝 [Staff Wizard] Submitting form data:', data)

      const result = await submitModuleForm(
        appId,
        moduleSlug,
        action,
        data,
        itemId
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit form')
      }

      // Clear wizard storage on successful submit
      clearProgress()

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: moduleKeys.list(appId, moduleSlug) })
      if (itemId) {
        await queryClient.invalidateQueries({ queryKey: moduleKeys.detail(appId, moduleSlug, itemId) })
      }

      toastSuccess(
        action === 'create'
          ? `${getLocalizedText(module.name, currentLanguage)} created successfully!`
          : `${getLocalizedText(module.name, currentLanguage)} updated successfully!`
      )

      // Navigate back to list
      router.push(`/${appId}/${moduleSlug}`)
      router.refresh()

    } catch (error) {
      console.error('❌ [Staff Wizard] Form submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)
      toastError(errorMessage)
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {getLocalizedText(currentStepData.title, currentLanguage)}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getLocalizedText(currentStepData.description, currentLanguage)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Step Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stepKeys.map((key, index) => {
            const step = WIZARD_STEPS[key]
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index
            const isAccessible = index <= currentStep || completedSteps.includes(index)

            return (
              <Button
                key={key}
                type="button"
                variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}
                className={`justify-start gap-2 ${!isAccessible && 'opacity-50 cursor-not-allowed'}`}
                onClick={() => isAccessible && handleStepClick(index)}
                disabled={!isAccessible}
              >
                <IconComponent name={step.icon} className="w-4 h-4" />
                <span className="hidden sm:inline">{getLocalizedText(step.title, currentLanguage)}</span>
                {isCompleted && <IconComponent name="Check" className="w-4 h-4 ml-auto" />}
              </Button>
            )
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Family Information Tab View */}
            {currentStepKey === 'family' ? (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="father">
                    <IconComponent name="User" className="w-4 h-4 mr-2" />
                    {currentLanguage === 'en' ? 'Father' : 'အဖ'}
                  </TabsTrigger>
                  <TabsTrigger value="mother">
                    <IconComponent name="User" className="w-4 h-4 mr-2" />
                    {currentLanguage === 'en' ? 'Mother' : 'အမိ'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="father" className="space-y-4 mt-4">
                  {currentStepFields
                    .filter(field => field.fieldName.startsWith('father.'))
                    .map((field) => (
                      <FieldRenderer
                        key={field.fieldName}
                        field={field}
                        currentLanguage={currentLanguage}
                        control={form.control}
                        errors={form.formState.errors}
                        appId={appId}
                        moduleSlug={moduleSlug}
                      />
                    ))}
                </TabsContent>

                <TabsContent value="mother" className="space-y-4 mt-4">
                  {currentStepFields
                    .filter(field => field.fieldName.startsWith('mother.'))
                    .map((field) => (
                      <FieldRenderer
                        key={field.fieldName}
                        field={field}
                        currentLanguage={currentLanguage}
                        control={form.control}
                        errors={form.formState.errors}
                        appId={appId}
                        moduleSlug={moduleSlug}
                      />
                    ))}
                </TabsContent>
              </Tabs>
            ) : (
              /* Regular Field Rendering */
              <div className="space-y-4">
                {currentStepFields.map((field) => (
                  <FieldRenderer
                    key={field.fieldName}
                    field={field}
                    currentLanguage={currentLanguage}
                    control={form.control}
                    errors={form.formState.errors}
                    appId={appId}
                    moduleSlug={moduleSlug}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {submitError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <IconComponent name="AlertCircle" className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Submission Error</h4>
                  <p className="text-sm text-muted-foreground mt-1">{submitError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmittingForm}
          >
            <IconComponent name="ChevronLeft" className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {action === 'create' && isDirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  clearProgress()
                  form.reset()
                  toastInfo('Form cleared')
                }}
                disabled={isSubmittingForm}
              >
                <IconComponent name="X" className="w-4 h-4 mr-2" />
                Clear Form
              </Button>
            )}

            {currentStep < totalSteps - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmittingForm}
              >
                Next
                <IconComponent name="ChevronRight" className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmittingForm || !isValid}
              >
                {isSubmittingForm ? (
                  <>
                    <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IconComponent name="Check" className="w-4 h-4 mr-2" />
                    {action === 'create' ? 'Create Staff' : 'Update Staff'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Restore Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={restoreConfirmOpen}
        onClose={handleRestoreCancel}
        onConfirm={handleRestoreConfirm}
        title="Restore Previous Session?"
        description={`We found a form in progress from ${getLastSaveTime() ? new Date(getLastSaveTime()!).toLocaleString() : 'your last session'}. Would you like to restore it?`}
        confirmText="Restore"
        cancelText="Start Fresh"
      />
    </FormProvider>
  )
}
