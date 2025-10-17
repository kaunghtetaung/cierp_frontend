"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Phone,
  MapPin,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
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

interface StudentRegistrationWizardProps {
  moduleSchema: ModuleSchema;
  user: UserType;
}

// Define 6 wizard steps (Contact merged into Personal)
const WIZARD_STEPS = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic personal details",
    icon: User,
    fields: [
      "nameMyanmar",
      "nameEnglish",
      "gender",
      "ethnicity",
      "religion",
      "bloodGroup",
      "nrcNumber",
      "dateOfBirth",
      "placeOfBirth",
      "phoneNumber",
      "email",
    ],
  },
  {
    id: "address",
    title: "Address Information",
    description: "Location and address details",
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
    title: "Family Information",
    description: "Parent and guardian details",
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
    title: "Academic Background",
    description: "Previous education records",
    icon: BookOpen,
    fields: ["previousEducation"],
  },
  {
    id: "current",
    title: "Current Academic",
    description: "University and batch enrollment",
    icon: GraduationCap,
    fields: ["medm", "batches"],
  },
  {
    id: "additional",
    title: "Additional Information",
    description: "Optional details",
    icon: FileText,
    fields: [
      "hobbies",
      "skills",
      "disabilities",
      "medicalConditions",
      "specialRequirements",
    ],
  },
];

export function StudentRegistrationWizard({
  moduleSchema,
  user,
}: StudentRegistrationWizardProps) {
  const router = useRouter();
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

  // Ref to track if we should allow form submission
  const canSubmitRef = useRef(false);

  // Filter and prepare form fields
  const filteredFormFields = React.useMemo(() => {
    return moduleSchema.formFields
      .filter((field) => !field.hidden)
      .map((field) => {
        if (!field.validationRule) {
          field = { ...field, validationRule: { required: false, errorMessage: { en: '', mm: '' } } };
        }
        return field;
      });
  }, [moduleSchema.formFields]);

  // Generate Zod schema
  const validationSchema = generateZodSchema(filteredFormFields);

  // Generate default values
  const defaultValues = generateDefaultValues(filteredFormFields);

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

  // Check for cached data on mount
  useEffect(() => {
    if (!user?.id) return;

    // Check if there's cached form data
    if (hasCachedFormData(user.id)) {
      const cached = loadFormDataFromCache(user.id);
      if (cached) {
        const age = getCachedDataAge(user.id);
        setCachedData({
          formData: cached.formData,
          currentStep: cached.currentStep,
          cacheAge: formatCacheAge(age || 0),
        });
        setShowRestoreDialog(true);
      }
    }
  }, [user?.id]);

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
      reset(cachedData.formData);
      setCurrentStep(cachedData.currentStep);
      setShowRestoreDialog(false);
    }
  };

  // Handle start fresh
  const handleStartFresh = () => {
    if (user?.id) {
      clearFormDataCache(user.id);
      reset();
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
          reset();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reset]);

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

      // Submit to backend using custom self-registration endpoint
      const { submitStudentSelfRegistration } = await import(
        "@/actions/student-registration"
      );
      const result = await submitStudentSelfRegistration(data);

      if (result.success) {
        // Clear cache on successful submission
        if (user?.id) {
          clearFormDataCache(user.id);
        }

        // Show success UI inline
        setIsSuccess(true);
      } else {
        console.error("❌ [FORM SUBMIT] Registration failed:", result.error);

        // Display error to user with toast
        if (result.fieldErrors && result.fieldErrors.length > 0) {
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
          toast.error("Registration Failed", {
            description:
              result.error ||
              "Failed to submit registration. Please try again.",
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
          className="space-y-6"
        >
          {/* Step Indicators - Desktop */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex justify-center items-center gap-2 mb-3">
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
            {/* Progress Bar - Small */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#4C67E1] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mobile Step Indicator */}
          <div className="md:hidden bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#4C67E1] text-white shadow-md">
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#19184A]">
                    {currentStepConfig.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {currentStepConfig.description}
                  </p>
                </div>
              </div>
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
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-[#19184A] mb-6 hidden md:block">
              {currentStepConfig.title}
            </h2>

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

          {/* Navigation Buttons */}
          <div className="flex justify-between bg-white rounded-lg shadow-sm p-6 border border-gray-200">
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
                {isSubmitting ? "Submitting..." : "Submit Registration"}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </>
  );
}
