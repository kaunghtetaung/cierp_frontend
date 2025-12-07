"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { PublicNrcField } from "../PublicNrcField";
import { PhoneInput } from "@repo/schema-forms/PhoneInput";
import { Label } from "@repo/ui";
import { cn } from "@repo/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FamilyTab = "father" | "mother" | "guardian";
type GuardianType = "father" | "mother" | "other";

export function FamilyInfoStep() {
  const { register, control, formState: { errors }, trigger, watch, setValue, resetField, setError } = useFormContext();
  const [activeTab, setActiveTab] = useState<FamilyTab>("father");

  // Reusable key handler for input fields (ESC to reset, Enter prevention)
  const handleInputEscKey = (fieldName: string) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement | HTMLTextAreaElement).value = "";
      setValue(fieldName, "");

      // Trigger React Hook Form's onChange
      const event = new Event('input', { bubbles: true });
      e.target.dispatchEvent(event);
    } else if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      // Prevent Enter key from submitting the form on input fields
      e.preventDefault();
    }
  };

  // ESC key handler for Select fields
  const handleSelectEscKey = (fieldName: string, currentValue: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && currentValue) {
      e.preventDefault();
      e.stopPropagation();
      setValue(fieldName, "");
    }
  };

  // Guardian selection state with localStorage support
  const [guardianType, setGuardianType] = useState<GuardianType>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studentRegistration_guardianType');
      if (saved && (saved === 'father' || saved === 'mother' || saved === 'other')) {
        console.log('📋 [FamilyInfoStep] Loaded guardian type from localStorage:', saved);
        return saved as GuardianType;
      }
    }
    return "other";
  });

  // Save guardian type to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studentRegistration_guardianType', guardianType);
      console.log('📋 [FamilyInfoStep] Saved guardian type to localStorage:', guardianType);
    }
  }, [guardianType]);

  // Watch for guardian address to sync with permanent address checkbox
  const guardianAddress = watch("guardian.address");

  // State for "Same as Student's Permanent Address" checkbox
  const [sameAsStudentAddress, setSameAsStudentAddress] = useState(false);

  // Sync guardian address with student's permanent address when checkbox is checked
  const studentPermanentAddress = watch("permanentAddress");

  // Watch father and mother data for auto-population
  const fatherData = watch("father");
  const motherData = watch("mother");

  // Handle guardian data auto-population based on selected type
  useEffect(() => {
    // Only auto-populate when on guardian tab
    if (activeTab === "guardian") {
      if (guardianType === "father" && fatherData) {
        console.log("📋 [FamilyInfoStep] Copying father's data to guardian");
        console.log("📋 [FamilyInfoStep] Father NRC value:", fatherData.nrcNumber);
        setValue("guardian.nameMyanmar", fatherData.nameMyanmar || "");
        setValue("guardian.nameEnglish", fatherData.nameEnglish || "");
        // Use shouldDirty and shouldValidate to ensure the value is properly registered
        setValue("guardian.nrcNumber", fatherData.nrcNumber || "", { shouldDirty: true, shouldValidate: false });
        setValue("guardian.occupation", fatherData.occupation || "");
        setValue("guardian.relationship", "Father");
      } else if (guardianType === "mother" && motherData) {
        console.log("📋 [FamilyInfoStep] Copying mother's data to guardian");
        console.log("📋 [FamilyInfoStep] Mother NRC value:", motherData.nrcNumber);
        setValue("guardian.nameMyanmar", motherData.nameMyanmar || "");
        setValue("guardian.nameEnglish", motherData.nameEnglish || "");
        // Use shouldDirty and shouldValidate to ensure the value is properly registered
        setValue("guardian.nrcNumber", motherData.nrcNumber || "", { shouldDirty: true, shouldValidate: false });
        setValue("guardian.occupation", motherData.occupation || "");
        setValue("guardian.relationship", "Mother");
      } else if (guardianType === "other") {
        // Don't clear fields when switching to "other" to preserve any existing data
        console.log("📋 [FamilyInfoStep] Guardian type set to 'other'");
      }
    }
  }, [activeTab, guardianType, fatherData, motherData, setValue]);

  useEffect(() => {
    if (sameAsStudentAddress && studentPermanentAddress) {
      console.log("📋 [FamilyInfoStep] Copying student's permanent address to guardian address");
      setValue("guardian.address", studentPermanentAddress);
    }
  }, [sameAsStudentAddress, studentPermanentAddress, setValue]);

  // ESC key handler to reset current tab's fields
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();

        // Check if ESC is pressed inside any interactive element or dropdown
        const isInInput = tagName === "input" || tagName === "textarea" || tagName === "select";
        const isInButton = tagName === "button";
        const isInDropdown = target.closest('[role="dialog"]') ||
                           target.closest('[data-radix-popper-content-wrapper]') ||
                           target.closest('[data-radix-popover-content]');

        // Only reset current tab's fields if ESC is pressed outside of interactive elements
        if (!isInInput && !isInButton && !isInDropdown) {
          event.preventDefault();
          event.stopPropagation(); // Stop event from reaching the wizard's ESC handler
          console.log("🔄 [FamilyInfoStep] ESC pressed - resetting current tab:", activeTab);

          // Reset fields based on current active tab
          const fieldsToReset = getFieldsForTab(activeTab);
          console.log("🔄 [FamilyInfoStep] Fields to reset:", fieldsToReset);

          fieldsToReset.forEach((field) => {
            console.log("🔄 [FamilyInfoStep] Resetting field:", field);
            resetField(field);
          });

          // Reset additional state for guardian tab
          if (activeTab === "guardian") {
            console.log("🔄 [FamilyInfoStep] Resetting guardian additional state");
            setSameAsStudentAddress(false);
            setGuardianType("other");
            localStorage.removeItem('studentRegistration_guardianType');
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, resetField, setSameAsStudentAddress, setGuardianType]);

  const inputClass = cn(
    "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
    "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
    "text-sm text-gray-900 placeholder-gray-400"
  );

  const labelClass = "text-sm font-medium text-gray-700";

  const tabs: { value: FamilyTab; label: string }[] = [
    { value: "father", label: "Father Information" },
    { value: "mother", label: "Mother Information" },
    { value: "guardian", label: "Guardian Information" },
  ];

  // Helper function to validate NRC format
  const isValidNrcFormat = (nrcValue: string): boolean => {
    if (!nrcValue) return false;
    // Match complete NRC format: {state}/{township}({type}){serial}
    const nrcRegex = /^(\d{1,2}[\*]?)\/([A-Za-z\u1000-\u109F]+)\(([NEPTYS])\)(\d{6})$/;
    return nrcRegex.test(nrcValue);
  };

  // NRC field mapping for each tab
  const nrcFieldMap: Record<FamilyTab, string> = {
    father: "father.nrcNumber",
    mother: "mother.nrcNumber",
    guardian: "guardian.nrcNumber",
  };

  // Required text fields for each tab
  const requiredFieldsMap: Record<FamilyTab, { field: string; label: string }[]> = {
    father: [
      { field: "father.nameMyanmar", label: "Father's Name (Myanmar)" },
      { field: "father.nameEnglish", label: "Father's Name (English)" },
      { field: "father.nrcNumber", label: "Father's NRC" },
      { field: "father.occupation", label: "Father's Occupation" },
    ],
    mother: [
      { field: "mother.nameMyanmar", label: "Mother's Name (Myanmar)" },
      { field: "mother.nameEnglish", label: "Mother's Name (English)" },
      { field: "mother.nrcNumber", label: "Mother's NRC" },
      { field: "mother.occupation", label: "Mother's Occupation" },
    ],
    guardian: [
      { field: "guardian.nameMyanmar", label: "Guardian's Name (Myanmar)" },
      { field: "guardian.nameEnglish", label: "Guardian's Name (English)" },
      { field: "guardian.nrcNumber", label: "Guardian's NRC" },
      { field: "guardian.occupation", label: "Guardian's Occupation" },
      { field: "guardian.relationship", label: "Guardian's Relationship" },
      { field: "guardian.phoneNumber", label: "Guardian's Phone Number" },
      { field: "guardian.email", label: "Guardian's Email" },
      { field: "guardian.address", label: "Guardian's Address" },
    ],
  };

  // Validate NRC for current tab and set error if invalid
  const validateAndSetNrcError = (tab: FamilyTab): boolean => {
    const nrcField = nrcFieldMap[tab];
    const nrcValue = watch(nrcField);
    console.log(`🔍 [FamilyInfoStep] Validating ${tab} NRC:`, nrcValue);

    // NRC is required - check if empty
    if (!nrcValue || (typeof nrcValue === "string" && !nrcValue.trim())) {
      setError(nrcField as any, {
        type: "manual",
        message: `${tab.charAt(0).toUpperCase() + tab.slice(1)}'s NRC is required`,
      });
      console.log(`❌ [FamilyInfoStep] ${tab} NRC validation failed - field is required`);
      return false;
    }

    // Check NRC format if value exists
    if (nrcValue && !isValidNrcFormat(nrcValue)) {
      // Set error for incomplete NRC
      setError(nrcField as any, {
        type: "manual",
        message: `Please complete all NRC fields for ${tab.charAt(0).toUpperCase() + tab.slice(1)}`,
      });
      console.log(`❌ [FamilyInfoStep] ${tab} NRC validation failed - incomplete format`);
      return false;
    }

    return true;
  };

  // Validate all required text fields for current tab and set errors for empty fields
  const validateRequiredFields = (tab: FamilyTab): boolean => {
    const requiredFields = requiredFieldsMap[tab];
    let isValid = true;

    console.log(`🔍 [FamilyInfoStep] Validating required fields for ${tab}:`, requiredFields);

    for (const { field, label } of requiredFields) {
      // Skip NRC fields here - they are validated separately with format validation
      if (field.endsWith(".nrcNumber")) continue;

      const value = watch(field);
      console.log(`🔍 [FamilyInfoStep] Checking ${field}:`, value);

      if (!value || (typeof value === "string" && !value.trim())) {
        isValid = false;
        setError(field as any, {
          type: "manual",
          message: `${label} is required`,
        });
        console.log(`❌ [FamilyInfoStep] ${field} validation failed - field is required`);
      }
    }

    return isValid;
  };

  const handleTabChange = async (newTab: FamilyTab) => {
    // Validate current tab before switching
    const fieldsToValidate = getFieldsForTab(activeTab);
    console.log("🔍 [FamilyInfoStep] Validating fields before tab change:", activeTab, "→", newTab);

    // Run Zod validation
    const isZodValid = await trigger(fieldsToValidate);
    console.log("✅ [FamilyInfoStep] Zod validation result:", isZodValid);

    // Validate NRC format for current tab
    const isNrcValid = validateAndSetNrcError(activeTab);

    // Validate all required text fields for current tab
    const areRequiredFieldsValid = validateRequiredFields(activeTab);

    // Check for existing manual errors
    const currentErrors = errors;
    const hasManualErrors = fieldsToValidate.some(fieldName => {
      const parts = fieldName.split('.');
      let errorObj: any = currentErrors;
      for (const part of parts) {
        if (!errorObj) break;
        errorObj = errorObj[part];
      }
      return !!errorObj;
    });

    const isValid = isZodValid && !hasManualErrors && isNrcValid && areRequiredFieldsValid;

    if (isValid) {
      setActiveTab(newTab);
    } else {
      console.log("❌ [FamilyInfoStep] Validation failed - cannot switch tabs");
      console.log("🔍 [FamilyInfoStep] Current errors:", errors);
    }
  };

  const handleNext = async () => {
    const currentIndex = tabs.findIndex(t => t.value === activeTab);
    if (currentIndex < tabs.length - 1) {
      const fieldsToValidate = getFieldsForTab(activeTab);
      console.log("🔍 [FamilyInfoStep] Validating fields for tab:", activeTab, fieldsToValidate);

      // Get current form values for debugging
      const formValues = watch();
      console.log("📋 [FamilyInfoStep] Current form values:", formValues);

      // Run Zod validation
      const isZodValid = await trigger(fieldsToValidate);
      console.log("✅ [FamilyInfoStep] Zod validation result:", isZodValid);

      // Validate NRC format for current tab
      const isNrcValid = validateAndSetNrcError(activeTab);

      // Validate all required text fields for current tab
      const areRequiredFieldsValid = validateRequiredFields(activeTab);

      // Check for existing manual errors
      const currentErrors = errors;
      const hasManualErrors = fieldsToValidate.some(fieldName => {
        const parts = fieldName.split('.');
        let errorObj: any = currentErrors;
        for (const part of parts) {
          if (!errorObj) break;
          errorObj = errorObj[part];
        }
        return !!errorObj;
      });

      console.log("🔍 [FamilyInfoStep] Has manual errors:", hasManualErrors);
      console.log("🔍 [FamilyInfoStep] Is NRC valid:", isNrcValid);
      console.log("🔍 [FamilyInfoStep] Are required fields valid:", areRequiredFieldsValid);

      const isValid = isZodValid && !hasManualErrors && isNrcValid && areRequiredFieldsValid;

      if (isValid) {
        setActiveTab(tabs[currentIndex + 1].value);
      } else {
        console.log("❌ [FamilyInfoStep] Validation failed - staying on current tab");
      }
    }
  };

  const handlePrevious = async () => {
    const currentIndex = tabs.findIndex(t => t.value === activeTab);
    if (currentIndex > 0) {
      const fieldsToValidate = getFieldsForTab(activeTab);
      console.log("🔍 [FamilyInfoStep] Validating fields before previous tab:", activeTab);

      // Run Zod validation
      const isZodValid = await trigger(fieldsToValidate);
      console.log("✅ [FamilyInfoStep] Zod validation result:", isZodValid);

      // Validate NRC format for current tab
      const isNrcValid = validateAndSetNrcError(activeTab);

      // Validate all required text fields for current tab
      const areRequiredFieldsValid = validateRequiredFields(activeTab);

      // Check for existing manual errors
      const currentErrors = errors;
      const hasManualErrors = fieldsToValidate.some(fieldName => {
        const parts = fieldName.split('.');
        let errorObj: any = currentErrors;
        for (const part of parts) {
          if (!errorObj) break;
          errorObj = errorObj[part];
        }
        return !!errorObj;
      });

      console.log("🔍 [FamilyInfoStep] Has manual errors:", hasManualErrors);
      console.log("🔍 [FamilyInfoStep] Is NRC valid:", isNrcValid);
      console.log("🔍 [FamilyInfoStep] Are required fields valid:", areRequiredFieldsValid);

      const isValid = isZodValid && !hasManualErrors && isNrcValid && areRequiredFieldsValid;

      if (isValid) {
        setActiveTab(tabs[currentIndex - 1].value);
      } else {
        console.log("❌ [FamilyInfoStep] Validation failed - cannot go to previous tab");
      }
    }
  };

  const getFieldsForTab = (tab: FamilyTab): string[] => {
    switch (tab) {
      case "father":
        return ["father.nameMyanmar", "father.nameEnglish", "father.nrcNumber", "father.occupation"];
      case "mother":
        return ["mother.nameMyanmar", "mother.nameEnglish", "mother.nrcNumber", "mother.occupation"];
      case "guardian":
        return [
          "guardian.nameMyanmar",
          "guardian.nameEnglish",
          "guardian.nrcNumber",
          "guardian.occupation",
          "guardian.relationship",
          "guardian.phoneNumber",
          "guardian.email",
          "guardian.address"
        ];
      default:
        return [];
    }
  };

  const handleSameAsStudentAddress = (checked: boolean) => {
    console.log("☑️ [FamilyInfoStep] Same as student address checkbox:", checked);
    setSameAsStudentAddress(checked);
    if (checked && studentPermanentAddress) {
      setValue("guardian.address", studentPermanentAddress);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative border-b-2",
                activeTab === tab.value
                  ? "text-[#4C67E1] border-[#4C67E1]"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Father Information Tab */}
        {activeTab === "father" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">All fields marked with <span className="text-red-500">*</span> are required</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (Myanmar)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("father.nameMyanmar")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.father as any)?.nameMyanmar && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter father's name in Myanmar"
                  onKeyDown={handleInputEscKey("father.nameMyanmar")}
                />
                {(errors.father as any)?.nameMyanmar && (
                  <p className="text-sm text-red-600">{(errors.father as any).nameMyanmar.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (English)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("father.nameEnglish")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.father as any)?.nameEnglish && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter father's name in English"
                  onKeyDown={handleInputEscKey("father.nameEnglish")}
                />
                {(errors.father as any)?.nameEnglish && (
                  <p className="text-sm text-red-600">{(errors.father as any).nameEnglish.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Controller
                  name="father.nrcNumber"
                  control={control}
                  render={({ field }) => (
                    <PublicNrcField
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={(errors.father as any)?.nrcNumber?.message as string}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Occupation
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("father.occupation")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.father as any)?.occupation && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter father's occupation"
                  onKeyDown={handleInputEscKey("father.occupation")}
                />
                {(errors.father as any)?.occupation && (
                  <p className="text-sm text-red-600">{(errors.father as any).occupation.message as string}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mother Information Tab */}
        {activeTab === "mother" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">All fields marked with <span className="text-red-500">*</span> are required</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (Myanmar)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("mother.nameMyanmar")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.mother as any)?.nameMyanmar && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter mother's name in Myanmar"
                  onKeyDown={handleInputEscKey("mother.nameMyanmar")}
                />
                {(errors.mother as any)?.nameMyanmar && (
                  <p className="text-sm text-red-600">{(errors.mother as any).nameMyanmar.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (English)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("mother.nameEnglish")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.mother as any)?.nameEnglish && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter mother's name in English"
                  onKeyDown={handleInputEscKey("mother.nameEnglish")}
                />
                {(errors.mother as any)?.nameEnglish && (
                  <p className="text-sm text-red-600">{(errors.mother as any).nameEnglish.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Controller
                  name="mother.nrcNumber"
                  control={control}
                  render={({ field }) => (
                    <PublicNrcField
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={(errors.mother as any)?.nrcNumber?.message as string}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Occupation
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <input
                  {...register("mother.occupation")}
                  type="text"
                  className={cn(
                    inputClass,
                    (errors.mother as any)?.occupation && "border-red-300 focus:border-red-500"
                  )}
                  placeholder="Enter mother's occupation"
                  onKeyDown={handleInputEscKey("mother.occupation")}
                />
                {(errors.mother as any)?.occupation && (
                  <p className="text-sm text-red-600">{(errors.mother as any).occupation.message as string}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Guardian Information Tab */}
        {activeTab === "guardian" && (
          <div className="space-y-6">
            {/* Guardian Type Selection */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Label className="text-sm font-medium text-gray-700">
                Select Guardian
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#4C67E1] hover:bg-[#4C67E1]/5 transition-all">
                  <input
                    type="radio"
                    name="guardianType"
                    value="father"
                    checked={guardianType === "father"}
                    onChange={(e) => setGuardianType(e.target.value as GuardianType)}
                    className="h-4 w-4 text-[#4C67E1] focus:ring-[#4C67E1] border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Father</span>
                </label>
                <label className="flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#4C67E1] hover:bg-[#4C67E1]/5 transition-all">
                  <input
                    type="radio"
                    name="guardianType"
                    value="mother"
                    checked={guardianType === "mother"}
                    onChange={(e) => setGuardianType(e.target.value as GuardianType)}
                    className="h-4 w-4 text-[#4C67E1] focus:ring-[#4C67E1] border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Mother</span>
                </label>
                <label className="flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#4C67E1] hover:bg-[#4C67E1]/5 transition-all">
                  <input
                    type="radio"
                    name="guardianType"
                    value="other"
                    checked={guardianType === "other"}
                    onChange={(e) => setGuardianType(e.target.value as GuardianType)}
                    className="h-4 w-4 text-[#4C67E1] focus:ring-[#4C67E1] border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Other</span>
                </label>
              </div>
            </div>

            <p className="text-sm text-gray-600">All fields marked with <span className="text-red-500">*</span> are required</p>

            {/* Contact Information - Phone, Email, Address (moved to top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>
                  Phone Number
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      error={!!(errors.guardian as any)?.phoneNumber}
                      config={{
                        defaultCountry: 'MM',
                        preferredCountries: ['MM', 'US', 'GB'],
                        showDialingCode: true,
                        showCountryFlag: true,
                        autoFormat: true,
                      }}
                    />
                  )}
                />
                {(errors.guardian as any)?.phoneNumber && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).phoneNumber.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Email
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      type="email"
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.email && "border-red-300 focus:border-red-500"
                      )}
                      placeholder="Enter email address"
                      onKeyDown={handleInputEscKey("guardian.email")}
                    />
                  )}
                />
                {(errors.guardian as any)?.email && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).email.message as string}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className={labelClass}>
                  Address
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.address"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.address && "border-red-300 focus:border-red-500",
                        sameAsStudentAddress && "bg-gray-50"
                      )}
                      placeholder="Enter full address"
                      disabled={sameAsStudentAddress}
                      onKeyDown={handleInputEscKey("guardian.address")}
                    />
                  )}
                />

                {/* Checkbox: Same as Student's Permanent Address */}
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="sameAsStudentAddress"
                    checked={sameAsStudentAddress}
                    onChange={(e) => handleSameAsStudentAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#4C67E1] focus:ring-[#4C67E1] cursor-pointer"
                  />
                  <label
                    htmlFor="sameAsStudentAddress"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Same as Student's Permanent Address
                  </label>
                </div>

                {(errors.guardian as any)?.address && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).address.message as string}</p>
                )}
              </div>
            </div>

            {/* Name and Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1: Name Myanmar, Name English, Relationship */}
              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (Myanmar)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.nameMyanmar"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      type="text"
                      disabled={guardianType !== "other"}
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.nameMyanmar && "border-red-300 focus:border-red-500",
                        guardianType !== "other" && "bg-gray-100 cursor-not-allowed"
                      )}
                      placeholder="Enter guardian's name in Myanmar"
                      onKeyDown={handleInputEscKey("guardian.nameMyanmar")}
                    />
                  )}
                />
                {(errors.guardian as any)?.nameMyanmar && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).nameMyanmar.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Name (English)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.nameEnglish"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      type="text"
                      disabled={guardianType !== "other"}
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.nameEnglish && "border-red-300 focus:border-red-500",
                        guardianType !== "other" && "bg-gray-100 cursor-not-allowed"
                      )}
                      placeholder="Enter guardian's name in English"
                      onKeyDown={handleInputEscKey("guardian.nameEnglish")}
                    />
                  )}
                />
                {(errors.guardian as any)?.nameEnglish && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).nameEnglish.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Relationship
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.relationship"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      type="text"
                      disabled={guardianType !== "other"}
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.relationship && "border-red-300 focus:border-red-500",
                        guardianType !== "other" && "bg-gray-100 cursor-not-allowed"
                      )}
                      placeholder="e.g., Uncle, Aunt"
                      onKeyDown={handleInputEscKey("guardian.relationship")}
                    />
                  )}
                />
                {(errors.guardian as any)?.relationship && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).relationship.message as string}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 2: NRC, Occupation */}
              <div className="space-y-2">
                <Controller
                  name="guardian.nrcNumber"
                  control={control}
                  render={({ field }) => (
                    <PublicNrcField
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={(errors.guardian as any)?.nrcNumber?.message as string}
                      disabled={guardianType !== "other"}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>
                  Occupation
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Controller
                  name="guardian.occupation"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      type="text"
                      disabled={guardianType !== "other"}
                      className={cn(
                        inputClass,
                        (errors.guardian as any)?.occupation && "border-red-300 focus:border-red-500",
                        guardianType !== "other" && "bg-gray-100 cursor-not-allowed"
                      )}
                      placeholder="Enter guardian's occupation"
                      onKeyDown={handleInputEscKey("guardian.occupation")}
                    />
                  )}
                />
                {(errors.guardian as any)?.occupation && (
                  <p className="text-sm text-red-600">{(errors.guardian as any).occupation.message as string}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={activeTab === "father"}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "father"
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                activeTab === tab.value ? "bg-[#4C67E1] w-8" : "bg-gray-300"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={activeTab === "guardian"}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "guardian"
              ? "text-gray-400 cursor-not-allowed"
              : "text-white bg-[#4C67E1] hover:bg-[#3A55D1]"
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
