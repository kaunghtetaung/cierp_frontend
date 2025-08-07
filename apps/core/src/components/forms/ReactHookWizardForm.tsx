"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError, toastWarning, toastInfo } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { IconComponent, IconSelector } from "@repo/ui/components/icons";
import { MultiLanguageInput } from "./MultiLanguageInput";
import { DynamicSelect } from "./DynamicSelect";
import { generateZodSchema } from "@/lib/form-schema";
import { useWizardStorage } from "@/hooks/use-wizard-storage";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { ModuleSchema, FormField } from "@repo/types";

interface ReactHookWizardFormProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  currentLanguage: string;
  userId?: string;
}

interface LocalWizardStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  fields: FormField[];
  stepNumber: number;
}

// Validate and filter fields to prevent React Hook Form Controller errors
function validateAndFilterFields(fields: FormField[]): FormField[] {
  if (!Array.isArray(fields)) {
    console.error('validateAndFilterFields: fields is not an array', fields);
    return [];
  }
  
  return fields.filter((field) => {
    // Check if field exists
    if (!field) {
      console.warn('validateAndFilterFields: Found null/undefined field');
      return false;
    }
    
    // Check if field has a valid fieldName
    if (!field.fieldName || typeof field.fieldName !== 'string' || field.fieldName.trim() === '') {
      console.warn('validateAndFilterFields: Invalid fieldName', { field, fieldName: field.fieldName });
      return false;
    }
    
    // Check if field has a valid fieldType
    if (!field.fieldType || typeof field.fieldType !== 'string') {
      console.warn('validateAndFilterFields: Invalid fieldType', { field, fieldType: field.fieldType });
      return false;
    }
    
    return true;
  });
}

// Generate HTML5 validation attributes from schema
function getValidationProps(field: FormField) {
  const props: Record<string, any> = {};

  if (field.fieldType === "email") {
    props.type = "email";
  }

  if (field.fieldType === "number") {
    props.type = "number";
    if (field.validationRule?.min !== undefined)
      props.min = field.validationRule.min;
    if (field.validationRule?.max !== undefined)
      props.max = field.validationRule.max;
  }

  if (field.fieldType === "date") {
    props.type = "date";
  }

  if (field.validationRule?.minLength) {
    props.minLength = field.validationRule.minLength;
  }

  if (field.validationRule?.maxLength) {
    props.maxLength = field.validationRule.maxLength;
  }

  if (field.validationRule?.pattern) {
    props.pattern = field.validationRule.pattern;
  }

  return props;
}

// Auto-configure dropdownConfig for common organizational fields
function autoConfigureDropdown(field: FormField): FormField {
  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    return field;
  }

  // Auto-configure organization fields
  if (field.fieldName === 'organizationId' || 
      field.fieldName === 'organization' ||
      field.fieldName.toLowerCase().includes('organization')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/organizations/ref",
        searchable: true,
        clearable: false,
        preloadData: true
      }
    };
  }

  // Auto-configure department fields (dependent on organization)
  if (field.fieldName === 'departmentId' || 
      field.fieldName === 'department' ||
      field.fieldName.toLowerCase().includes('department')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/departments/ref",
        dependsOn: ["organizationId", "organization"],
        searchable: true,
        clearable: true,
        preloadData: false
      }
    };
  }

  // Auto-configure user fields
  if (field.fieldName === 'userId' || 
      field.fieldName === 'user' ||
      field.fieldName === 'assignedTo' ||
      field.fieldName.toLowerCase().includes('user')) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/users/ref",
        searchable: true,
        clearable: true,
        preloadData: false
      }
    };
  }

  // Return original field if no auto-configuration applies
  return field;
}

// Convert dataSource configuration to dropdownConfig for backward compatibility
function convertDataSourceToDropdownConfig(field: FormField): FormField {
  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    return field;
  }

  // Handle fields with dataSource configuration
  if (field.dataSource) {
    const dropdownConfig: any = {
      type: "dynamic",
      refPath: field.dataSource.endpoint,
      searchable: true,
      clearable: true,
      preloadData: field.fieldType === "dynamicSelect" ? true : false
    };

    // Handle dependent fields
    if (field.fieldType === "dependentSelect" && field.dataSource.dependentField) {
      dropdownConfig.dependsOn = [field.dataSource.dependentField];
    }

    return {
      ...field,
      fieldType: field.fieldType === "multiDependentSelect" ? "multiSelect" : "select",
      dropdownConfig
    };
  }

  return field;
}

// Icon field component with React Hook Form integration
function IconFieldComponent({
  field,
  control,
  currentLanguage,
  isVerticalLayout = false,
  errors,
}: {
  field: FormField;
  control: any;
  currentLanguage: string;
  isVerticalLayout?: boolean;
  errors: any;
}) {
  const containerClasses = isVerticalLayout
    ? "flex items-start gap-2 sm:gap-4"
    : "space-y-2";
  const labelClasses = isVerticalLayout
    ? "flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2"
    : "";
  const inputClasses = isVerticalLayout ? "flex-1 min-w-0 space-y-1" : "";

  return (
    <div key={field.fieldName} className={containerClasses}>
      {isVerticalLayout ? (
        <div className={labelClasses}>
          <label className="block text-xs sm:text-sm font-medium">
            {getLocalizedText(field.label, currentLanguage)}{" "}
            {field.validationRule?.required && (
              <span className="text-red-500">*</span>
            )}
          </label>
        </div>
      ) : (
        <label htmlFor={field.fieldName} className="block text-sm font-medium">
          {getLocalizedText(field.label, currentLanguage)}{" "}
          {field.validationRule?.required && (
            <span className="text-red-500">*</span>
          )}
        </label>
      )}
      <div className={inputClasses}>
        <Controller
          name={field.fieldName}
          control={control}
          render={({ field: { onChange, value } }) => (
            <IconSelector
              value={value || ""}
              onSelect={onChange}
              placeholder={field.placeHolder || "Select an icon..."}
              disabled={field.readonly}
              className="w-full"
            />
          )}
        />
        {errors[field.fieldName] && (
          <p className="text-xs text-red-500">
            {errors[field.fieldName]?.message}
          </p>
        )}
        {field.validationRule?.errorMessage && !errors[field.fieldName] && (
          <p className="text-xs text-muted-foreground">
            {getLocalizedText(field.validationRule.errorMessage, currentLanguage)}
          </p>
        )}
      </div>
    </div>
  );
}

// Render form field based on type with React Hook Form integration
function renderField(
  field: FormField,
  control: any,
  currentLanguage: string,
  isVerticalLayout: boolean = false,
  errors: any = {},
  watch?: any
) {
  // Skip hidden fields
  if (field.hidden) return null;

  // Use MultiLanguageInput for multilanguage fields
  if (
    field.isMultiLang &&
    (field.fieldType === "text" || field.fieldType === "textArea")
  ) {
    return (
      <Controller
        key={field.fieldName}
        name={field.fieldName}
        control={control}
        render={({ field: { onChange, value } }) => (
          <MultiLanguageInput
            field={field}
            defaultValue={value}
            currentLanguage={currentLanguage}
            isVerticalLayout={isVerticalLayout}
            onValueChange={onChange}
          />
        )}
      />
    );
  }

  const validationProps = getValidationProps(field);
  const label = getLocalizedText(field.label, currentLanguage);
  const placeholder = field.placeHolder || "";

  // Container classes for vertical layout
  const containerClasses = isVerticalLayout
    ? "flex items-start gap-2 sm:gap-4"
    : "space-y-2";
  const labelContainerClasses = isVerticalLayout
    ? "flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2"
    : "";
  const inputContainerClasses = isVerticalLayout
    ? "flex-1 min-w-0 space-y-1"
    : "";

  // Handle different field types
  switch (field.fieldType) {
    case "text":
    case "email":
    case "password":
    case "number":
    case "date":
      return (
        <div key={field.fieldName} className={containerClasses}>
          <div className={labelContainerClasses}>
            <label
              htmlFor={field.fieldName}
              className="block text-sm font-medium"
            >
              {label}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
          <div className={inputContainerClasses}>
            <Controller
              name={field.fieldName}
              control={control}
              render={({ field: { onChange, value, name } }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                const hasError = errors[field.fieldName];
                
                // Auto-focus on validation error
                useEffect(() => {
                  if (hasError && inputRef.current) {
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }
                }, [hasError]);

                return (
                  <input
                    ref={inputRef}
                    type={
                      field.fieldType === "password"
                        ? "password"
                        : field.fieldType === "email"
                        ? "email"
                        : field.fieldType === "date"
                        ? "date"
                        : field.fieldType === "number"
                        ? "number"
                        : "text"
                    }
                    id={field.fieldName}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={field.readonly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      hasError 
                        ? "border-destructive focus:ring-destructive bg-destructive/5" 
                        : "border-input focus:ring-primary"
                    } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`}
                    {...validationProps}
                  />
                );
              }}
            />
            {errors[field.fieldName] && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
            {field.validationRule?.errorMessage && !errors[field.fieldName] && (
              <p className="text-xs text-muted-foreground">
                {getLocalizedText(
                  field.validationRule.errorMessage,
                  currentLanguage
                )}
              </p>
            )}
          </div>
        </div>
      );

    case "textArea":
      return (
        <div key={field.fieldName} className={containerClasses}>
          <div className={labelContainerClasses}>
            <label
              htmlFor={field.fieldName}
              className="block text-sm font-medium"
            >
              {label}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
          <div className={inputContainerClasses}>
            <Controller
              name={field.fieldName}
              control={control}
              render={({ field: { onChange, value, name } }) => {
                const textareaRef = useRef<HTMLTextAreaElement>(null);
                const hasError = errors[field.fieldName];
                
                // Auto-focus on validation error
                useEffect(() => {
                  if (hasError && textareaRef.current) {
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 100);
                  }
                }, [hasError]);

                return (
                  <textarea
                    ref={textareaRef}
                    id={field.fieldName}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={field.readonly}
                    rows={field.rows || 4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      hasError 
                        ? "border-destructive focus:ring-destructive bg-destructive/5" 
                        : "border-input focus:ring-primary"
                    } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`}
                    {...validationProps}
                  />
                );
              }}
            />
            {errors[field.fieldName] && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
            {field.validationRule?.errorMessage && !errors[field.fieldName] && (
              <p className="text-xs text-muted-foreground">
                {getLocalizedText(
                  field.validationRule.errorMessage,
                  currentLanguage
                )}
              </p>
            )}
          </div>
        </div>
      );

    case "select":
    case "multiSelect":
    case "dynamicSelect":
    case "dependentSelect":
    case "multiDependentSelect":
      // Convert dataSource to dropdownConfig if needed
      let configuredField = convertDataSourceToDropdownConfig(field);
      
      // Auto-configure common organizational dropdowns if no dataSource
      if (!field.dataSource) {
        configuredField = autoConfigureDropdown(configuredField);
      }
      
      // Use new DynamicSelect component for advanced dropdown functionality
      if (configuredField.dropdownConfig) {
        return (
          <div key={field.fieldName} className={containerClasses}>
            <div className={labelContainerClasses}>
              <label
                htmlFor={field.fieldName}
                className="block text-sm font-medium"
              >
                {label}{" "}
                {field.validationRule?.required && (
                  <span className="text-red-500">*</span>
                )}
              </label>
            </div>
            <div className={inputContainerClasses}>
              <Controller
                name={field.fieldName}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <DynamicSelect
                    field={configuredField}
                    value={value}
                    onChange={onChange}
                    currentLanguage={currentLanguage}
                    watch={watch}
                    errors={errors}
                  />
                )}
              />
            </div>
          </div>
        );
      }

      // Fallback to regular select for backward compatibility
      return (
        <div key={field.fieldName} className={containerClasses}>
          <div className={labelContainerClasses}>
            <label
              htmlFor={field.fieldName}
              className="block text-sm font-medium"
            >
              {label}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
          <div className={inputContainerClasses}>
            <Controller
              name={field.fieldName}
              control={control}
              render={({ field: { onChange, value, name } }) => {
                const selectRef = useRef<HTMLSelectElement>(null);
                const hasError = errors[field.fieldName];
                
                // Auto-focus on validation error
                useEffect(() => {
                  if (hasError && selectRef.current) {
                    setTimeout(() => {
                      selectRef.current?.focus();
                    }, 100);
                  }
                }, [hasError]);

                return (
                  <>
                    <select
                      ref={selectRef}
                      id={field.fieldName}
                      name={name}
                      value={value || ""}
                      onChange={onChange}
                      disabled={field.readonly}
                      multiple={field.fieldType === "multiSelect"}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        hasError 
                          ? "border-destructive focus:ring-destructive bg-destructive/5" 
                          : "border-input focus:ring-primary"
                      } ${field.readonly ? "bg-muted cursor-not-allowed" : ""} ${field.fieldType === "multiSelect" ? "min-h-[100px]" : ""}`}
                    >
                    <option value="">
                      {currentLanguage === "mm" ? "ရွေးချယ်ပါ" : "Select option"}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {getLocalizedText(option.label, currentLanguage)}
                      </option>
                    ))}
                  </select>
                  {field.fieldType === "multiSelect" && (
                    <p className="text-xs text-muted-foreground">
                      {currentLanguage === "mm"
                        ? "Ctrl ကိုနှိပ်ပြီး မျိုးမျိုးရွေးချယ်နিုင်သည်"
                        : "Hold Ctrl to select multiple options"}
                    </p>
                  )}
                  </>
                );
              }}
            />
            {errors[field.fieldName] && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
            {field.validationRule?.errorMessage && !errors[field.fieldName] && (
              <p className="text-xs text-muted-foreground">
                {getLocalizedText(
                  field.validationRule.errorMessage,
                  currentLanguage
                )}
              </p>
            )}
          </div>
        </div>
      );

    case "boolean":
    case "checkbox":
      return (
        <div key={field.fieldName} className="flex items-center space-x-2">
          <Controller
            name={field.fieldName}
            control={control}
            render={({ field: { onChange, value, name } }) => {
              const checkboxRef = useRef<HTMLInputElement>(null);
              const hasError = errors[field.fieldName];
              
              // Auto-focus on validation error
              useEffect(() => {
                if (hasError && checkboxRef.current) {
                  setTimeout(() => {
                    checkboxRef.current?.focus();
                  }, 100);
                }
              }, [hasError]);

              return (
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  id={field.fieldName}
                  name={name}
                  checked={value === true || value === "true"}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={field.readonly}
                  className={`w-4 h-4 text-primary rounded focus:ring-2 disabled:cursor-not-allowed ${
                    hasError 
                      ? "border-destructive focus:ring-destructive" 
                      : "border-input focus:ring-primary"
                  }`}
                />
              );
            }}
          />
          <label htmlFor={field.fieldName} className="text-sm font-medium">
            {label}
            {field.validationRule?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          {errors[field.fieldName] && (
            <p className="text-xs text-red-500 ml-2">
              {errors[field.fieldName]?.message}
            </p>
          )}
        </div>
      );

    case "icon":
      return (
        <IconFieldComponent
          key={field.fieldName}
          field={field}
          control={control}
          currentLanguage={currentLanguage}
          isVerticalLayout={isVerticalLayout}
          errors={errors}
        />
      );

    default:
      return (
        <div key={field.fieldName} className={containerClasses}>
          <div className={labelContainerClasses}>
            <label
              htmlFor={field.fieldName}
              className="block text-sm font-medium"
            >
              {label}{" "}
              {field.validationRule?.required && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
          <div className={inputContainerClasses}>
            <Controller
              name={field.fieldName}
              control={control}
              render={({ field: { onChange, value, name } }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                const hasError = errors[field.fieldName];
                
                // Auto-focus on validation error
                useEffect(() => {
                  if (hasError && inputRef.current) {
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }
                }, [hasError]);

                return (
                  <input
                    ref={inputRef}
                    type="text"
                    id={field.fieldName}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={field.readonly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      hasError 
                        ? "border-destructive focus:ring-destructive bg-destructive/5" 
                        : "border-input focus:ring-primary"
                    } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`}
                  />
                );
              }}
            />
            {errors[field.fieldName] && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
            {field.validationRule?.errorMessage && !errors[field.fieldName] && (
              <p className="text-xs text-muted-foreground">
                {getLocalizedText(
                  field.validationRule.errorMessage,
                  currentLanguage
                )}
              </p>
            )}
          </div>
        </div>
      );
  }
}

export function ReactHookWizardForm({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage = 'en',
  userId,
}: ReactHookWizardFormProps) {
  // Debug logging
  console.log('🧙 ReactHookWizardForm received props:', {
    module: module ? {
      id: module.id,
      name: module.name,
      slug: module.slug,
      formLayout: module.formLayout,
      formFieldsCount: module.formFields?.length || 0,
      wizardConfig: module.wizardConfig ? 'present' : 'missing',
      steps: module.steps ? `${module.steps.length} steps` : 'no steps'
    } : 'null module',
    action,
    moduleSlug,
    itemId,
    currentLanguage
  });

  // Early validation
  if (!module) {
    console.error('🧙 ReactHookWizardForm: module is required');
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <div className="flex items-center">
            <span className="font-medium">Error: Module configuration is required</span>
          </div>
        </div>
      </div>
    );
  }

  if (!module.formFields || module.formFields.length === 0) {
    console.error('🧙 ReactHookWizardForm: module has no form fields');
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <div className="flex items-center">
            <span className="font-medium">Error: No form fields defined in module</span>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('🧙 ReactHookWizardForm: Initializing hooks...');
  
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingStoredData, setPendingStoredData] = useState<Record<string, any> | null>(null);
  
  console.log('🧙 ReactHookWizardForm: Hooks initialized, setting up wizard storage...');

  // Initialize wizard storage with stable config
  const wizardStorageConfig = useMemo(() => {
    console.log('🧙 ReactHookWizardForm: Creating wizard storage config...');
    return {
      moduleName: module.slug,
      userId,
      action,
      itemId,
    };
  }, [module.slug, userId, action, itemId]);

  console.log('🧙 ReactHookWizardForm: Calling useWizardStorage...');
  const wizardStorage = useWizardStorage(wizardStorageConfig);
  console.log('🧙 ReactHookWizardForm: useWizardStorage completed');

  // Generate Zod schema for validation
  console.log('🧙 ReactHookWizardForm: Generating Zod schema...');
  const validationSchema = generateZodSchema(module.formFields);
  console.log('🧙 ReactHookWizardForm: Zod schema generated');

  // Initialize React Hook Form
  console.log('🧙 ReactHookWizardForm: Initializing useForm...');
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    trigger,
  } = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
    mode: "onChange", // Validate on change for better UX in wizard
  });
  console.log('🧙 ReactHookWizardForm: useForm initialized');

  // Load data from storage on mount
  useEffect(() => {
    console.log('🧙 ReactHookWizardForm: useEffect for storage loading...');
    if (!hasLoadedFromStorage && !wizardStorage.isLoading) {
      console.log('🧙 ReactHookWizardForm: Loading stored data...');
      const storedData = wizardStorage.loadStoredData();
      
      if (storedData && Object.keys(storedData).length > 0) {
        // Show confirmation dialog to ask user if they want to restore the draft
        setPendingStoredData(storedData);
        setRestoreConfirmOpen(true);
      } else {
        setHasLoadedFromStorage(true);
      }
    }
  }, [hasLoadedFromStorage, wizardStorage.isLoading]);

  const handleRestoreDraft = useCallback(() => {
    if (pendingStoredData) {
      const restoredData = { ...initialData, ...pendingStoredData };
      console.log('🔄 WizardForm: Restoring draft data:', restoredData);
      reset(restoredData);
      setPendingStoredData(null);
      
      // Show info toast about successful draft restoration
      const infoMessage = currentLanguage === 'mm' 
        ? 'မူကြမ်းဒေတာ ပြန်လည်ရယူပြီးပါပြီ'
        : 'Draft data has been restored';
      
      toastInfo(infoMessage);
    }
    setHasLoadedFromStorage(true);
    setRestoreConfirmOpen(false);
  }, [pendingStoredData, reset, initialData, currentLanguage]);

  const handleSkipRestore = useCallback(() => {
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

  // Auto-save to storage when form data changes
  const watchedValues = watch();
  useEffect(() => {
    if (hasLoadedFromStorage && isDirty) {
      const timeoutId = setTimeout(() => {
        wizardStorage.saveToStorage(watchedValues);
      }, 1000); // Debounce auto-save by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, hasLoadedFromStorage, isDirty]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && !hasLoadedFromStorage) {
      reset(initialData);
    }
  }, [initialData, reset, hasLoadedFromStorage]);

  // Group fields by wizard steps - supports both backend steps and logical grouping
  console.log('🧙 ReactHookWizardForm: Processing form fields...');
  const rawVisibleFields = module.formFields.filter((f) => !f.hidden);
  console.log('🧙 ReactHookWizardForm: Raw visible fields:', rawVisibleFields.length);
  const visibleFields = validateAndFilterFields(rawVisibleFields);
  console.log('🧙 ReactHookWizardForm: Valid visible fields:', visibleFields.length);
  
  const groupFieldsForWizard = (fields: FormField[]): LocalWizardStep[] => {
    console.log('🧙 groupFieldsForWizard called with', fields.length, 'fields');
    console.log('🧙 module.steps:', module.steps ? `${module.steps.length} steps` : 'no steps');
    console.log('🧙 module.wizardConfig:', module.wizardConfig ? 'present' : 'missing');
    
    // Use backend steps configuration if available (new schema)
    if (module.steps && module.steps.length > 0) {
      console.log('🧙 Using backend steps configuration');
      return module.steps
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((step, index) => {
          // Find fields that belong to this step and validate them
          const rawStepFields = fields.filter(field => field.stepId === step.stepId);
          const stepFields = validateAndFilterFields(rawStepFields);
          
          return {
            id: step.stepId,
            title: getLocalizedText(step.title, currentLanguage),
            description: step.description ? getLocalizedText(step.description, currentLanguage) : '',
            icon: step.iconName || step.icon,
            fields: stepFields,
            stepNumber: index + 1,
          };
        })
        .filter(step => step.fields.length > 0); // Only include steps that have fields
    }
    
    // Fallback to explicit wizard configuration if available (legacy)
    if (module.wizardConfig?.steps && module.wizardConfig.steps.length > 0) {
      return module.wizardConfig.steps
        .sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))
        .map((step, index) => {
          // Map field names to actual FormField objects
          const stepFields = step.fields
            .map(fieldName => fields.find(f => f.fieldName === fieldName))
            .filter(field => field !== undefined) as FormField[];
          
          // Validate the fields
          const validStepFields = validateAndFilterFields(stepFields);
          
          return {
            id: step.stepKey || `step-${index}`,
            title: getLocalizedText(step.title, currentLanguage),
            description: step.description ? getLocalizedText(step.description, currentLanguage) : '',
            icon: 'FileText', // Default icon since wizardConfig doesn't specify icons
            fields: validStepFields,
            stepNumber: step.stepNumber || index + 1,
          };
        })
        .filter(step => step.fields.length > 0); // Only include steps that have valid fields
    }

    // Check if any fields have stepId - if so, use stepId-based grouping
    const hasStepIds = fields.some(field => field.stepId);
    
    if (hasStepIds) {
      // Group by stepId
      const stepGroups: Record<string, FormField[]> = {};
      fields.forEach((field) => {
        const stepId = field.stepId || 'default';
        if (!stepGroups[stepId]) {
          stepGroups[stepId] = [];
        }
        stepGroups[stepId].push(field);
      });
      
      return Object.entries(stepGroups).map(([stepId, stepFields], index) => ({
        id: stepId,
        title: stepId === 'default' 
          ? (currentLanguage === "mm" ? "အချက်အလက်များ" : "Form Details")
          : stepId,
        description: currentLanguage === "mm" 
          ? `အဆင့် ${index + 1}` 
          : `Step ${index + 1}`,
        icon: 'ClipboardList',
        fields: stepFields,
        stepNumber: index + 1,
      }));
    }
    
    // Fall back to logical grouping
    const basicInfo: FormField[] = [];
    const contentFields: FormField[] = [];
    const settingsFields: FormField[] = [];
    
    fields.forEach((field) => {
      // Group by field type and purpose
      if (field.fieldType === 'text' || field.fieldType === 'textArea' || field.fieldName.includes('name') || field.fieldName.includes('title')) {
        basicInfo.push(field);
      } else if (field.fieldType === 'select' || field.fieldType === 'multiSelect' || field.fieldType === 'dynamicSelect' || field.fieldType === 'dependentSelect' || field.fieldType === 'multiDependentSelect' || field.fieldType === 'date') {
        contentFields.push(field);
      } else {
        settingsFields.push(field);
      }
    });
    
    // Create steps based on available fields
    const wizardSteps = [];
    
    if (basicInfo.length > 0) {
      const validBasicInfo = validateAndFilterFields(basicInfo);
      if (validBasicInfo.length > 0) {
        wizardSteps.push({
          id: 'basic-info',
          title: currentLanguage === "mm" ? "အခြေခံအချက်အလက်" : "Basic Information",
          description: currentLanguage === "mm" ? "အမည်နှင့် အကြောင်းအရာများ" : "Names and descriptions",
          icon: 'User',
          fields: validBasicInfo,
          stepNumber: wizardSteps.length + 1,
        });
      }
    }
    
    if (contentFields.length > 0) {
      const validContentFields = validateAndFilterFields(contentFields);
      if (validContentFields.length > 0) {
        wizardSteps.push({
          id: 'content-details',
          title: currentLanguage === "mm" ? "အကြောင်းအရာ" : "Content Details", 
          description: currentLanguage === "mm" ? "အမျိုးအစားနှင့် ရက်စွဲများ" : "Categories and dates",
          icon: 'FileText',
          fields: validContentFields,
          stepNumber: wizardSteps.length + 1,
        });
      }
    }
    
    if (settingsFields.length > 0) {
      const validSettingsFields = validateAndFilterFields(settingsFields);
      if (validSettingsFields.length > 0) {
        wizardSteps.push({
          id: 'settings',
          title: currentLanguage === "mm" ? "ဆက်တင်များ" : "Settings",
          description: currentLanguage === "mm" ? "အခြားရွေးချယ်မှုများ" : "Additional options",
          icon: 'Settings',
          fields: validSettingsFields,
          stepNumber: wizardSteps.length + 1,
        });
      }
    }
    
    // If we have too few fields, combine them
    if (wizardSteps.length === 1 && visibleFields.length <= 3) {
      const validVisibleFields = validateAndFilterFields(visibleFields);
      if (validVisibleFields.length > 0) {
        return [{
          id: 'form-details',
          title: currentLanguage === "mm" ? "အချက်အလက်များ" : "Form Details",
          description: currentLanguage === "mm" ? "လိုအပ်သော အချက်အလက်များ ဖြည့်သွင်းပါ" : "Fill in the required information",
          icon: 'ClipboardList',
          fields: validVisibleFields,
          stepNumber: 1,
        }];
      }
    }
    
    // Ensure we always have at least one step with valid fields
    if (wizardSteps.length === 0 && visibleFields.length > 0) {
      const validVisibleFields = validateAndFilterFields(visibleFields);
      if (validVisibleFields.length > 0) {
        wizardSteps.push({
          id: 'fallback-step',
          title: currentLanguage === "mm" ? "ဖောင်" : "Form",
          description: currentLanguage === "mm" ? "လိုအပ်သော အချက်အလက်များ ဖြည့်သွင်းပါ" : "Fill in the required information",
          icon: 'ClipboardList',
          fields: validVisibleFields,
          stepNumber: 1,
        });
      }
    }
    
    return wizardSteps;
  };
  
  let steps: LocalWizardStep[];
  try {
    steps = groupFieldsForWizard(visibleFields);
  } catch (error) {
    console.error('🧙 Error generating wizard steps:', error);
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <div className="flex items-center">
            <span className="font-medium">Error: Failed to generate wizard steps</span>
          </div>
        </div>
      </div>
    );
  }
  
  const isVerticalLayout = module.formLayout === "wizard-vertical";
  const totalSteps = steps.length;
  
  console.log('🧙 Steps generated:', {
    stepsCount: steps.length,
    rawVisibleFieldsCount: rawVisibleFields.length,
    validVisibleFieldsCount: visibleFields.length,
    steps: steps.map(s => ({ id: s.id, title: s.title, fieldsCount: s.fields.length })),
    module: {
      hasWizardConfig: !!module.wizardConfig,
      hasSteps: !!module.steps,
      formLayout: module.formLayout
    }
  });
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    const invalidFields = rawVisibleFields.filter(f => !validateAndFilterFields([f]).length);
    console.log('🧙 ReactHookWizardForm Debug:', {
      rawVisibleFieldsCount: rawVisibleFields.length,
      validVisibleFieldsCount: visibleFields.length,
      invalidFieldsCount: invalidFields.length,
      invalidFields: invalidFields.map(f => ({ fieldName: f?.fieldName, fieldType: f?.fieldType, issues: !f ? 'null field' : !f.fieldName ? 'missing fieldName' : !f.fieldType ? 'missing fieldType' : 'other' })),
      stepsCount: steps.length,
      steps: steps.map(s => ({ id: s.id, title: s.title, fieldsCount: s.fields.length, fieldNames: s.fields.map(f => f.fieldName) })),
      moduleSteps: module.steps?.map(s => ({ stepId: s.stepId, title: s.title })),
      backendSchemaType: module.steps ? 'new (backend steps)' : 'legacy (logical grouping)'
    });
  }
  
  // Safety check: if no steps, return error state
  if (steps.length === 0) {
    console.error('🧙 No steps generated - returning error state');
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <div className="flex items-center">
            <IconComponent name="AlertCircle" className="h-4 w-4 mr-2" />
            <span className="font-medium">
              {currentLanguage === "mm" 
                ? "ဖောင်းတွင် ဖြည့်စရာအကွက်များ မရှိပါ"
                : "No form fields available"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    // Safety check
    if (!steps[currentStep] || !steps[currentStep].fields) {
      console.error('Invalid step or fields not found');
      return;
    }
    
    // Validate current step fields before proceeding
    const currentStepFields = steps[currentStep].fields.map(f => f.fieldName);
    const isValid = await trigger(currentStepFields);
    
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      // Convert form data to FormData for server action
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            // Handle multi-language fields
            formData.append(`${key}.en`, value.en || "");
            formData.append(`${key}.mm`, value.mm || "");
          } else if (Array.isArray(value)) {
            // Handle array values (multi-select)
            value.forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Generate validation schema for server action
      const validationSchema = generateZodSchema(module.formFields);
      
      const result = await submitModuleForm(
        moduleSlug,
        formData,
        validationSchema,
        action,
        itemId
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Form submission failed');
      }
      
      // Clear stored draft after successful submission
      wizardStorage.clearStorage();
      
      // Show success toast with multilingual support
      const successMessage = action === "create" 
        ? (currentLanguage === "mm" 
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} created successfully!`)
        : (currentLanguage === "mm"
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} updated successfully!`);
      
      toastSuccess(successMessage);
      
      // Redirect after successful submission
      if (action === 'create') {
        router.push(`/${moduleSlug}`);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Show error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : (currentLanguage === "mm" 
          ? "ဖောင်း ပေးပို့မှု မအောင်မြင်ပါ"
          : "Form submission failed");
      
      toastError(errorMessage);
      
      // Keep the draft if submission fails
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconComponent
            name={module.iconName}
            className="w-5 h-5 text-primary"
          />
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            {action === "create" ? "Create" : "Update"}{" "}
            {getLocalizedText(module.name, currentLanguage)}
          </h1>
          <p className="text-muted-foreground hidden md:block">
            {getLocalizedText(module.description, currentLanguage)}
          </p>
        </div>
      </div>

      {/* Clean Progress Indicator */}
      <div className="mb-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id || index} className="flex items-center flex-1">
              {/* Step Number/Icon */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <IconComponent name="Check" className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Title */}
              <div className="ml-3 flex-1">
                <div
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
              </div>

              {/* Connection Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-[1px] transition-all duration-300 ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current Step Info */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {steps[currentStep].icon && (
              <div className="p-2 bg-primary/10 rounded-md">
                <IconComponent name={steps[currentStep].icon} className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-foreground">
                {currentLanguage === "mm" ? "အဆင့်" : "Step"} {currentStep + 1}: {steps[currentStep].title}
              </h3>
              {steps[currentStep].description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {steps[currentStep].description}
                </p>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                {currentLanguage === "mm" ? "တိုးတက်မှု" : "Progress"}
              </span>
              <span>
                {Math.round(((currentStep + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        
        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div
            className={`${
              isVerticalLayout
                ? "space-y-6" // Single column for wizard-vertical
                : "grid grid-cols-1 md:grid-cols-2 gap-6" // Multi-column for wizard-horizontal
            }`}
          >
            {(() => {
              // Get fields for current step (already validated when steps were created)
              const currentStepFields = steps[currentStep]?.fields || [];
              
              if (currentStepFields.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    {currentLanguage === "mm" 
                      ? "ဤအဆင့်တွင် ဖြည့်စရာ မရှိပါ"
                      : "No fields in this step"}
                  </div>
                );
              }
              
              return currentStepFields.map((field, index) => {
                try {
                  // Use fieldName as key, fallback to index if needed
                  const key = field.fieldName || `field-${index}`;
                  
                  return (
                    <div key={key}>
                      {renderField(field, control, currentLanguage, isVerticalLayout, errors, watch)}
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering field:', { field, error });
                  return (
                    <div key={field.fieldName || `error-field-${index}`} className="text-red-500 text-sm p-2 border border-red-300 rounded">
                      Error rendering field: {field.fieldName || 'unknown'}
                    </div>
                  );
                }
              });
            })()}
          </div>

          {/* Auto-save Indicator */}
          {hasLoadedFromStorage && isDirty && (
            <div className="flex items-center justify-center text-xs text-muted-foreground py-2">
              <IconComponent name="CloudUpload" className="w-3 h-3 mr-1" />
              {currentLanguage === "mm" ? "အလိုအလျောက်သိမ်းထားသည်" : "Auto-saved to drafts"}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
                {currentLanguage === "mm" ? "ပြန်သွားမည်" : "Previous"}
              </Button>
            )}
            {currentStep === 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
                {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
              </Button>
            )}
          </div>

          <div>
            {currentStep < totalSteps - 1 ? (
              <Button type="button" size="lg" onClick={handleNext} disabled={isSubmitting}>
                {currentLanguage === "mm" ? "ရှေ့သို့" : "Next"}
                <IconComponent name="ArrowRight" className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                    {currentLanguage === "mm" ? "သိမ်းနေသည်..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <IconComponent name="Save" className="w-4 h-4 mr-2" />
                    {action === "create"
                      ? currentLanguage === "mm"
                        ? "ဖန်တီးမည်"
                        : "Create"
                      : currentLanguage === "mm"
                      ? "အပ်ဒိတ်လုပ်မည်"
                      : "Update"}
                  </>
                )}
              </Button>
            )}
          </div>
          </div>
        </form>
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
    </div>
  );
}
