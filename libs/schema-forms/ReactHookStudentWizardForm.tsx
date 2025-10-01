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
import { RadioGroup, RadioGroupItem } from '@repo/ui'
import { Label } from '@repo/ui'
import { Progress } from '@repo/ui'
import { ConfirmationDialog } from '@repo/ui'
import { toastSuccess, toastError, toastInfo, toastWarning } from '@repo/utils'
import { getLocalizedText } from '@repo/utils'
import { generateZodSchema } from '@repo/schema-utils'
import { useWizardStorage } from '@repo/schema-hooks/use-wizard-storage'
import { moduleKeys } from '@repo/schema-hooks'
import { submitModuleForm } from '@repo/app-modules/server-actions'
import { StudentFormFieldRenderer } from './StudentFormFieldRenderer'
import type { ModuleSchema } from '@repo/types'

interface ReactHookStudentWizardFormProps {
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

// Define wizard steps for student form
const WIZARD_STEPS = {
  personal: {
    title: { en: "Personal Information", mm: "ကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    description: { en: "Basic personal details", mm: "အခြေခံကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    fields: ["nameMyanmar", "nameEnglish", "gender", "race", "religion", "bloodType", "nrcNumber", "dateOfBirth", "placeOfBirth"],
    icon: "User",
    required: true
  },
  contact: {
    title: { en: "Contact Information", mm: "ဆက်သွယ်ရေးအချက်အလက်များ" },
    description: { en: "Contact details", mm: "ဆက်သွယ်ရေးအချက်အလက်များ" },
    fields: ["phoneNumber", "email", "permanentAddress", "currentAddress"],
    icon: "Phone",
    required: true
  },
  address: {
    title: { en: "Address Information", mm: "လိပ်စာအချက်အလက်များ" },
    description: { en: "Location and address details", mm: "တည်နေရာနှင့်လိပ်စာအချက်အလက်များ" },
    fields: ["stateRegionName", "districtName", "townshipName", "townName", "townVillageName", "wardVillageName"],
    icon: "MapPin",
    required: true
  },
  family: {
    title: { en: "Family Information", mm: "မိသားစုအချက်အလက်များ" },
    description: { en: "Family member details", mm: "မိသားစုဝင်များအချက်အလက်များ" },
    fields: ["father.nameMyanmar", "father.nameEnglish", "father.nrcNumber", "father.occupation",
             "mother.nameMyanmar", "mother.nameEnglish", "mother.nrcNumber", "mother.occupation",
             "guardian.nameMyanmar", "guardian.nameEnglish", "guardian.nrcNumber", "guardian.occupation",
             "guardian.relationship", "guardian.phoneNumber", "guardian.email", "guardian.address"],
    icon: "Users",
    required: false
  },
  academic: {
    title: { en: "Academic Background", mm: "ပညာရေးနောက်ခံ" },
    description: { en: "Previous education details", mm: "ယခင်ပညာရေးအချက်အလက်များ" },
    fields: ["previousEducation", "previousSchool", "matriculationRollNo", "matriculationYear", "totalMark", "distinction"],
    icon: "BookOpen",
    required: true
  },
  current: {
    title: { en: "Current Academic", mm: "လက်ရှိပညာရေး" },
    description: { en: "Current academic information", mm: "လက်ရှိပညာရေးအချက်အလက်များ" },
    fields: ["medm", "batches"],
    icon: "GraduationCap",
    required: true
  },
  additional: {
    title: { en: "Additional Information", mm: "အခြားအချက်အလက်များ" },
    description: { en: "Optional additional details", mm: "ထပ်ဆောင်းအချက်အလက်များ" },
    fields: ["hobbies", "skills", "disabilities", "medicalConditions", "specialRequirements"],
    icon: "FileText",
    required: false
  }
}

export function ReactHookStudentWizardForm({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage,
  navigation,
  appId = "core"
}: ReactHookStudentWizardFormProps) {
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
  const [activeTab, setActiveTab] = useState<'father' | 'mother' | 'guardian'>('father')

  // Guardian type state for mirroring functionality
  const [guardianType, setGuardianType] = useState<'father' | 'mother' | 'other'>('other')
  const [guardianValidationWarning, setGuardianValidationWarning] = useState<string>('')

  // Filter form fields - use backend schema for batches field
  const filteredFormFields = React.useMemo(() => {
    // Filter out hidden/password fields and ensure validation rules
    const baseFields = module.formFields.filter((field) => {
      if (field.hidden) return false
      if (action === "update" && field.fieldType === "password") {
        return false
      }
      return true
    }).map(field => {
      // Ensure every field has a validationRule to prevent undefined errors
      if (!field.validationRule) {
        field = {
          ...field,
          validationRule: {
            required: false
          }
        }
      }

      // Also ensure child fields in array fields have validation rules
      if (field.fieldType === 'arrayField' && field.children) {
        field = {
          ...field,
          children: field.children.map(child => {
            if (!child.validationRule) {
              return {
                ...child,
                validationRule: {
                  required: false
                }
              }
            }
            return child
          })
        }
      }

      return field
    })

    return baseFields
  }, [module.formFields, action])

  // Generate Zod schema
  const validationSchema = generateZodSchema(filteredFormFields)

  // Get wizard steps array
  const wizardSteps = Object.keys(WIZARD_STEPS)

  // Initialize React Hook Form
  const defaultValues = React.useMemo(() => {
    const values = initialData || {}

    // Initialize array fields, toggle states, and default values
    filteredFormFields.forEach(field => {
      // Initialize array fields with empty arrays
      if (field.fieldType === 'arrayField' && values[field.fieldName] === undefined) {
        values[field.fieldName] = []
      }

      // Initialize toggle states for NRC fields
      if (field.fieldType === 'nrcField') {
        const toggleFieldName = `${field.fieldName}_isFreeForm`
        if (values[toggleFieldName] === undefined) {
          values[toggleFieldName] = false
        }
      }

      // Initialize address sync toggle fields
      if (field.fieldName === 'currentAddress' || field.fieldName === 'guardian.address') {
        const toggleFieldName = `${field.fieldName}_sameAsPermanent`
        if (values[toggleFieldName] === undefined) {
          values[toggleFieldName] = false
        }
      }
    })

    return values
  }, [initialData, filteredFormFields])

  // Initialize wizard storage for incomplete state persistence
  const wizardStorage = useWizardStorage({
    moduleName: moduleSlug,
    userId: itemId || 'new', // Use itemId for updates, 'new' for creation
    action,
    itemId
  })

  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: 'onChange' // Enable real-time validation for wizard
  })

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    formState,
    reset,
    trigger
  } = form

  // Watch guardian fields for mirroring
  const fatherNameMM = watch('father.nameMyanmar')
  const fatherNameEN = watch('father.nameEnglish')
  const fatherNRC = watch('father.nrcNumber')
  const fatherOccupation = watch('father.occupation')
  const motherNameMM = watch('mother.nameMyanmar')
  const motherNameEN = watch('mother.nameEnglish')
  const motherNRC = watch('mother.nrcNumber')
  const motherOccupation = watch('mother.occupation')
  const guardianRelationship = watch('guardian.relationship')

  // Helper function to check if family tab has errors
  const getFamilyTabErrors = (tabName: 'father' | 'mother' | 'guardian') => {
    const prefix = tabName
    const tabErrors = Object.keys(errors).filter(key => key.startsWith(prefix + '.'))
    return tabErrors.length > 0
  }

  // Auto-select guardian type based on relationship field
  useEffect(() => {
    if (guardianRelationship) {
      const relationshipLower = guardianRelationship.toLowerCase()
      if (relationshipLower === 'father' || relationshipLower === 'အဖေ') {
        setGuardianType('father')
      } else if (relationshipLower === 'mother' || relationshipLower === 'အမေ') {
        setGuardianType('mother')
      } else {
        setGuardianType('other')
      }
    }
  }, [guardianRelationship])

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  // Load from storage on mount (only for create action)
  useEffect(() => {
    console.log('🧙 StudentWizardForm: useEffect for storage loading...');
    if (!hasLoadedFromStorage && !wizardStorage.isLoading) {
      // Skip localStorage loading for edit/update operations - always use fresh server data
      if (action === 'update') {
        console.log('🧙 StudentWizardForm: Skipping localStorage for edit operation');
        setHasLoadedFromStorage(true);
        return;
      }

      const savedData = wizardStorage.loadStoredData();
      console.log('🧙 StudentWizardForm: Retrieved from storage:', { savedData, hasData: !!savedData });

      if (savedData && Object.keys(savedData).length > 0) {
        // Show confirmation dialog to ask user if they want to restore the draft
        setPendingStoredData(savedData);
        setRestoreConfirmOpen(true);
      } else {
        setHasLoadedFromStorage(true);
      }
    }
  }, [hasLoadedFromStorage, wizardStorage.isLoading, action]);

  const handleRestoreDraft = React.useCallback(() => {
    if (pendingStoredData) {
      console.log('🧙 StudentWizardForm: Restoring draft data');
      const restoredData = { ...defaultValues, ...pendingStoredData };
      reset(restoredData);

      // Also restore the current step if saved
      if (pendingStoredData._wizardStep !== undefined) {
        console.log('🧙 StudentWizardForm: Restoring wizard step:', pendingStoredData._wizardStep);
        setCurrentStep(pendingStoredData._wizardStep);
      }

      setPendingStoredData(null);

      // Show info toast about successful draft restoration
      const infoMessage = currentLanguage === 'mm'
        ? 'မူကြမ်းဒေတာ ပြန်လည်ရယူပြီးပါပြီ'
        : 'Draft data has been restored';

      toastInfo(infoMessage);
    }
    setHasLoadedFromStorage(true);
    setRestoreConfirmOpen(false);
  }, [pendingStoredData, reset, defaultValues, currentLanguage]);

  const handleSkipRestore = React.useCallback(() => {
    // Clear the draft data from storage since user chose to start fresh
    wizardStorage.clearStorage();

    // Show warning toast about losing draft data
    const warningMessage = currentLanguage === 'mm'
      ? 'မူကြမ်းဒေတာ ပျက်ဆုံးသွားပါပြီ'
      : 'Draft data has been discarded';

    toastWarning(warningMessage);

    setPendingStoredData(null);
    setHasLoadedFromStorage(true);
    setRestoreConfirmOpen(false);
  }, [wizardStorage, currentLanguage]);

  // Auto-save form data to storage as user fills out the form
  useEffect(() => {
    if (!hasLoadedFromStorage || action === 'update') return;

    const subscription = watch((value) => {
      if (value && Object.keys(value).length > 0) {
        console.log('🧙 StudentWizardForm: Auto-saving form data to storage');
        // Save form data along with current wizard step
        const dataToSave = { ...value, _wizardStep: currentStep };
        wizardStorage.saveToStorage(dataToSave);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, wizardStorage, hasLoadedFromStorage, action, currentStep])

  // Guardian field mirroring logic
  useEffect(() => {
    if (guardianType === 'father') {
      setValue('guardian.nameMyanmar', fatherNameMM || '', { shouldDirty: false })
      setValue('guardian.nameEnglish', fatherNameEN || '', { shouldDirty: false })
      setValue('guardian.nrcNumber', fatherNRC || '', { shouldDirty: false })
      setValue('guardian.occupation', fatherOccupation || '', { shouldDirty: false })
    }
  }, [fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation, guardianType, setValue])

  useEffect(() => {
    if (guardianType === 'mother') {
      setValue('guardian.nameMyanmar', motherNameMM || '', { shouldDirty: false })
      setValue('guardian.nameEnglish', motherNameEN || '', { shouldDirty: false })
      setValue('guardian.nrcNumber', motherNRC || '', { shouldDirty: false })
      setValue('guardian.occupation', motherOccupation || '', { shouldDirty: false })
    }
  }, [motherNameMM, motherNameEN, motherNRC, motherOccupation, guardianType, setValue])

  // Guardian validation warning
  useEffect(() => {
    let warningMessage = ''

    if (guardianType === 'father') {
      const fatherFields = [fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation]
      const missingFields = fatherFields.filter(value => !value)
      if (missingFields.length > 0) {
        warningMessage = currentLanguage === 'mm'
          ? 'အဖေ၏ အချက်အလက်များ မပြည့်စုံပါ။ ဖခင်ထံမှ တင်ထားသော ပုံစံမှ အချက်အလက်များ ပေါ်လာမည်။'
          : 'Father information is incomplete. Available data from Father tab will be mirrored.'
      }
    } else if (guardianType === 'mother') {
      const motherFields = [motherNameMM, motherNameEN, motherNRC, motherOccupation]
      const missingFields = motherFields.filter(value => !value)
      if (missingFields.length > 0) {
        warningMessage = currentLanguage === 'mm'
          ? 'အမေ၏ အချက်အလက်များ မပြည့်စုံပါ။ မိခင်ထံမှ တင်ထားသော ပုံစံမှ အချက်အလက်များ ပေါ်လာမည်။'
          : 'Mother information is incomplete. Available data from Mother tab will be mirrored.'
      }
    }

    setGuardianValidationWarning(warningMessage)
  }, [guardianType, fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation, motherNameMM, motherNameEN, motherNRC, motherOccupation, currentLanguage])

  // Group fields by current step
  const getCurrentStepFields = () => {
    const stepKey = wizardSteps[currentStep]
    const stepConfig = WIZARD_STEPS[stepKey as keyof typeof WIZARD_STEPS]

    return filteredFormFields.filter(field =>
      stepConfig.fields.includes(field.fieldName)
    )
  }

  // Calculate step completion
  const getStepCompletion = (stepIndex: number) => {
    const stepKey = wizardSteps[stepIndex]
    const stepConfig = WIZARD_STEPS[stepKey as keyof typeof WIZARD_STEPS]

    // Match fields - handle both direct field names and nested paths (e.g., "father.nameMyanmar")
    const stepFields = filteredFormFields.filter(field => {
      // Direct match
      if (stepConfig.fields.includes(field.fieldName)) {
        return true
      }
      // Check if any config field starts with this field name (for nested fields like father.nameMyanmar)
      return stepConfig.fields.some(configField => configField.startsWith(field.fieldName + '.'))
    })

    const watchedValues = watch()
    const requiredFields = stepFields.filter(field => field.validationRule?.required)
    const filledRequiredFields = requiredFields.filter(field => {
      const value = watchedValues[field.fieldName]

      // Special handling for array fields
      if (field.fieldType === 'arrayField') {
          if (!Array.isArray(value) || value.length === 0) {
          return false
        }

        // Check if array items have required nested fields filled
        if (field.children) {
          const requiredChildren = field.children.filter(child => child.validationRule?.required)
          return value.every(item => {
            return requiredChildren.every(child => {
              const childValue = item?.[child.fieldName]

              // Handle nested array fields
              if (child.fieldType === 'arrayField') {
                if (!Array.isArray(childValue) || childValue.length === 0) {
                  return false
                }
                // Check nested array items if they have required children
                if (child.children) {
                  const nestedRequiredChildren = child.children.filter(nestedChild => nestedChild.validationRule?.required)
                  return childValue.every(nestedItem => {
                    return nestedRequiredChildren.every(nestedChild => {
                      const nestedChildValue = nestedItem?.[nestedChild.fieldName]
                      return nestedChildValue !== undefined && nestedChildValue !== null && nestedChildValue !== ''
                    })
                  })
                }
                return true
              } else {
                // Regular field validation
                return childValue !== undefined && childValue !== null && childValue !== ''
              }
            })
          })
        }

        return true
      }

      // Regular field validation
      return value !== undefined && value !== null && value !== ''
    })

    return {
      total: requiredFields.length,
      completed: filledRequiredFields.length,
      percentage: requiredFields.length > 0 ? (filledRequiredFields.length / requiredFields.length) * 100 : 100
    }
  }

  // Validate current step
  const validateCurrentStep = async () => {
    const stepFields = getCurrentStepFields()
    const fieldNames = stepFields.map(field => field.fieldName)

    try {
      const result = await trigger(fieldNames)

      // Additional validation for array fields
      const watchedValues = watch()
      const requiredArrayFields = stepFields.filter(field =>
        field.fieldType === 'arrayField' && field.validationRule?.required
      )

      for (const arrayField of requiredArrayFields) {
        const arrayValue = watchedValues[arrayField.fieldName]
        if (!Array.isArray(arrayValue) || arrayValue.length === 0) {
          return false
        }

        // Validate each item in the array if it has required children
        if (arrayField.children) {
          const requiredChildren = arrayField.children.filter(child => child.validationRule?.required)

          for (let i = 0; i < arrayValue.length; i++) {
            const item = arrayValue[i]

            for (const child of requiredChildren) {
              const childValue = item?.[child.fieldName]

              // Handle nested array fields
              if (child.fieldType === 'arrayField') {
                if (!Array.isArray(childValue) || childValue.length === 0) {
                  return false
                }
                // Recursively validate nested array items
                if (child.children) {
                  const nestedRequiredChildren = child.children.filter(nestedChild => nestedChild.validationRule?.required)
                  for (let j = 0; j < childValue.length; j++) {
                    const nestedItem = childValue[j]
                    for (const nestedChild of nestedRequiredChildren) {
                      const nestedChildValue = nestedItem?.[nestedChild.fieldName]
                      if (nestedChildValue === undefined || nestedChildValue === null || nestedChildValue === '') {
                        return false
                      }
                    }
                  }
                }
              } else {
                // Regular field validation
                if (childValue === undefined || childValue === null || childValue === '') {
                  return false
                }
              }
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('Step validation error:', error)
      return false
    }
  }

  // Navigate to next step
  const nextStep = async () => {
    const isValid = await validateCurrentStep()

    if (isValid) {
      if (currentStep < wizardSteps.length - 1) {
        setCompletedSteps(prev => [...new Set([...prev, currentStep])])
        setCurrentStep(prev => prev + 1)
      }
    } else {
      toastError(
        currentLanguage === 'mm'
          ? 'ကျေးဇူးပြု၍ လိုအပ်သော အကွက်များကို ဖြည့်စွက်ပါ'
          : 'Please fill in all required fields'
      )
    }
  }

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Go to specific step
  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex - 1)) {
      setCurrentStep(stepIndex)
    }
  }

  // Form submission
  const onSubmit = async (data: FieldValues) => {
    setIsSubmittingForm(true)
    setSubmitError(null)

    try {
      console.log('🧙 Submitting student wizard form:', data)

      // Convert React Hook Form data to FormData
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays and objects
          if (Array.isArray(value) || typeof value === 'object') {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      })

      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect - we want to handle redirect manually for better UX
      )

      console.log('🧙 Student wizard form submission result:', result)

      // Invalidate queries
      await queryClient.invalidateQueries({
        queryKey: ['modules'],
        exact: false,
        refetchType: 'all'
      })

      // Show success message
      const successMessage = action === "create"
        ? (currentLanguage === "mm"
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} created successfully!`)
        : (currentLanguage === "mm"
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} updated successfully!`)

      toastSuccess(successMessage)

      // Clear storage on successful submission
      console.log('🧙 StudentWizardForm: Clearing storage after successful submission');
      wizardStorage.clearStorage();

      // Navigate back to list
      setTimeout(() => {
        router.push(`/${appId}/${moduleSlug}`)
      }, 1500)

    } catch (error) {
      console.error('🧙 Student wizard form submission error:', error)
      setSubmitError(
        currentLanguage === 'mm'
          ? 'ဖောင်း ပေးပို့မှု မအောင်မြင်ပါ'
          : 'Form submission failed'
      )
      toastError(
        currentLanguage === 'mm'
          ? 'ဖောင်း ပေးပို့မှု မအောင်မြင်ပါ'
          : 'Form submission failed'
      )
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // Calculate overall progress
  const overallProgress = ((currentStep + 1) / wizardSteps.length) * 100

  return (
    <FormProvider {...form}>
      <div className="w-full">
        <div className="w-full lg:w-3/4 mx-auto space-y-6">
        {/* Wizard Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <IconComponent
                name={module.iconName || 'User'}
                className="w-6 h-6 text-primary"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {action === "create" ? "Create" : "Update"}{" "}
                {getLocalizedText(module.name, currentLanguage)}
              </h1>
              <p className="text-muted-foreground">
                {getLocalizedText(module.description, currentLanguage)}
              </p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {currentLanguage === 'mm' ? 'တိုးတက်မှု' : 'Progress'}
              </span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>

        {/* Step Navigation - Simple Icon Indicators */}
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          {/* Desktop View - Full step cards */}
          <div className="hidden md:flex items-center justify-between gap-2">
            {wizardSteps.map((stepKey, index) => {
              const stepConfig = WIZARD_STEPS[stepKey as keyof typeof WIZARD_STEPS]
              const completion = getStepCompletion(index)
              const isActive = currentStep === index
              const isCompleted = completedSteps.includes(index)
              const isAccessible = index <= currentStep || isCompleted

              return (
                <button
                  key={stepKey}
                  type="button"
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={`
                    flex flex-col items-center gap-2 p-2 rounded-lg transition-all
                    ${isActive ? 'bg-primary/10' : 'hover:bg-muted/50'}
                    ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  {/* Small Icon Circle */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    <IconComponent name={stepConfig.icon} className="w-4 h-4" />
                  </div>

                  {/* Step Title */}
                  <span className={`
                    text-xs font-medium text-center leading-tight
                    ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}
                  `}>
                    {getLocalizedText(stepConfig.title, currentLanguage)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Mobile View - Compact dots with current step info */}
          <div className="mobile-step-indicator">
            {/* Current Step Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                <IconComponent name={WIZARD_STEPS[wizardSteps[currentStep] as keyof typeof WIZARD_STEPS].icon} className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary">
                  {getLocalizedText(WIZARD_STEPS[wizardSteps[currentStep] as keyof typeof WIZARD_STEPS].title, currentLanguage)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentLanguage === 'mm' ? 'အဆင့်' : 'Step'} {currentStep + 1} {currentLanguage === 'mm' ? 'မှ' : 'of'} {wizardSteps.length}
                </div>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2">
              {wizardSteps.map((stepKey, index) => {
                const isActive = currentStep === index
                const isCompleted = completedSteps.includes(index)
                const isAccessible = index <= currentStep || isCompleted

                return (
                  <div
                    key={stepKey}
                    onClick={() => isAccessible && goToStep(index)}
                    className={`
                      transition-all duration-300
                      ${isActive
                        ? 'w-8 h-2 rounded-full bg-primary'
                        : isCompleted
                          ? 'w-2 h-2 rounded-full bg-green-600'
                          : 'w-2 h-2 rounded-full bg-muted'
                      }
                      ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    `}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form
            // Allow Enter only in textareas (for new lines)
            if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault()
            }
          }}
          className="space-y-6"
        >
          {wizardSteps.map((stepKey, index) => {
            if (index !== currentStep) return null

            const stepConfig = WIZARD_STEPS[stepKey as keyof typeof WIZARD_STEPS]
            const stepFields = getCurrentStepFields()
            const completion = getStepCompletion(index)

            return (
              <Card key={stepKey} className="shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent name={stepConfig.icon} className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getLocalizedText(stepConfig.title, currentLanguage)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getLocalizedText(stepConfig.description, currentLanguage)}
                        </p>
                      </div>
                    </div>

                    {stepConfig.required && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {completion.completed}/{completion.total} completed
                        </div>
                        <Progress value={completion.percentage} className="w-24 h-2" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Render step-specific content */}
                  {stepKey === 'family' ? (
                    // Custom Family Layout with Tabs
                    <div className="space-y-6">
                      <Tabs value={activeTab} onValueChange={async (value: string) => {
                        // Validate current tab before switching
                        let fieldsToValidate: string[] = []
                        if (activeTab === 'father') {
                          fieldsToValidate = ['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation']
                        } else if (activeTab === 'mother') {
                          fieldsToValidate = ['mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation']
                        } else if (activeTab === 'guardian') {
                          fieldsToValidate = ['guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation', 'guardian.relationship', 'guardian.phoneNumber', 'guardian.email', 'guardian.address']
                        }

                        const isValid = await trigger(fieldsToValidate)
                        if (isValid) {
                          setActiveTab(value as 'father' | 'mother' | 'guardian')
                        }
                      }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                          <TabsTrigger value="father">
                            <div className="flex items-center gap-2">
                              <IconComponent name="User" className="w-4 h-4" />
                              {currentLanguage === "mm" ? "အဖေ" : "Father"}
                              {getFamilyTabErrors('father') && (
                                <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="mother">
                            <div className="flex items-center gap-2">
                              <IconComponent name="Heart" className="w-4 h-4" />
                              {currentLanguage === "mm" ? "အမေ" : "Mother"}
                              {getFamilyTabErrors('mother') && (
                                <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="guardian">
                            <div className="flex items-center gap-2">
                              <IconComponent name="Shield" className="w-4 h-4" />
                              {currentLanguage === "mm" ? "အုပ်ထိန်းသူ" : "Guardian"}
                              {getFamilyTabErrors('guardian') && (
                                <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </TabsTrigger>
                        </TabsList>

                        {/* Father Tab */}
                        <TabsContent value="father" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation'].map(fieldName => {
                              const field = stepFields.find(f => f.fieldName === fieldName)
                              return field ? (
                                <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                                  <StudentFormFieldRenderer
                                    field={field}
                                    currentLanguage={currentLanguage}
                                    isVerticalLayout={false}
                                    errors={errors}
                                    watch={watch}
                                  />
                                </div>
                              ) : null
                            })}
                          </div>

                          <div className="flex justify-end pt-4">
                            <Button
                              type="button"
                              onClick={async () => {
                                const isValid = await trigger(['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation'])
                                if (isValid) {
                                  setActiveTab('mother')
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              {currentLanguage === "mm" ? "အမေ" : "Next: Mother"}
                              <IconComponent name="ArrowRight" className="w-4 h-4" />
                            </Button>
                          </div>
                        </TabsContent>

                        {/* Mother Tab */}
                        <TabsContent value="mother" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation'].map(fieldName => {
                              const field = stepFields.find(f => f.fieldName === fieldName)
                              return field ? (
                                <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                                  <StudentFormFieldRenderer
                                    field={field}
                                    currentLanguage={currentLanguage}
                                    isVerticalLayout={false}
                                    errors={errors}
                                    watch={watch}
                                  />
                                </div>
                              ) : null
                            })}
                          </div>

                          <div className="flex justify-between pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveTab('father')}
                              className="flex items-center gap-2"
                            >
                              <IconComponent name="ArrowLeft" className="w-4 h-4" />
                              {currentLanguage === "mm" ? "အဖေ" : "Previous: Father"}
                            </Button>
                            <Button
                              type="button"
                              onClick={async () => {
                                const isValid = await trigger(['mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation'])
                                if (isValid) {
                                  setActiveTab('guardian')
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              {currentLanguage === "mm" ? "အုပ်ထိန်းသူ" : "Next: Guardian"}
                              <IconComponent name="ArrowRight" className="w-4 h-4" />
                            </Button>
                          </div>
                        </TabsContent>

                        {/* Guardian Tab */}
                        <TabsContent value="guardian" className="space-y-4">
                          {/* Guardian Type Selection */}
                          <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                            <h4 className="text-sm font-medium mb-3">
                              {currentLanguage === "mm" ? "အုပ်ထိန်းသူ ရွေးချယ်မှု" : "Guardian Selection"}
                            </h4>
                            <RadioGroup
                              value={guardianType}
                              onValueChange={(value: 'father' | 'mother' | 'other') => {
                                setGuardianType(value)
                                // Set relationship field based on guardian type
                                if (value === 'father') {
                                  setValue('guardian.relationship', currentLanguage === 'mm' ? 'အဖေ' : 'Father')
                                } else if (value === 'mother') {
                                  setValue('guardian.relationship', currentLanguage === 'mm' ? 'အမေ' : 'Mother')
                                } else {
                                  setValue('guardian.relationship', '')
                                }
                              }}
                              className="flex flex-col sm:flex-row gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="father" id="guardian-father" />
                                <Label htmlFor="guardian-father" className="text-sm cursor-pointer">
                                  {currentLanguage === "mm" ? "အဖေ" : "Father as Guardian"}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mother" id="guardian-mother" />
                                <Label htmlFor="guardian-mother" className="text-sm cursor-pointer">
                                  {currentLanguage === "mm" ? "အမေ" : "Mother as Guardian"}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="guardian-other" />
                                <Label htmlFor="guardian-other" className="text-sm cursor-pointer">
                                  {currentLanguage === "mm" ? "အခြားသူ" : "Other Person"}
                                </Label>
                              </div>
                            </RadioGroup>

                            {/* Validation Warning */}
                            {guardianValidationWarning && (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <IconComponent name="AlertTriangle" className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-amber-800">{guardianValidationWarning}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation', 'guardian.relationship', 'guardian.phoneNumber', 'guardian.email'].map(fieldName => {
                              const field = stepFields.find(f => f.fieldName === fieldName)
                              const isMirroredField = guardianType !== 'other' &&
                                ['guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation'].includes(fieldName)
                              const isRelationshipLocked = guardianType !== 'other' && fieldName === 'guardian.relationship'

                              return field ? (
                                <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                                  <StudentFormFieldRenderer
                                    field={field}
                                    currentLanguage={currentLanguage}
                                    isVerticalLayout={false}
                                    errors={errors}
                                    watch={watch}
                                    isDisabled={isMirroredField || isRelationshipLocked}
                                    isGuardianMirrored={isMirroredField}
                                  />
                                </div>
                              ) : null
                            })}

                            {/* Guardian Address - Full Width */}
                            {(() => {
                              const addressField = stepFields.find(f => f.fieldName === 'guardian.address')
                              return addressField ? (
                                <div key={addressField.fieldName} className="col-span-1 md:col-span-2 animate-in slide-in-from-bottom-2">
                                  <StudentFormFieldRenderer
                                    field={addressField}
                                    currentLanguage={currentLanguage}
                                    isVerticalLayout={false}
                                    errors={errors}
                                    watch={watch}
                                  />
                                </div>
                              ) : null
                            })()}
                          </div>

                          <div className="flex justify-start pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveTab('mother')}
                              className="flex items-center gap-2"
                            >
                              <IconComponent name="ArrowLeft" className="w-4 h-4" />
                              {currentLanguage === "mm" ? "အမေ" : "Previous: Mother"}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : stepKey === 'contact' ? (
                    // Custom Contact Layout
                    <div className="space-y-6">
                      {/* Row 1: Phone and Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['phoneNumber', 'email'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Row 2: Permanent and Current Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['permanentAddress', 'currentAddress'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Row 3: State/Region, District, Township */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['stateRegionName', 'districtName', 'townshipName'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Row 4: Town and Ward/Village */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['townName', 'wardVillageName'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Any remaining contact fields */}
                      {stepFields.filter(field =>
                        !['phoneNumber', 'email', 'permanentAddress', 'currentAddress', 'stateRegionName', 'districtName', 'townshipName', 'townName', 'wardVillageName'].includes(field.fieldName)
                      ).map((field) => (
                        <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                          <StudentFormFieldRenderer
                            field={field}
                            currentLanguage={currentLanguage}
                            isVerticalLayout={false}
                            errors={errors}
                            watch={watch}
                          />
                        </div>
                      ))}
                    </div>
                  ) : stepKey === 'personal' ? (
                    // Personal Information with specific layout
                    <div className="space-y-6">
                      {/* Row 1: Names */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['nameMyanmar', 'nameEnglish'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Row 2: Gender, Race, Religion, Blood Type */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {['gender', 'race', 'religion', 'bloodType'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Row 3: NRC and Date of Birth */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['nrcNumber', 'dateOfBirth'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Any remaining personal fields */}
                      {stepFields.filter(field =>
                        !['nameMyanmar', 'nameEnglish', 'gender', 'race', 'religion', 'bloodType', 'nrcNumber', 'dateOfBirth'].includes(field.fieldName)
                      ).map((field) => (
                        <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                          <StudentFormFieldRenderer
                            field={field}
                            currentLanguage={currentLanguage}
                            isVerticalLayout={false}
                            errors={errors}
                            watch={watch}
                          />
                        </div>
                      ))}
                    </div>
                  ) : stepKey === 'academic' ? (
                    // Academic section with single column for arrayField
                    <div className="space-y-6">
                      {stepFields.map((field) => (
                        <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                          <StudentFormFieldRenderer
                            field={field}
                            currentLanguage={currentLanguage}
                            isVerticalLayout={false}
                            errors={errors}
                            watch={watch}
                          />
                        </div>
                      ))}
                    </div>
                  ) : stepKey === 'additional' ? (
                    // Additional Information with custom layout
                    <div className="space-y-6">
                      {/* First row: hobbies, skills, disabilities */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['hobbies', 'skills', 'disabilities'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Second row: medicalConditions, specialRequirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['medicalConditions', 'specialRequirements'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  ) : stepKey === 'address' ? (
                    // Address Information with custom layout
                    <div className="space-y-6">
                      {/* First row: stateRegion, district, township */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['stateRegionName', 'districtName', 'townshipName'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Second row: townVillageTract, wardVillage */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['townName', 'townVillageName', 'wardVillageName'].map(fieldName => {
                          const field = stepFields.find(f => f.fieldName === fieldName)
                          return field ? (
                            <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                              <StudentFormFieldRenderer
                                field={field}
                                currentLanguage={currentLanguage}
                                isVerticalLayout={false}
                                errors={errors}
                                watch={watch}
                              />
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  ) : (
                    // Default grid layout for other steps
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {stepFields.map((field) => {
                        const fieldColSpan = field.fieldType === "textArea" ||
                                              field.fieldType === "htmlContent" ||
                                              field.fieldType === "arrayField" ||
                                              field.fieldName === "batches"
                          ? "col-span-1 md:col-span-2"
                          : ""

                        return (
                          <div
                            key={field.fieldName}
                            className={`${fieldColSpan} animate-in slide-in-from-bottom-2`}
                          >
                            <StudentFormFieldRenderer
                              field={field}
                              currentLanguage={currentLanguage}
                              isVerticalLayout={false}
                              errors={errors}
                              watch={watch}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <IconComponent name="ArrowLeft" className="w-4 h-4" />
              {currentLanguage === 'mm' ? 'နောက်သို့' : 'Previous'}
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {wizardSteps.length}
            </div>

            {currentStep === wizardSteps.length - 1 ? (
              <Button
                type="submit"
                disabled={isSubmitting || isSubmittingForm}
                className="flex items-center gap-2"
              >
                {(isSubmitting || isSubmittingForm) && (
                  <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
                )}
                {currentLanguage === 'mm' ? 'ပေးပို့မည်' : 'Submit'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                {currentLanguage === 'mm' ? 'ရှေ့သို့' : 'Next'}
                <IconComponent name="ArrowRight" className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive text-sm">{submitError}</p>
            </div>
          )}
        </form>
        </div>
      </div>

      {/* Draft Restore Confirmation Dialog */}
      <ConfirmationDialog
        open={restoreConfirmOpen}
        onOpenChange={(open) => {
          // Only handle dialog state changes, don't auto-skip restore
          setRestoreConfirmOpen(open);
        }}
        title={currentLanguage === 'mm'
          ? 'မူကြမ်းကို ပြန်ယူမလား?'
          : 'Restore Draft?'
        }
        description={currentLanguage === 'mm'
          ? 'မသိမ်းထားသော မူကြမ်းတစ်ခု တွေ့ရှိပါသည်။ နောက်ဆုံးသိမ်းထားသောနေရာမှ ဆက်လက်လုပ်ဆောင်မလား?'
          : 'Found unsaved draft. Would you like to continue from where you left off?'
        }
        confirmText={currentLanguage === 'mm' ? 'ဆက်လုပ်မည်' : 'Continue'}
        cancelText={currentLanguage === 'mm' ? 'အသစ်စမည်' : 'Start Fresh'}
        onConfirm={handleRestoreDraft}
        onCancel={handleSkipRestore}
        icon="FileText"
        destructive={false}
      />
    </FormProvider>
  )
}