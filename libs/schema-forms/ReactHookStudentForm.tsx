"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  FieldValues,
  FormProvider,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { RadioGroup, RadioGroupItem } from "@repo/ui";
import { Label } from "@repo/ui";
import { StudentFormFieldRenderer } from "./StudentFormFieldRenderer";
import { generateZodSchema } from "@repo/schema-utils";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { getLocalizedErrorMessage } from "@repo/api/messages";
import { moduleKeys } from "@repo/schema-hooks";
import type { ModuleSchema } from "@repo/types";

interface ReactHookStudentFormProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  currentLanguage: string;
  navigation?: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextId?: string;
    previousId?: string;
    currentIndex?: number;
    totalRecords?: number;
  };
  appId?: string;
}

// Define field sections for student form (field order determined by backend)
const STUDENT_FORM_SECTIONS = {
  personal: {
    title: { en: "Personal Information", mm: "ကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    fields: ["nameMyanmar", "nameEnglish", "gender", "race", "religion", "bloodType", "nrcNumber", "dateOfBirth"],
    icon: "User",
    required: true
  },
  contact: {
    title: { en: "Contact Information", mm: "ဆက်သွယ်ရေးအချက်အလက်များ" },
    fields: ["phone", "email", "stateRegionName", "districtName", "townshipName", "townName", "townVillageName", "wardVillageName", "permanentAddress", "currentAddress"],
    icon: "Phone",
    required: true
  },
  family: {
    title: { en: "Family Information", mm: "မိသားစုအချက်အလက်များ" },
    fields: ["father.nameMyanmar", "father.nameEnglish", "father.nrcNumber", "father.occupation",
             "mother.nameMyanmar", "mother.nameEnglish", "mother.nrcNumber", "mother.occupation",
             "guardian.nameMyanmar", "guardian.nameEnglish", "guardian.nrcNumber", "guardian.occupation",
             "guardian.relationship", "guardian.phoneNumber", "guardian.address"],
    icon: "Users",
    required: false,
    collapsible: true
  },
  previous: {
    title: { en: "Academic Background", mm: "ပညာရေးနောက်ခံ" },
    fields: ["previousEducation", "previousSchool", "matriculationRollNo", "matriculationYear", "totalMark", "distinction"],
    icon: "BookOpen",
    required: true
  },
  current: {
    title: { en: "Current Academic Information", mm: "လက်ရှိပညာရေးအချက်အလက်များ" },
    fields: ["academicYearId", "batchId"],
    icon: "GraduationCap",
    required: true
  },
  additional: {
    title: { en: "Additional Information", mm: "အခြားအချက်အလက်များ" },
    fields: ["hobbies", "skills", "disabilities", "medicalConditions", "specialRequirements"],
    icon: "FileText",
    required: false,
    collapsible: true
  }
};

export function ReactHookStudentForm({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage,
  navigation,
  appId = "core",
}: ReactHookStudentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    family: true,
    additional: true
  });

  // Family tab state
  const [activeTab, setActiveTab] = useState<'father' | 'mother' | 'guardian'>('father');

  // Guardian type state for mirroring functionality
  const [guardianType, setGuardianType] = useState<'father' | 'mother' | 'other'>('other');
  const [guardianValidationWarning, setGuardianValidationWarning] = useState<string>('');

  // Generate Zod schema for validation (exclude password fields in edit mode)
  const filteredFormFields = module.formFields.filter((field) => {
    if (field.hidden) return false;
    if (action === "update" && field.fieldType === "password") {
      return false;
    }
    return true;
  });

  const validationSchema = generateZodSchema(filteredFormFields);

  // Initialize React Hook Form
  const defaultValues = React.useMemo(() => {
    const values = initialData || {};

    // Initialize toggle states for NRC fields
    filteredFormFields.forEach(field => {
      if (field.fieldType === 'nrcField') {
        const toggleFieldName = `${field.fieldName}_isFreeForm`;
        if (values[toggleFieldName] === undefined) {
          values[toggleFieldName] = false; // Default to structured mode
        }
      }

      // Initialize address sync toggle fields
      if (field.fieldName === 'currentAddress' || field.fieldName === 'guardian.address') {
        const toggleFieldName = `${field.fieldName}_sameAsPermanent`;
        if (values[toggleFieldName] === undefined) {
          values[toggleFieldName] = false; // Default to not synced
        }
      }
    });

    return values;
  }, [initialData, filteredFormFields]);

  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = form;

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Guardian field mirroring logic (simplified - relies on individual useEffects below)
  useEffect(() => {
    if (guardianType === 'father') {
      setValue('guardian.relationship', currentLanguage === 'mm' ? 'အဖေ' : 'Father', { shouldDirty: false });
    } else if (guardianType === 'mother') {
      setValue('guardian.relationship', currentLanguage === 'mm' ? 'အမေ' : 'Mother', { shouldDirty: false });
    } else if (guardianType === 'other') {
      // Clear guardian fields when "other" is selected (except phone and address)
      setValue('guardian.nameMyanmar', '', { shouldDirty: false });
      setValue('guardian.nameEnglish', '', { shouldDirty: false });
      setValue('guardian.nrcNumber', '', { shouldDirty: false });
      setValue('guardian.occupation', '', { shouldDirty: false });
      setValue('guardian.relationship', '', { shouldDirty: false });
    }
  }, [guardianType, setValue, currentLanguage]);

  // Watch for changes in father/mother fields to update guardian fields in real-time
  const fatherNameMM = useWatch({ control: form.control, name: 'father.nameMyanmar' });
  const fatherNameEN = useWatch({ control: form.control, name: 'father.nameEnglish' });
  const fatherNRC = useWatch({ control: form.control, name: 'father.nrcNumber' });
  const fatherOccupation = useWatch({ control: form.control, name: 'father.occupation' });

  const motherNameMM = useWatch({ control: form.control, name: 'mother.nameMyanmar' });
  const motherNameEN = useWatch({ control: form.control, name: 'mother.nameEnglish' });
  const motherNRC = useWatch({ control: form.control, name: 'mother.nrcNumber' });
  const motherOccupation = useWatch({ control: form.control, name: 'mother.occupation' });

  useEffect(() => {
    if (guardianType === 'father') {
      console.log('🔄 Guardian mirroring from father:', {
        fatherNameMM,
        fatherNameEN,
        fatherNRC,
        fatherOccupation,
        guardianType
      });
      setValue('guardian.nameMyanmar', fatherNameMM || '', { shouldDirty: false });
      setValue('guardian.nameEnglish', fatherNameEN || '', { shouldDirty: false });
      setValue('guardian.nrcNumber', fatherNRC || '', { shouldDirty: false });
      setValue('guardian.occupation', fatherOccupation || '', { shouldDirty: false });
    }
  }, [fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation, guardianType, setValue]);

  useEffect(() => {
    if (guardianType === 'mother') {
      console.log('🔄 Guardian mirroring from mother:', {
        motherNameMM,
        motherNameEN,
        motherNRC,
        motherOccupation,
        guardianType
      });
      setValue('guardian.nameMyanmar', motherNameMM || '', { shouldDirty: false });
      setValue('guardian.nameEnglish', motherNameEN || '', { shouldDirty: false });
      setValue('guardian.nrcNumber', motherNRC || '', { shouldDirty: false });
      setValue('guardian.occupation', motherOccupation || '', { shouldDirty: false });
    }
  }, [motherNameMM, motherNameEN, motherNRC, motherOccupation, guardianType, setValue]);

  // Guardian validation warning logic (optimized with specific field watches)
  useEffect(() => {
    let warningMessage = '';

    if (guardianType === 'father') {
      const fatherFields = [fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation];
      const missingFields = fatherFields.filter(value => !value);
      if (missingFields.length > 0) {
        warningMessage = currentLanguage === 'mm'
          ? 'အဖေ၏ အချက်အလက်များ မပြည့်စုံပါ။ ဖခင်ထံမှ တင်ထားသော ပုံစံမှ အချက်အလက်များ ပေါ်လာမည်။'
          : 'Father information is incomplete. Available data from Father tab will be mirrored.';
      }
    } else if (guardianType === 'mother') {
      const motherFields = [motherNameMM, motherNameEN, motherNRC, motherOccupation];
      const missingFields = motherFields.filter(value => !value);
      if (missingFields.length > 0) {
        warningMessage = currentLanguage === 'mm'
          ? 'အမေ၏ အချက်အလက်များ မပြည့်စုံပါ။ မိခင်ထံမှ တင်ထားသော ပုံစံမှ အချက်အလက်များ ပေါ်လာမည်။'
          : 'Mother information is incomplete. Available data from Mother tab will be mirrored.';
      }
    }

    setGuardianValidationWarning(warningMessage);
  }, [guardianType, fatherNameMM, fatherNameEN, fatherNRC, fatherOccupation, motherNameMM, motherNameEN, motherNRC, motherOccupation, currentLanguage]);

  // Add keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Alt + Left arrow - Previous record
      if (e.altKey && e.key === "ArrowLeft" && navigation?.hasPrevious && navigation?.previousId) {
        e.preventDefault();
        router.push(`/${appId}/${moduleSlug}/${navigation.previousId}`);
      }

      // Alt + Right arrow - Next record
      if (e.altKey && e.key === "ArrowRight" && navigation?.hasNext && navigation?.nextId) {
        e.preventDefault();
        router.push(`/${appId}/${moduleSlug}/${navigation.nextId}`);
      }
    };

    if (action === "update" && navigation) {
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [navigation, appId, moduleSlug, router, action]);

  // Group fields by sections while preserving backend field order
  const fieldSections = React.useMemo(() => {
    const sections: Record<string, typeof filteredFormFields> = {};

    Object.keys(STUDENT_FORM_SECTIONS).forEach(sectionKey => {
      sections[sectionKey] = [];
    });

    // Unmatched fields go to additional section
    sections.unmatched = [];

    // Preserve backend field order by iterating through filteredFormFields in order
    filteredFormFields.forEach((field) => {
      let matched = false;

      for (const [sectionKey, sectionConfig] of Object.entries(STUDENT_FORM_SECTIONS)) {
        if (sectionConfig.fields.includes(field.fieldName)) {
          sections[sectionKey].push(field);
          matched = true;
          break;
        }
      }

      if (!matched) {
        sections.unmatched.push(field);
      }
    });

    return sections;
  }, [filteredFormFields]);

  // Calculate section completion
  const getSectionCompletion = (sectionKey: string) => {
    const sectionFields = fieldSections[sectionKey] || [];
    const watchedValues = watch();

    const requiredFields = sectionFields.filter(field => field.validationRule?.required);
    const filledRequiredFields = requiredFields.filter(field => {
      const value = watchedValues[field.fieldName];
      return value !== undefined && value !== null && value !== '';
    });

    return {
      total: requiredFields.length,
      completed: filledRequiredFields.length,
      percentage: requiredFields.length > 0 ? (filledRequiredFields.length / requiredFields.length) * 100 : 100
    };
  };

  // Toggle section collapse
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const onSubmit = async (data: FieldValues) => {
    setSubmitError(null);
    setIsSubmittingForm(true);

    try {
      // Convert form data to FormData for server action
      const formData = new FormData();

      // For update operations, include version and other metadata fields
      if (action === "update" && initialData) {
        if (initialData.version !== undefined) {
          formData.append("version", String(initialData.version));
        }
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "string" && value.startsWith('{"en":')) {
            formData.append(key, value);
          } else if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, String(item)));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect
      );

      if (!result.success) {
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          const fieldErrorsText = result.fieldErrors.join("\n");
          const mainError =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          const traceInfo = result.traceId
            ? `\n\nTrace ID: ${result.traceId}`
            : "";
          const errorMessage = `${mainError}\n\nField errors:\n${fieldErrorsText}${traceInfo}`;
          toastError(mainError);
          throw new Error(errorMessage);
        } else if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
          const toastErrorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(toastErrorMessage);
          throw new Error(errorMessages);
        } else {
          const errorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      // Success - show toast and handle client-side navigation
      console.log("Form submitted successfully");

      // Invalidate React Query cache to force data refetch
      console.log(`🔄 Invalidating React Query cache for module: ${moduleSlug}`);

      // Remove all cached queries for this module to force complete refresh
      await queryClient.removeQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false
      });

      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false,
        refetchType: 'all'
      });

      // If updating, also invalidate the specific item detail
      if (action === "update" && itemId) {
        await queryClient.removeQueries({
          queryKey: moduleKeys.detail(moduleSlug, itemId)
        });
        await queryClient.invalidateQueries({
          queryKey: moduleKeys.detail(moduleSlug, itemId),
          refetchType: 'all'
        });
      }

      // Clear all module-related caches to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ['modules'],
        exact: false,
        refetchType: 'all'
      });

      // Show success toast with multilingual support
      const successMessage =
        action === "create"
          ? currentLanguage === "mm"
            ? `${getLocalizedText(
                module.name,
                currentLanguage
              )} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
            : `${getLocalizedText(
                module.name,
                currentLanguage
              )} created successfully!`
          : currentLanguage === "mm"
          ? `${getLocalizedText(
              module.name,
              currentLanguage
            )} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(
              module.name,
              currentLanguage
            )} updated successfully!`;

      toastSuccess(successMessage);

      // Redirect to module datatable page with user-friendly delay
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [...moduleKeys.lists(), moduleSlug],
          exact: false
        });
        router.push(`/${moduleSlug}`);
      }, 1500);
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
      setSubmitError(errorMessage);
      toastError(errorMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header with Glass Effect */}
        <Card className="mb-6 border-0 shadow-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl shadow-lg animate-in fade-in-50 zoom-in-95">
                  <IconComponent
                    name={module.iconName || "GraduationCap"}
                    className="w-8 h-8 text-primary"
                  />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {action === "create" ? (
                      <>
                        {currentLanguage === "mm" ? "ကျောင်းသားအသစ် - " : "New Student "}
                        {getLocalizedText(module.name, currentLanguage)}
                      </>
                    ) : (
                      <>
                        {currentLanguage === "mm" ? "ကျောင်းသားပြင်ဆင်ရန် - " : "Update "}
                        {getLocalizedText(module.name, currentLanguage)}
                      </>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {getLocalizedText(module.description, currentLanguage)}
                  </p>
                </div>
              </div>

              {/* Help Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="rounded-full"
              >
                <IconComponent name={showHelp ? "X" : "HelpCircle"} className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Pills and Navigation */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
              {isSubmittingForm ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full animate-pulse">
                  <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                  </span>
                </div>
              ) : hasErrors ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-full">
                  <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    {Object.keys(errors).length} {currentLanguage === "mm" ? "အမှားများ" : "errors"}
                  </span>
                </div>
              ) : isDirty ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 rounded-full">
                  <IconComponent name="Edit3" className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning font-medium">
                    {currentLanguage === "mm" ? "ပြောင်းလဲမှုများရှိသည်" : "Has changes"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
                  <IconComponent name="CheckCircle" className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {currentLanguage === "mm" ? "အဆင်သင့်" : "Ready"}
                  </span>
                </div>
              )}
              </div>

              {/* Navigation Controls */}
              {action === "update" && navigation && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigation.previousId) {
                        router.push(`/${appId}/${moduleSlug}/${navigation.previousId}`)
                      }
                    }}
                    disabled={!navigation.hasPrevious}
                    title={currentLanguage === "mm" ? "ယခင်မှတ်တမ်း (Alt+←)" : "Previous Record (Alt+←)"}
                  >
                    <IconComponent name="ChevronLeft" className="w-4 h-4" />
                  </Button>

                  {navigation.currentIndex && navigation.totalRecords && (
                    <div className="px-3 py-1 bg-background border border-border/30 rounded-md">
                      <span className="text-sm font-medium">
                        {navigation.currentIndex} / {navigation.totalRecords}
                      </span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigation.nextId) {
                        router.push(`/${appId}/${moduleSlug}/${navigation.nextId}`)
                      }
                    }}
                    disabled={!navigation.hasNext}
                    title={currentLanguage === "mm" ? "နောက်မှတ်တမ်း (Alt+→)" : "Next Record (Alt+→)"}
                  >
                    <IconComponent name="ChevronRight" className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Help Panel */}
        {showHelp && (
          <Card className="mb-6 border-warning/50 bg-warning/5 animate-in slide-in-from-top-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <IconComponent name="Info" className="w-5 h-5 text-warning mt-1" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {currentLanguage === "mm" ? "အကူအညီ:" : "Help Tips:"}
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• {currentLanguage === "mm"
                      ? "အနီရောင် * သင်္ကေတရှိသော အကွက်များမှာ မဖြစ်မနေဖြည့်ရမည်"
                      : "Fields marked with red * are required"}</li>
                    <li>• {currentLanguage === "mm"
                      ? "ကဏ္ဍခေါင်းစဉ်တွေကို နှိပ်လို့ ချုံ့/ဖြန့်နိုင်ပါသည်"
                      : "Click section headers to collapse/expand"}</li>
                    <li>• {currentLanguage === "mm"
                      ? "မှားယွင်းနေသော အကွက်များကို အနီရောင်ဖြင့် ပြသပေးမည်"
                      : "Invalid fields will be highlighted in red"}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form Content */}
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Sections */}
            {Object.entries(STUDENT_FORM_SECTIONS).map(([sectionKey, sectionConfig]) => {
              const sectionFields = fieldSections[sectionKey] || [];
              if (sectionFields.length === 0) return null;

              const completion = getSectionCompletion(sectionKey);
              const isCollapsed = collapsedSections[sectionKey];
              const sectionHasErrors = sectionFields.some(field => errors[field.fieldName]);

              // Section-specific grid configuration
              const isPersonalSection = sectionKey === 'personal';
              const isContactSection = sectionKey === 'contact';
              const isFamilySection = sectionKey === 'family';
              const isAcademicSection = sectionKey === 'previous';
              const gridClasses = isPersonalSection
                ? "grid grid-cols-2 md:grid-cols-4 gap-6"
                : isContactSection
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6" // Contact section: phone/email in first row, addresses in second row
                  : isFamilySection
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6" // Family section uses tabs
                    : isAcademicSection
                      ? "grid grid-cols-1 gap-6" // Academic Background section: single column for arrayFields
                      : "grid grid-cols-2 md:grid-cols-2 gap-6";

              return (
                <Card
                  key={sectionKey}
                  className={`relative shadow-xl border-0 ${sectionHasErrors ? 'ring-2 ring-destructive/20' : ''}`}
                >
                  <CardHeader
                    className={`pb-4 cursor-pointer ${sectionConfig.collapsible ? 'hover:bg-muted/30' : ''}`}
                    onClick={() => sectionConfig.collapsible && toggleSection(sectionKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <IconComponent
                            name={sectionConfig.icon as any}
                            className="w-5 h-5 text-primary"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold">
                            {getLocalizedText(sectionConfig.title, currentLanguage)}
                          </CardTitle>
                          {sectionConfig.required && completion.total > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${completion.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {completion.completed}/{completion.total} completed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sectionHasErrors && (
                          <IconComponent name="AlertCircle" className="w-5 h-5 text-destructive" />
                        )}
                        {sectionConfig.collapsible && (
                          <IconComponent
                            name="ChevronDown"
                            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="pt-0">
                      {isPersonalSection ? (
                        // Custom Personal Information Layout - Fixed Order
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {/* Row 1: Name Fields */}
                          {['nameMyanmar', 'nameEnglish'].map(fieldName => {
                            const field = sectionFields.find(f => f.fieldName === fieldName);
                            return field ? (
                              <div key={field.fieldName} className="col-span-2 md:col-span-2 animate-in slide-in-from-bottom-2">
                                <StudentFormFieldRenderer
                                  field={field}
                                  currentLanguage={currentLanguage}
                                  isVerticalLayout={false}
                                  errors={errors}
                                  watch={watch}
                                />
                              </div>
                            ) : null;
                          })}

                          {/* Row 2: Gender, Race, Religion, Blood Type */}
                          {['gender', 'race', 'religion', 'bloodType'].map(fieldName => {
                            const field = sectionFields.find(f => f.fieldName === fieldName);
                            return field ? (
                              <div key={field.fieldName} className="col-span-1 md:col-span-1 animate-in slide-in-from-bottom-2">
                                <StudentFormFieldRenderer
                                  field={field}
                                  currentLanguage={currentLanguage}
                                  isVerticalLayout={false}
                                  errors={errors}
                                  watch={watch}
                                />
                              </div>
                            ) : null;
                          })}

                          {/* Row 3: NRC Number and Date of Birth */}
                          {['nrcNumber', 'nrcField'].map(fieldName => {
                            const field = sectionFields.find(f => f.fieldName === fieldName);
                            return field ? (
                              <div key={field.fieldName} className="col-span-2 md:col-span-2 animate-in slide-in-from-bottom-2">
                                <StudentFormFieldRenderer
                                  field={field}
                                  currentLanguage={currentLanguage}
                                  isVerticalLayout={false}
                                  errors={errors}
                                  watch={watch}
                                />
                              </div>
                            ) : null;
                          })}

                          {['dateOfBirth'].map(fieldName => {
                            const field = sectionFields.find(f => f.fieldName === fieldName);
                            return field ? (
                              <div key={field.fieldName} className="col-span-2 md:col-span-2 animate-in slide-in-from-bottom-2">
                                <StudentFormFieldRenderer
                                  field={field}
                                  currentLanguage={currentLanguage}
                                  isVerticalLayout={false}
                                  errors={errors}
                                  watch={watch}
                                />
                              </div>
                            ) : null;
                          })}

                          {/* Any remaining fields not in the specific layout */}
                          {sectionFields.filter(field =>
                            !['nameMyanmar', 'nameEnglish', 'gender', 'race', 'religion', 'bloodType', 'nrcNumber', 'nrcField', 'dateOfBirth'].includes(field.fieldName)
                          ).map((field) => (
                            <div key={field.fieldName} className="col-span-2 md:col-span-2 animate-in slide-in-from-bottom-2">
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
                      ) : sectionKey === 'contact' ? (
                        // Custom Contact Information Layout
                        <div className="space-y-6">
                          {/* Row 1: Phone and Email */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['phone', 'email'].map(fieldName => {
                              const field = sectionFields.find(f => f.fieldName === fieldName);
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
                              ) : null;
                            })}
                          </div>

                          {/* Row 2: Permanent and Current Address */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['permanentAddress', 'currentAddress'].map(fieldName => {
                              const field = sectionFields.find(f => f.fieldName === fieldName);
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
                              ) : null;
                            })}
                          </div>

                          {/* Row 3: State/Region, District, Township */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['stateRegionName', 'districtName', 'townshipName'].map(fieldName => {
                              const field = sectionFields.find(f => f.fieldName === fieldName);
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
                              ) : null;
                            })}
                          </div>

                          {/* Row 4: Town and Ward/Village */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['townName', 'wardVillageName'].map(fieldName => {
                              const field = sectionFields.find(f => f.fieldName === fieldName);
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
                              ) : null;
                            })}
                          </div>

                          {/* Any remaining fields not in the specific layout */}
                          {sectionFields.filter(field =>
                            !['phone', 'email', 'permanentAddress', 'currentAddress', 'stateRegionName', 'districtName', 'townshipName', 'townName', 'wardVillageName'].includes(field.fieldName)
                          ).length > 0 && (
                            <div className={gridClasses}>
                              {sectionFields.filter(field =>
                                !['phone', 'email', 'permanentAddress', 'currentAddress', 'stateRegionName', 'districtName', 'townshipName', 'townName', 'wardVillageName'].includes(field.fieldName)
                              ).map((field) => {
                                const fieldColSpan = field.fieldType === "textArea" || field.fieldType === "htmlContent"
                                  ? "col-span-2 md:col-span-2"
                                  : "";

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
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : sectionKey === 'family' ? (
                        // Custom Family Information Layout with Tabs
                        <div className="space-y-6">
                          <Tabs value={activeTab} onValueChange={(value: string) => {
                            setActiveTab(value as 'father' | 'mother' | 'guardian');
                          }} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                              <TabsTrigger value="father">
                                <div className="flex items-center gap-2">
                                  <IconComponent name="User" className="w-4 h-4" />
                                  {currentLanguage === "mm" ? "အဖေ" : "Father"}
                                </div>
                              </TabsTrigger>
                              <TabsTrigger value="mother">
                                <div className="flex items-center gap-2">
                                  <IconComponent name="Heart" className="w-4 h-4" />
                                  {currentLanguage === "mm" ? "အမေ" : "Mother"}
                                </div>
                              </TabsTrigger>
                              <TabsTrigger value="guardian">
                                <div className="flex items-center gap-2">
                                  <IconComponent name="Shield" className="w-4 h-4" />
                                  {currentLanguage === "mm" ? "အုပ်ထိန်းသူ" : "Guardian"}
                                </div>
                              </TabsTrigger>
                            </TabsList>

                            {/* Father Tab Content */}
                            <TabsContent value="father" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation'].map(fieldName => {
                                  const field = sectionFields.find(f => f.fieldName === fieldName);
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
                                  ) : null;
                                })}
                              </div>

                              {/* Navigation buttons */}
                              <div className="flex justify-end pt-4">
                                <Button
                                  type="button"
                                  onClick={() => setActiveTab('mother')}
                                  className="flex items-center gap-2"
                                >
                                  {currentLanguage === "mm" ? "အမေ" : "Next: Mother"}
                                  <IconComponent name="ArrowRight" className="w-4 h-4" />
                                </Button>
                              </div>
                            </TabsContent>

                            {/* Mother Tab Content */}
                            <TabsContent value="mother" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation'].map(fieldName => {
                                  const field = sectionFields.find(f => f.fieldName === fieldName);
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
                                  ) : null;
                                })}
                              </div>

                              {/* Navigation buttons */}
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
                                  onClick={() => setActiveTab('guardian')}
                                  className="flex items-center gap-2"
                                >
                                  {currentLanguage === "mm" ? "အုပ်ထိန်းသူ" : "Next: Guardian"}
                                  <IconComponent name="ArrowRight" className="w-4 h-4" />
                                </Button>
                              </div>
                            </TabsContent>

                            {/* Guardian Tab Content */}
                            <TabsContent value="guardian" className="space-y-4">
                              {/* Guardian Type Selection */}
                              <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-medium mb-3">
                                  {currentLanguage === "mm" ? "အုပ်ထိန်းသူ ရွေးချယ်မှု" : "Guardian Selection"}
                                </h4>
                                <RadioGroup
                                  value={guardianType}
                                  onValueChange={(value: 'father' | 'mother' | 'other') => {
                                    setGuardianType(value);
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
                                {['guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation', 'guardian.relationship', 'guardian.phoneNumber'].map(fieldName => {
                                  const field = sectionFields.find(f => f.fieldName === fieldName);
                                  const isMirroredField = guardianType !== 'other' &&
                                    ['guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation'].includes(fieldName);
                                  const isRelationshipField = fieldName === 'guardian.relationship';

                                  return field ? (
                                    <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                                      <StudentFormFieldRenderer
                                        field={field}
                                        currentLanguage={currentLanguage}
                                        isVerticalLayout={false}
                                        errors={errors}
                                        watch={watch}
                                        isDisabled={isMirroredField}
                                        isGuardianMirrored={isMirroredField}
                                      />
                                    </div>
                                  ) : null;
                                })}

                                {/* Guardian Address - Full Width */}
                                {(() => {
                                  const addressField = sectionFields.find(f => f.fieldName === 'guardian.address');
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
                                  ) : null;
                                })()}
                              </div>

                              {/* Navigation buttons */}
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

                          {/* Any remaining fields not in the specific tabs */}
                          {sectionFields.filter(field =>
                            !['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation',
                              'mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation',
                              'guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation',
                              'guardian.relationship', 'guardian.phoneNumber', 'guardian.address'].includes(field.fieldName)
                          ).length > 0 && (
                            <div className={gridClasses}>
                              {sectionFields.filter(field =>
                                !['father.nameMyanmar', 'father.nameEnglish', 'father.nrcNumber', 'father.occupation',
                                  'mother.nameMyanmar', 'mother.nameEnglish', 'mother.nrcNumber', 'mother.occupation',
                                  'guardian.nameMyanmar', 'guardian.nameEnglish', 'guardian.nrcNumber', 'guardian.occupation',
                                  'guardian.relationship', 'guardian.phoneNumber', 'guardian.address'].includes(field.fieldName)
                              ).map((field) => {
                                const fieldColSpan = field.fieldType === "textArea" || field.fieldType === "htmlContent"
                                  ? "col-span-2 md:col-span-2"
                                  : "";

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
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Standard layout for other sections
                        <div className={gridClasses}>
                          {sectionFields.map((field) => {
                            const fieldColSpan = field.fieldType === "textArea" || field.fieldType === "htmlContent"
                              ? "col-span-2 md:col-span-2"
                              : "";

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
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Unmatched Fields */}
            {fieldSections.unmatched && fieldSections.unmatched.length > 0 && (
              <Card className="relative shadow-xl border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <IconComponent name="FileText" className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      {currentLanguage === "mm" ? "အခြားအချက်အလက်များ" : "Other Information"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {fieldSections.unmatched.map((field) => (
                      <div
                        key={field.fieldName}
                        className={`${
                          field.fieldType === "textArea" || field.fieldType === "htmlContent"
                            ? "col-span-2 md:col-span-2"
                            : ""
                        } animate-in slide-in-from-bottom-2`}
                      >
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
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {submitError && (
              <Card className="border-destructive/50 bg-destructive/5 animate-in slide-in-from-top-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <IconComponent name="AlertTriangle" className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-2">
                        {currentLanguage === "mm"
                          ? "ဖောင်း အမှားများ တွေ့ရှိပါသည်"
                          : "Form Submission Error"}
                      </h4>
                      <div className="text-sm text-destructive/90 space-y-1">
                        {submitError.split("\n").map((line, index) => (
                          <div key={index}>
                            {line.trim() && (
                              <div className="flex items-start gap-2">
                                <IconComponent name="ChevronRight" className="w-3 h-3 mt-1" />
                                <span>{line}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      title="Close error message"
                      aria-label="Close error message"
                    >
                      <IconComponent name="X" className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Form Actions */}
            <Card className="sticky bottom-4 shadow-xl border-0 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {hasErrors ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <IconComponent name="AlertCircle" className="w-4 h-4" />
                        <span>
                          {currentLanguage === "mm"
                            ? "ပြင်ဆင်ရန် လိုအပ်ပါသည်"
                            : "Please fix the errors above"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IconComponent name="Info" className="w-4 h-4" />
                        <span>
                          {isDirty
                            ? currentLanguage === "mm"
                              ? "ပြောင်းလဲမှုများကို သိမ်းဆည်းရန် အဆင်သင့်"
                              : "Ready to save changes"
                            : currentLanguage === "mm"
                            ? "အချက်အလက်များ ဖြည့်စွက်ပါ"
                            : "Fill in the required fields"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        reset();
                        setSubmitError(null);
                      }}
                      disabled={isSubmittingForm || isSubmitting || !isDirty}
                    >
                      <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
                      {currentLanguage === "mm" ? "ပြန်လည်သတ်မှတ်" : "Reset"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => router.back()}
                      disabled={isSubmittingForm || isSubmitting}
                    >
                      <IconComponent name="X" className="w-4 h-4 mr-2" />
                      {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
                    </Button>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmittingForm || isSubmitting}
                      className="min-w-[150px]"
                    >
                      {isSubmittingForm || isSubmitting ? (
                        <>
                          <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                          {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <IconComponent name={action === "create" ? "Plus" : "Save"} className="w-4 h-4 mr-2" />
                          {action === "create"
                            ? currentLanguage === "mm"
                              ? "ကျောင်းသားဖန်တီးမည်"
                              : "Create Student"
                            : currentLanguage === "mm"
                            ? "မှတ်တမ်းတင်မည်"
                            : "Save Changes"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}