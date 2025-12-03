"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  MapPin,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ModuleSchema, User as UserType } from "@repo/types";
import { Button } from "@repo/ui";
import { generateZodSchema, generateDefaultValues } from "@repo/schema-utils";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { AddressInfoStep } from "./AddressInfoStep";
import { FamilyInfoStep } from "./steps/FamilyInfoStep";
import { AcademicInfoStep } from "./steps/AcademicInfoStep";
import { CurrentAcademicStep } from "./steps/CurrentAcademicStep";
import { AdditionalInfoStep } from "./steps/AdditionalInfoStep";
import { RestoreCacheDialog } from "./RestoreCacheDialog";
import {
  saveFormDataToCache,
  loadFormDataFromCache,
  clearFormDataCache,
  hasCachedFormData,
  getCachedDataAge,
  formatCacheAge,
} from "@/lib/form-cache";
import { useLangSelector } from "@/feature-components/lang-selector";
import { translations } from "../translations";
import type { StudentProfileData } from "@/app/profile/student/actions";

interface StudentRegistrationWizardProps {
  moduleSchema: ModuleSchema;
  user: UserType;
  mode: 'create' | 'edit';
  existingProfile: StudentProfileData | null;
}

export function StudentRegistrationWizard({
  moduleSchema,
  user,
  mode,
  existingProfile,
}: StudentRegistrationWizardProps) {
  console.log('🎨 [WIZARD] Component initialized with:', {
    mode,
    hasExistingProfile: !!existingProfile,
    existingProfileStatus: existingProfile?.registrationStatus,
    userId: user.id,
  });

  const router = useRouter();
  const { currentLanguage } = useLangSelector();
  const t = translations[currentLanguage as keyof typeof translations] || translations.en;

  // Define 6 wizard steps (Contact merged into Personal) - using translations
  const WIZARD_STEPS = React.useMemo(() => [
    {
      id: "personal",
      title: t.personalInfoTitle,
      description: t.personalInfoDesc,
      icon: User,
      fields: [
        "nameMyanmar",
        "nameEnglish",
        "gender",
        "race",
        "religion",
        "bloodType",
        "nrcNumber",
        "dateOfBirth",
        "placeOfBirth",
        "phone",
        "email",
        "profilePhoto",
      ],
    },
    {
      id: "address",
      title: t.addressInfoTitle,
      description: t.addressInfoDesc,
      icon: MapPin,
      fields: [
        "stateRegionName",
        "districtName",
        "townshipName",
        "townName",
        "wardVillageName",
        "permanentAddress",
        "currentAddress",
      ],
    },
    {
      id: "family",
      title: t.familyInfoTitle,
      description: t.familyInfoDesc,
      icon: Users,
      fields: [
        "father.nameMyanmar",
        "father.nameEnglish",
        "father.nrcNumber",
        "father.occupation",
        "mother.nameMyanmar",
        "mother.nameEnglish",
        "mother.nrcNumber",
        "mother.occupation",
        "guardian.nameMyanmar",
        "guardian.nameEnglish",
        "guardian.nrcNumber",
        "guardian.occupation",
        "guardian.relationship",
        "guardian.phoneNumber",
        "guardian.email",
        "guardian.address",
      ],
    },
    {
      id: "academic",
      title: t.academicInfoTitle,
      description: t.academicInfoDesc,
      icon: BookOpen,
      fields: ["previousEducation"],
    },
    {
      id: "current",
      title: t.currentAcademicTitle,
      description: t.currentAcademicDesc,
      icon: GraduationCap,
      fields: ["medm", "batches"],
    },
    {
      id: "additional",
      title: t.additionalInfoTitle,
      description: t.additionalInfoDesc,
      icon: FileText,
      fields: [
        "hobbies",
        "skills",
        "disabilities",
        "medicalConditions",
        "specialRequirements",
      ],
    },
  ], [t]);

  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 (personal info)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [cachedData, setCachedData] = useState<{
    formData: Record<string, any>;
    currentStep: number;
    cacheAge: string;
  } | null>(null);

  // Success state - simple inline UI replacement
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper text visibility
  const [showHelper, setShowHelper] = useState(false);

  // Ref to track if we should allow form submission
  const canSubmitRef = useRef(false);

  // Filter and prepare form fields
  const filteredFormFields = React.useMemo(() => {
    // 🔍 DEBUG: Log all form fields from module schema
    console.log('📋 [WIZARD] Module schema formFields count:', moduleSchema.formFields.length);
    console.log('📋 [WIZARD] All field names:', moduleSchema.formFields.map((f) => f.fieldName));

    // Check if placeOfBirth is in the schema
    const hasPlaceOfBirth = moduleSchema.formFields.some((f) => f.fieldName === 'placeOfBirth');
    console.log('📋 [WIZARD] placeOfBirth in module schema?', hasPlaceOfBirth);

    if (hasPlaceOfBirth) {
      const placeOfBirthField = moduleSchema.formFields.find((f) => f.fieldName === 'placeOfBirth');
      console.log('📋 [WIZARD] placeOfBirth field config:', placeOfBirthField);
    }

    return moduleSchema.formFields
      .filter((field) => !field.hidden)
      .map((field) => {
        if (!field.validationRule) {
          field = { ...field, validationRule: { required: false, errorMessage: { en: '', mm: '' } } };
        }
        return field;
      });
  }, [moduleSchema.formFields]);

  // 🔍 DEBUG: Log filtered fields
  console.log('📋 [WIZARD] Filtered formFields count:', filteredFormFields.length);
  console.log('📋 [WIZARD] Filtered field names:', filteredFormFields.map((f) => f.fieldName));

  // Generate Zod schema
  const validationSchema = generateZodSchema(filteredFormFields);

  // Generate default values
  const defaultValues = generateDefaultValues(filteredFormFields);

  // 🔍 DEBUG: Log default values
  console.log('🎯 [WIZARD] Default values generated:', defaultValues);
  console.log('🎯 [WIZARD] placeOfBirth in defaultValues:', defaultValues.placeOfBirth);
  console.log('🎯 [WIZARD] placeOfBirth type in defaultValues:', typeof defaultValues.placeOfBirth);

  // 🔧 FIX: Ensure placeOfBirth has a default value if missing
  // This is critical because React Hook Form won't track fields that don't exist in defaultValues
  if (!('placeOfBirth' in defaultValues)) {
    console.warn('⚠️ [WIZARD] placeOfBirth not in defaultValues, adding it manually');
    defaultValues.placeOfBirth = '';
  }

  // 🔧 FIX: Ensure family member objects have all required fields with default values
  // Family fields are in conditionally rendered tabs - if a tab is never visited before submission,
  // Controller components won't mount and fields won't be registered with React Hook Form.
  // This ensures all fields are tracked even if the tab is never visited.

  // Father fields
  if (!defaultValues.father) {
    defaultValues.father = {};
  }
  const fatherMotherFields = ['nameMyanmar', 'nameEnglish', 'nrcNumber', 'occupation'];
  fatherMotherFields.forEach(field => {
    if (!(field in defaultValues.father)) {
      defaultValues.father[field] = '';
    }
  });

  // Mother fields
  if (!defaultValues.mother) {
    defaultValues.mother = {};
  }
  fatherMotherFields.forEach(field => {
    if (!(field in defaultValues.mother)) {
      defaultValues.mother[field] = '';
    }
  });

  // Guardian fields (includes extra fields like email, phone, address)
  if (!defaultValues.guardian) {
    defaultValues.guardian = {};
  }
  const guardianFields = ['nameMyanmar', 'nameEnglish', 'nrcNumber', 'occupation', 'relationship', 'phoneNumber', 'email', 'address'];
  guardianFields.forEach(field => {
    if (!(field in defaultValues.guardian)) {
      defaultValues.guardian[field] = '';
    }
  });

  console.log('🎯 [WIZARD] Final placeOfBirth in defaultValues:', defaultValues.placeOfBirth);
  console.log('🎯 [WIZARD] Final guardian in defaultValues:', defaultValues.guardian);

  // Initialize React Hook Form
  const methods = useForm({
    resolver: zodResolver(validationSchema as any),
    mode: "onChange",
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors },
  } = methods;

  // 🔍 DEBUG: Watch placeOfBirth field to monitor changes
  const placeOfBirthValue = watch('placeOfBirth');
  useEffect(() => {
    console.log('🎯 [WIZARD] placeOfBirth value changed:', placeOfBirthValue);
    console.log('🎯 [WIZARD] placeOfBirth type:', typeof placeOfBirthValue);
  }, [placeOfBirthValue]);

  // Initialize email from user on mount
  useEffect(() => {
    if (user?.email) {
      methods.setValue("email", user.email);
    }
  }, [user?.email, methods]);

  // Pre-populate form with existing profile data in edit mode
  useEffect(() => {
    const populateForm = async () => {
      if (mode === 'edit' && existingProfile) {
        console.log('📝 [EDIT MODE] Pre-populating form with existing profile data');
        console.log('📝 [EDIT MODE] Raw profile data:', existingProfile);

      // Helper function to extract ID from populated object or string
      const extractId = (field: any): string | undefined => {
        if (!field) return undefined;
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field._id) return field._id;
        return undefined;
      };

      // Log raw profile data for debugging
      console.log('🔍 [EDIT MODE] Raw batches from API:', existingProfile.batches);
      console.log('🔍 [EDIT MODE] Raw medm from API:', (existingProfile as any).medm);

      // Transform batches - handle populated batchId and academicYearId
      const transformedBatches = (existingProfile.batches || []).map((batch: any) => {
        console.log('🔄 [EDIT MODE] Transforming batch:', batch);
        const transformed = {
          batchId: extractId(batch.batchId),
          academicYearId: extractId(batch.academicYearId),
          rollNo: batch.rollNo || '',
          subjects: (batch.subjects || []).map((subject: any) => extractId(subject.subjectId) || extractId(subject)).filter(Boolean),
        };
        console.log('✅ [EDIT MODE] Batch transformed to:', transformed);
        return transformed;
      });

      // Transform previousEducation - handle populated subjects
      const transformedPreviousEducation = (existingProfile.previousEducation || []).map((edu: any) => ({
        className: edu.className || '',
        rollNumber: edu.rollNumber || '',
        examBoard: edu.examBoard || '',
        totalMarks: edu.totalMarks?.toString() || '',
        year: edu.year?.toString() || '',
        subjects: (edu.subjects || []).map((subject: any) => ({
          subjectId: extractId(subject.subjectId),
          mark: subject.mark || 0,
          isDistinction: subject.isDistinction || false,
        })),
      }));

      // Convert date of birth to YYYY-MM-DD format for date input
      // API returns ISO string like "1990-01-15T00:00:00.000Z"
      // HTML date input expects "YYYY-MM-DD" string
      let dobValue: string | undefined = undefined;
      if (existingProfile.dateOfBirth) {
        const date = new Date(existingProfile.dateOfBirth);
        // Format to YYYY-MM-DD (local date, not UTC)
        dobValue = date.toISOString().split('T')[0];
        console.log('📅 [EDIT MODE] Date of birth raw:', existingProfile.dateOfBirth);
        console.log('📅 [EDIT MODE] Date of birth formatted:', dobValue);
      }

      // Transform API data to form format
      const formData: any = {
        // Personal Information
        nameMyanmar: existingProfile.nameMyanmar || '',
        nameEnglish: existingProfile.nameEnglish || '',
        gender: existingProfile.gender || '',
        race: (existingProfile as any).race || '', // API uses 'race' not 'ethnicity'
        religion: existingProfile.religion || '',
        bloodType: (existingProfile as any).bloodType || '', // API uses 'bloodType' not 'bloodGroup'
        nrcNumber: existingProfile.nrcNumber || '',
        dateOfBirth: dobValue,
        placeOfBirth: existingProfile.placeOfBirth || '',
        phoneNumber: existingProfile.phoneNumber || '',
        email: existingProfile.email || user?.email || '',
        profilePhoto: existingProfile.profilePhoto || '',

        // 🔍 DEBUG: Log placeOfBirth from existing profile
        ...(console.log('🔍 [EDIT MODE] placeOfBirth from API:', existingProfile.placeOfBirth), {}),
        ...(console.log('🔍 [EDIT MODE] placeOfBirth in formData:', existingProfile.placeOfBirth || ''), {}),

        // Address Information
        stateRegionName: existingProfile.stateRegionName || '',
        districtName: existingProfile.districtName || '',
        townshipName: existingProfile.townshipName || '',
        townName: existingProfile.townName || '',
        wardVillageName: existingProfile.wardVillageName || '',
        permanentAddress: existingProfile.permanentAddress || '',
        currentAddress: existingProfile.currentAddress || '',

        // Family Information
        father: existingProfile.father || undefined,
        mother: existingProfile.mother || undefined,
        guardian: existingProfile.guardian || undefined,

        // Academic Information
        medm: (existingProfile as any).medm || '', // API uses 'medm', form uses 'medm'
        batches: transformedBatches,
        previousEducation: transformedPreviousEducation,

        // Additional Information
        hobbies: existingProfile.hobbies || '',
        skills: existingProfile.skills || '',
        disabilities: existingProfile.disabilities || '',
        medicalConditions: existingProfile.medicalConditions || '',
        specialRequirements: existingProfile.specialRequirements || '',
      };

      console.log('📝 [EDIT MODE] Transformed form data:', formData);
      console.log('📝 [EDIT MODE] MEDM Number in formData:', formData.medm);
      console.log('📝 [EDIT MODE] Profile Photo in formData:', formData.profilePhoto);
      console.log('📝 [EDIT MODE] Batches in formData:', formData.batches);
      console.log('📝 [EDIT MODE] Previous education in formData:', formData.previousEducation);

      // Log each batch detail for debugging
      formData.batches?.forEach((batch: any, idx: number) => {
        console.log(`📚 [EDIT MODE] Batch ${idx}:`, {
          batchId: batch.batchId,
          academicYearId: batch.academicYearId,
          rollNo: batch.rollNo
        });
      });

        // Reset form with existing data
        console.log('🔄 [EDIT MODE] Calling reset() with formData');

        // Use setTimeout to ensure form is fully mounted before resetting
        // This helps with Controller fields like DynamicSelect that need time to initialize
        // Increased delay to 500ms to allow components to mount and prepare
        setTimeout(() => {
          reset(formData);
          console.log('✅ [EDIT MODE] Form reset complete');
        }, 500);
      }
    };

    populateForm();
  }, [mode, existingProfile, reset, user?.email]);

  // Check for cached data on mount (only in create mode)
  useEffect(() => {
    console.log('🗄️ [CACHE CHECK] Running cache check:', {
      userId: user?.id,
      mode,
      shouldSkip: !user?.id || mode === 'edit'
    });

    if (!user?.id || mode === 'edit') {
      console.log('⏭️ [CACHE CHECK] Skipping cache check (edit mode or no userId)');
      return; // Skip cache check in edit mode
    }

    // Check if there's cached form data
    if (hasCachedFormData(user.id)) {
      console.log('📦 [CACHE CHECK] Found cached data');
      const cached = loadFormDataFromCache(user.id);
      if (cached) {
        const age = getCachedDataAge(user.id);
        setCachedData({
          formData: cached.formData,
          currentStep: cached.currentStep,
          cacheAge: formatCacheAge(age || 0),
        });
        setShowRestoreDialog(true);
        console.log('🔔 [CACHE CHECK] Showing restore dialog');
      }
    } else {
      console.log('📭 [CACHE CHECK] No cached data found');
    }
  }, [user?.id, mode]);

  // Auto-save form data to cache whenever form values change
  useEffect(() => {
    if (!user?.id || currentStep < 0) return;

    const subscription = watch((formData) => {
      saveFormDataToCache(user.id, "student", formData, currentStep);
    });

    return () => subscription.unsubscribe();
  }, [user?.id, currentStep, watch]);

  // Handle restore cached data
  const handleRestoreCache = () => {
    if (cachedData) {
      // Restore cached data but preserve email from user account
      const emailValue = user.email || '';
      reset({ ...cachedData.formData, email: emailValue });
      setCurrentStep(cachedData.currentStep);
      setShowRestoreDialog(false);
    }
  };

  // Handle start fresh
  const handleStartFresh = () => {
    if (user?.id) {
      clearFormDataCache(user.id);
      // Reset form but preserve email from user account
      const emailValue = user.email || '';
      reset({ ...defaultValues, email: emailValue });
      setCurrentStep(0);
      setShowRestoreDialog(false);
    }
  };

  // ESC key handler to reset all form fields (only when not in an input field)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();

        // Check if ESC is pressed inside any interactive element or dropdown
        const isInInput =
          tagName === "input" || tagName === "textarea" || tagName === "select";
        const isInButton = tagName === "button";
        const isInDropdown =
          target.closest('[role="dialog"]') ||
          target.closest("[data-radix-popper-content-wrapper]") ||
          target.closest("[data-radix-popover-content]");

        // Only reset form if ESC is pressed outside of interactive elements
        if (!isInInput && !isInButton && !isInDropdown) {
          event.preventDefault();
          // Reset form but preserve email from user account
          const emailValue = user.email || '';
          reset({ ...defaultValues, email: emailValue });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reset, user, defaultValues]);

  // Navigation handlers
  const handleNext = async () => {
    console.log("▶️  [handleNext] Called - Current step:", currentStep);
    console.log("▶️  [handleNext] Next step will be:", currentStep + 1);
    console.log("▶️  [handleNext] Total steps:", WIZARD_STEPS.length);

    if (currentStep < WIZARD_STEPS.length - 1) {
      // Validate current step fields before proceeding
      const currentStepConfig = WIZARD_STEPS[currentStep];
      const fieldsToValidate = currentStepConfig.fields;

      console.log("🔍 [Wizard] Validating step:", currentStepConfig.title);
      console.log("🔍 [Wizard] Fields to validate:", fieldsToValidate);

      const isValid = await trigger(fieldsToValidate);
      console.log("✅ [Wizard] Validation result:", isValid);

      if (isValid) {
        console.log(
          "📍 [handleNext] Setting current step to:",
          currentStep + 1
        );
        setCurrentStep(currentStep + 1);
        console.log("📍 [handleNext] Step changed, scrolling to top");
        window.scrollTo({ top: 0, behavior: "smooth" });
        console.log("📍 [handleNext] handleNext completed successfully");
      } else {
        console.log("❌ [Wizard] Validation failed - staying on current step");
        console.log("🔍 [Wizard] Current errors:", errors);
      }
    } else {
      console.log("⚠️  [handleNext] Already at last step - doing nothing");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Form submission
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // 🔍 CRITICAL DEBUGGING: Log the complete form data before submission
      console.log('🚀 [FORM SUBMIT] === FORM SUBMISSION STARTED ===');
      console.log('🚀 [FORM SUBMIT] Mode:', mode);
      console.log('🚀 [FORM SUBMIT] User ID:', user.id);
      console.log('🚀 [FORM SUBMIT] Complete Form Data:', JSON.stringify(data, null, 2));

      // Log family members data specifically
      console.log('👨 [FORM SUBMIT] Father object:', JSON.stringify(data.father, null, 2));
      console.log('👩 [FORM SUBMIT] Mother object:', JSON.stringify(data.mother, null, 2));
      console.log('👤 [FORM SUBMIT] Guardian object:', JSON.stringify(data.guardian, null, 2));
      console.log('📧 [FORM SUBMIT] Guardian email specifically:', data.guardian?.email);
      console.log('📞 [FORM SUBMIT] Guardian phone specifically:', data.guardian?.phoneNumber);
      console.log('🏠 [FORM SUBMIT] Guardian address specifically:', data.guardian?.address);

      console.log('🔍 [FORM SUBMIT] All personal fields:', {
        nameMyanmar: data.nameMyanmar,
        nameEnglish: data.nameEnglish,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        nrcNumber: data.nrcNumber,
        race: data.race,
        religion: data.religion,
        bloodType: data.bloodType,
      });

      let result;

      if (mode === 'edit') {
        // Update existing profile
        console.log('📝 [EDIT MODE] Updating profile');

        // Get student _id from existingProfile
        const studentId = existingProfile?._id;
        if (!studentId) {
          toast.error("Missing Student ID", {
            description: "Could not find student record ID. Please refresh and try again.",
            duration: 7000,
          });
          return;
        }

        console.log('📝 [EDIT MODE] Student ID:', studentId);

        const { updateMyProfile } = await import("@/app/profile/student/actions");
        result = await updateMyProfile(data, studentId);

        if (result.success) {
          toast.success("Profile Updated", {
            description: "Your profile has been updated successfully.",
            duration: 5000,
          });

          // Clear cache on successful update
          if (user?.id) {
            clearFormDataCache(user.id);
          }

          // Redirect to profile view page
          router.push("/profile/student");
          return;
        }
      } else {
        // Create new profile
        console.log('📝 [CREATE MODE] Creating new profile');
        const { submitStudentSelfRegistration } = await import(
          "@/actions/student-registration"
        );
        result = await submitStudentSelfRegistration(data);

        if (result.success) {
          // Clear cache on successful submission
          if (user?.id) {
            clearFormDataCache(user.id);
          }

          // Show success UI inline
          setIsSuccess(true);
          return;
        }
      }

      // Handle errors
      if (!result.success) {
        console.error("❌ [FORM SUBMIT] Submission failed:", result.error);

        // Check for PROFILE_LOCKED error (edit mode only)
        if (mode === 'edit' && result.error?.includes('PROFILE_LOCKED')) {
          toast.error("Profile Locked", {
            description: "Your profile can no longer be edited because it has been approved or rejected.",
            duration: 7000,
          });
          // Redirect to profile view
          setTimeout(() => router.push("/profile/student"), 2000);
          return;
        }

        // Display error to user with toast
        if ('fieldErrors' in result && result.fieldErrors && Array.isArray(result.fieldErrors) && result.fieldErrors.length > 0) {
          toast.error("Validation Failed", {
            description: (
              <div className="space-y-1">
                <p className="font-medium">
                  Please correct the following errors:
                </p>
                <ul className="list-disc list-inside text-sm">
                  {result.fieldErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 10000,
          });
        } else {
          toast.error(mode === 'edit' ? "Update Failed" : "Registration Failed", {
            description:
              result.error ||
              `Failed to ${mode === 'edit' ? 'update' : 'submit'} profile. Please try again.`,
            duration: 7000,
          });
        }
      }
    } catch (error) {
      console.error("❌ [FORM SUBMIT] Submit error:", error);
      toast.error("Unexpected Error", {
        description:
          "An unexpected error occurred. Please try again or contact support.",
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepConfig = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const StepIcon = currentStepConfig.icon;

  // Handle "Go to Home Page" button click
  const handleGoHome = () => {
    // Trigger router push which will cause layout to re-run getAuthenticationStatus
    // This will refresh the user token and update the UI
    router.push("/");
    router.refresh(); // Force a full page refresh to ensure token refresh
  };

  // Simple success page - inline UI replacement
  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message - English */}
          <h2 className="text-2xl font-bold text-center text-[#19184A] mb-3">
            Registration Successful!
          </h2>
          <h3 className="text-xl font-bold text-center text-[#19184A] mb-6">
            စာရင်းသွင်းခြင်း အောင်မြင်ပါသည်!
          </h3>

          {/* Info Box - English */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-5 mb-4">
            <p className="text-sm text-blue-900 leading-relaxed mb-3">
              <strong>Your profile data has been completed successfully.</strong>
            </p>
            <p className="text-sm text-blue-800 leading-relaxed mb-3">
              The Student Affairs Department will review and approve your registration request.
              You will receive an approval letter via email once the review is complete.
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Your submitted data is available at{" "}
              <a
                href="/profile/student"
                className="font-semibold underline hover:text-blue-600"
                target="_blank"
              >
                /profile/student
              </a>
              . Please save or print this document for your records.
            </p>
          </div>

          {/* Info Box - Myanmar */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-5 mb-6">
            <p className="text-sm text-green-900 leading-relaxed mb-3">
              <strong>သင့်ကိုယ်ရေးအချက်အလက်များ အောင်မြင်စွာ ပြည့်စုံပြီးပါပြီ။</strong>
            </p>
            <p className="text-sm text-green-800 leading-relaxed mb-3">
              ကျောင်းသားရေးရာဌာနမှ သင့်စာရင်းသွင်းမှုကို စစ်ဆေးပြီး အတည်ပြုပါမည်။
              စစ်ဆေးမှု ပြီးစီးသည်နှင့် သင့်အီးမေးလ်သို့ အတည်ပြုစာ ပေးပို့ပါမည်။
            </p>
            <p className="text-sm text-green-800 leading-relaxed">
              သင်တင်သွင်းထားသော အချက်အလက်များကို{" "}
              <a
                href="/profile/student"
                className="font-semibold underline hover:text-green-600"
                target="_blank"
              >
                /profile/student
              </a>
              {" "}တွင် ကြည့်ရှုနိုင်ပါသည်။ ကျေးဇူးပြု၍ ဤစာရွက်စာတမ်းကို သိမ်းဆည်းခြင်း သို့မဟုတ် ပရင့်ထုတ်ခြင်း ပြုလုပ်ပါ။
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => window.open('/profile/student', '_blank')}
              variant="outline"
              className="border-[#4C67E1] text-[#4C67E1] hover:bg-blue-50"
              size="lg"
            >
              View My Profile / ကျွန်ုပ်၏ ကိုယ်ရေးအချက်အလက်
            </Button>
            <Button
              onClick={handleGoHome}
              className="bg-[#4C67E1] hover:bg-[#3154A1] text-white"
              size="lg"
            >
              Go to Home Page / ပင်မစာမျက်နှာသို့
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Restore cache dialog */}
      {showRestoreDialog && cachedData && (
        <RestoreCacheDialog
          open={showRestoreDialog}
          cacheAge={cachedData.cacheAge}
          currentStep={cachedData.currentStep}
          totalSteps={WIZARD_STEPS.length}
          onRestore={handleRestoreCache}
          onStartFresh={handleStartFresh}
        />
      )}

      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            console.log("🔔 [FORM] Form onSubmit event fired");
            console.log("🔔 [FORM] Event type:", e.type);
            console.log("🔔 [FORM] Event target:", e.target);
            console.log("🔔 [FORM] Native event:", e.nativeEvent);
            console.log("🔔 [FORM] Current step at submit:", currentStep);
            console.log(
              "🔔 [FORM] canSubmitRef.current:",
              canSubmitRef.current
            );

            // Only allow submission if explicitly allowed via the submit button
            if (!canSubmitRef.current) {
              console.log(
                "🛑 [FORM] Preventing submission - canSubmitRef is false"
              );
              e.preventDefault();
              e.stopPropagation();
              return false;
            }

            console.log("✅ [FORM] Submission allowed - proceeding");
            handleSubmit(onSubmit)(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              console.log("⌨️  [FORM] Enter key pressed in form");
              console.log("⌨️  [FORM] Target element:", e.target);
              console.log("⌨️  [FORM] Current step:", currentStep);
            }
          }}
          className="space-y-0 sm:space-y-6"
        >
          {/* Edit Mode Indicator */}
          {mode === 'edit' && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-amber-800">
                    Edit Mode - Your registration status is pending
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    You can update your profile information. Changes will be reviewed by the administration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step Indicators - Desktop */}
          <div className="hidden md:block bg-white rounded-none shadow-sm p-4 border border-gray-200 mb-4">
            <div className="flex justify-between items-center gap-4 mb-3">
              {/* Previous Button - Circle */}
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-[#4C67E1] text-[#4C67E1] hover:bg-[#4C67E1] hover:text-white shadow-sm"
                }`}
                title={t.previousButton}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Step Icons */}
              <div className="flex justify-center items-center gap-2 flex-1">
                {WIZARD_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-[#4C67E1] text-white shadow-md"
                            : isCompleted
                            ? "bg-[#4C67E1] text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                        title={step.title}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      {index < WIZARD_STEPS.length - 1 && (
                        <div
                          className={`w-8 h-0.5 ${
                            isCompleted ? "bg-[#4C67E1]" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Next Button - Circle */}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === WIZARD_STEPS.length - 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep === WIZARD_STEPS.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#4C67E1] text-white hover:bg-[#3B56D1] shadow-sm"
                }`}
                title={t.nextButton}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {/* Progress Bar - Small */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#4C67E1] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tablet Step Indicator - hidden on mobile, shown on sm to md */}
          <div className="hidden sm:block md:hidden bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            {/* Navigation Buttons Row */}
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Previous Button - Circle */}
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-[#4C67E1] text-[#4C67E1] hover:bg-[#4C67E1] hover:text-white shadow-sm"
                }`}
                title={t.previousButton}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Step Dots */}
              <div className="flex items-center gap-1">
                {WIZARD_STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  return (
                    <div
                      key={step.id}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isActive
                          ? "bg-[#4C67E1] w-4"
                          : isCompleted
                          ? "bg-[#4C67E1]"
                          : "bg-gray-300"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Next Button - Circle */}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === WIZARD_STEPS.length - 1}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  currentStep === WIZARD_STEPS.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#4C67E1] text-white hover:bg-[#3B56D1] shadow-sm"
                }`}
                title={t.nextButton}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Step Info Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#4C67E1] text-white shadow-md">
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#19184A]">
                    {currentStep + 1}. {currentStepConfig.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {currentStepConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar - Small */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#4C67E1] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-none sm:rounded-lg shadow-sm p-4 sm:p-6 md:p-8 border-y sm:border border-gray-200 pb-20 sm:pb-6 md:pb-8 [&_input]:rounded-sm [&_input]:h-11 [&_button[role=combobox]]:rounded-sm [&_button[role=combobox]]:h-11 [&_select]:rounded-sm [&_select]:h-11 [&_[data-slot=select-trigger]]:rounded-sm [&_[data-slot=select-trigger]]:h-11 [&_textarea]:rounded-sm">
            {/* Step Header with Helper */}
            <div className="mb-6 hidden md:block">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-[#19184A]">
                  {currentStep + 1}. {currentStepConfig.title}
                </h2>

                {/* Helper Button */}
                <button
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4C67E1]/10 hover:bg-[#4C67E1]/20 text-[#4C67E1] transition-all"
                  title="Show help"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Helper Text */}
              {showHelper && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-[#4C67E1] rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-[#4C67E1] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {currentStep === 0 && t.personalInfoHelper}
                      {currentStep === 1 && t.addressInfoHelper}
                      {currentStep === 2 && t.familyInfoHelper}
                      {currentStep === 3 && t.academicInfoHelper}
                      {currentStep === 4 && t.currentAcademicHelper}
                      {currentStep === 5 && t.additionalInfoHelper}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Step Header with Helper */}
            <div className="mb-6 md:hidden">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#19184A]">
                    {currentStep + 1}. {currentStepConfig.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStepConfig.description}
                  </p>
                </div>

                {/* Helper Button */}
                <button
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4C67E1]/10 hover:bg-[#4C67E1]/20 text-[#4C67E1] transition-all flex-shrink-0"
                  title="Show help"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Helper Text */}
              {showHelper && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-[#4C67E1] rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-[#4C67E1] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {currentStep === 0 && t.personalInfoHelper}
                      {currentStep === 1 && t.addressInfoHelper}
                      {currentStep === 2 && t.familyInfoHelper}
                      {currentStep === 3 && t.academicInfoHelper}
                      {currentStep === 4 && t.currentAcademicHelper}
                      {currentStep === 5 && t.additionalInfoHelper}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {currentStep === 0 && <PersonalInfoStep user={user} />}
              {currentStep === 1 && <AddressInfoStep />}
              {currentStep === 2 && <FamilyInfoStep />}
              {currentStep === 3 && (
                <AcademicInfoStep moduleSchema={moduleSchema} />
              )}
              {currentStep === 4 && <CurrentAcademicStep />}
              {currentStep === 5 && <AdditionalInfoStep />}
            </div>
          </div>

          {/* Navigation Buttons - Fixed at bottom on mobile */}
          <div className="flex justify-between bg-white rounded-none sm:rounded-lg shadow-sm p-4 sm:p-6 border-y sm:border border-gray-200 fixed bottom-0 left-0 right-0 z-50 sm:static sm:z-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-2 border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => {
                  console.log("🖱️  [NEXT BUTTON] Next button clicked");
                  console.log("🖱️  [NEXT BUTTON] Current step:", currentStep);
                  console.log("🖱️  [NEXT BUTTON] Event:", e);
                  handleNext();
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#4C67E1] hover:bg-[#3154A1] text-white"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  console.log("🖱️  [SUBMIT BUTTON] Submit button clicked");
                  console.log("🖱️  [SUBMIT BUTTON] Current step:", currentStep);
                  console.log(
                    "🖱️  [SUBMIT BUTTON] Is submitting:",
                    isSubmitting
                  );
                  console.log(
                    "🖱️  [SUBMIT BUTTON] Setting canSubmitRef to true"
                  );
                  canSubmitRef.current = true;
                }}
                className="flex items-center gap-2 bg-[#4C67E1] hover:bg-[#3154A1] text-white"
              >
                {isSubmitting
                  ? (mode === 'edit' ? "Updating..." : "Submitting...")
                  : (mode === 'edit' ? "Update Profile" : "Submit Registration")
                }
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </>
  );
}
