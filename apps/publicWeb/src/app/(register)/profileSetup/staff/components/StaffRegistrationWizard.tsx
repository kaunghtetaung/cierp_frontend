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
  Briefcase,
  Phone,
  FileText,
} from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ModuleSchema, User as UserType } from "@repo/types";
import { Button } from "@repo/ui";
import { generateZodSchema, generateDefaultValues } from "@repo/schema-utils";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { AddressInfoStep } from "./steps/AddressInfoStep";
import { FamilyInfoStep } from "./steps/FamilyInfoStep";
import { EmploymentInfoStep } from "./steps/EmploymentInfoStep";
import { EmergencyContactStep } from "./steps/EmergencyContactStep";
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
import { submitStaffSelfRegistration } from "../staff-actions";

interface StaffRegistrationWizardProps {
  moduleSchema: ModuleSchema;
  user: UserType;
}

// Define 6 wizard steps for staff registration
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
      "dateOfBirth",
      "nrcNumber",
      "placeOfBirth",
      "ethnicity",
      "religion",
      "bloodGroup",
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
    id: "employment",
    title: "Employment Information",
    description: "Position and employment details",
    icon: Briefcase,
    fields: [
      "primaryAppointmentId",
      "employmentStatus",
      "employmentType",
      "joiningDate",
    ],
  },
  {
    id: "family",
    title: "Family Information",
    description: "Parent information",
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
    ],
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    description: "Emergency contact details",
    icon: Phone,
    fields: [
      "emergencyContact.name",
      "emergencyContact.relationship",
      "emergencyContact.phoneNumber",
      "emergencyContact.email",
      "emergencyContact.address",
    ],
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

export function StaffRegistrationWizard({
  moduleSchema,
  user,
}: StaffRegistrationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [cachedData, setCachedData] = useState<{
    formData: Record<string, any>;
    currentStep: number;
    cacheAge: string;
  } | null>(null);

  // Success state
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

    if (hasCachedFormData(user.id, 'staff')) {
      const cached = loadFormDataFromCache(user.id, 'staff');
      if (cached) {
        const age = getCachedDataAge(user.id, 'staff');
        setCachedData({
          formData: cached.formData,
          currentStep: cached.currentStep,
          cacheAge: formatCacheAge(age || 0),
        });
        setShowRestoreDialog(true);
      }
    }
  }, [user?.id]);

  // Save form data to cache whenever it changes
  useEffect(() => {
    if (!user?.id || isSuccess) return;

    const subscription = watch((formData) => {
      saveFormDataToCache(user.id, formData, currentStep, 'staff');
    });

    return () => subscription.unsubscribe();
  }, [watch, user?.id, currentStep, isSuccess]);

  // Restore cached data
  const handleRestoreCache = () => {
    if (cachedData) {
      reset(cachedData.formData);
      setCurrentStep(cachedData.currentStep);
      setShowRestoreDialog(false);
      toast.success("Form data restored successfully");
    }
  };

  // Discard cached data
  const handleDiscardCache = () => {
    if (user?.id) {
      clearFormDataCache(user.id, 'staff');
      setShowRestoreDialog(false);
      toast.info("Cached data discarded");
    }
  };

  // Get current step fields to validate
  const getCurrentStepFields = () => {
    const step = WIZARD_STEPS[currentStep];
    return step.fields;
  };

  // Navigation handlers
  const handleNext = async () => {
    const fields = getCurrentStepFields();
    const isValid = await trigger(fields as any);

    if (isValid) {
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      toast.error("Please fill in all required fields correctly");
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
    console.log("📝 [STAFF WIZARD] Form submission triggered", {
      currentStep,
      canSubmit: canSubmitRef.current,
      dataKeys: Object.keys(data),
    });

    if (!canSubmitRef.current) {
      console.log("⚠️ [STAFF WIZARD] Submission prevented - not final step");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 [STAFF WIZARD] Calling server action for staff registration");

      // Call server action for staff registration
      const result = await submitStaffSelfRegistration(data);

      console.log("✅ [STAFF WIZARD] Server action response:", result);

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      console.log("✅ [STAFF WIZARD] Registration successful, staffId:", result.staffId);

      // Clear cache on success
      if (user?.id) {
        clearFormDataCache(user.id, 'staff');
      }

      // Show success state
      setIsSuccess(true);
      toast.success("Staff registration completed successfully!");

      // Redirect after a delay
      setTimeout(() => {
        router.push("/profile/staff");
      }, 2000);

    } catch (error) {
      console.error("❌ [STAFF WIZARD] Registration failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    console.log("🎯 [STAFF WIZARD] Final submit button clicked");

    // Validate all fields in the last step
    const fields = getCurrentStepFields();
    const isValid = await trigger(fields as any);

    if (!isValid) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    // Set the flag to allow submission
    canSubmitRef.current = true;
    console.log("✅ [STAFF WIZARD] Validation passed, enabling submission");

    // Trigger form submission
    handleSubmit(onSubmit)();
  };

  // Render success view
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your staff profile has been created successfully. Redirecting to your profile...
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Please wait...
          </div>
        </div>
      </div>
    );
  }

  // Render current step component
  const renderStepContent = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case "personal":
        return <PersonalInfoStep />;
      case "address":
        return <AddressInfoStep />;
      case "employment":
        return <EmploymentInfoStep />;
      case "family":
        return <FamilyInfoStep />;
      case "emergency":
        return <EmergencyContactStep />;
      case "additional":
        return <AdditionalInfoStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Restore Cache Dialog */}
        {showRestoreDialog && cachedData && (
          <RestoreCacheDialog
            cacheAge={cachedData.cacheAge}
            onRestore={handleRestoreCache}
            onDiscard={handleDiscardCache}
          />
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Staff Registration
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete all steps to register as staff
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                        ${
                          isActive
                            ? "border-blue-600 bg-blue-600 text-white"
                            : isCompleted
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-300 bg-white text-gray-400"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium ${
                          isActive
                            ? "text-blue-600"
                            : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {WIZARD_STEPS[currentStep].title}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {WIZARD_STEPS[currentStep].description}
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStepContent()}
            </form>
          </div>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || isSubmitting}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </div>

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
