"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError, toastWarning, toastInfo } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Form } from "@repo/ui";
import { FormFieldRenderer } from "@repo/schema-forms";
import { generateZodSchema } from "@repo/schema-utils";
import { useWizardStorage } from "@/hooks/use-wizard-storage";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { ConfirmationDialog } from "@repo/ui";
import type { ModuleSchema, FormField } from "@repo/types";

interface ReactHookWizardFormProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  currentLanguage: string;
  userId?: string;
  tenantId?: string;
  appId?: string;
  username?: string;
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

  // Skip HTML5 validation for password fields with strength indicators
  // This prevents dual validation conflicts where custom validation shows "Strong" 
  // but HTML5 validation still fails, causing form submission issues
  if (field.fieldType === "password" && field.validationRule?.showStrengthIndicator) {
    return props; // Return empty props (no HTML5 validation)
  }

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
                      field.fieldType === "email"
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

    case "password":
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
                // Check if password strength indicator is enabled
                if (field.validationRule?.showStrengthIndicator) {
                  return (
                    <>
                      <PasswordField
                        value={value || ""}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="w-full"
                        readOnly={field.readonly}
                        strengthConfig={field.validationRule.strengthMeterConfig}
                        currentLanguage={currentLanguage}
                        showStrengthIndicator={true}
                        validationProps={validationProps}
                      />
                      {errors[field.fieldName] && (
                        <p className="text-xs text-destructive mt-1 flex items-center">
                          <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                          {errors[field.fieldName]?.message}
                        </p>
                      )}
                    </>
                  );
                } else {
                  // Regular password input without strength indicator
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
                    <>
                      <input
                        ref={inputRef}
                        type="password"
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
                      {errors[field.fieldName] && (
                        <p className="text-xs text-destructive mt-1 flex items-center">
                          <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                          {errors[field.fieldName]?.message}
                        </p>
                      )}
                    </>
                  );
                }
              }}
            />
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
  tenantId,
  appId,
  username,
}: ReactHookWizardFormProps) {
  // Debug logging
  console.log('🧙 ReactHookWizardForm received props:', {
    module: module ? {
      id: module.id,
      name: module.name,
      slug: module.slug,
      formLayout: module.formLayout,
      formFieldsCount: module.formFields?.length || 0,
      wizardConfig: module.wizardConfig ? 'present' : 'missing'
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

  // Filter form fields (exclude password fields in edit mode)
  console.log('🧙 ReactHookWizardForm: Filtering form fields...');
  const filteredFormFields = module.formFields.filter((f) => {
    // Filter out hidden fields
    if (f.hidden) return false;
    
    // Filter out password fields in edit mode (use password reset action instead)
    if (action === 'update' && f.fieldType === 'password') {
      console.log(`🔒 ReactHookWizardForm: Skipping password field "${f.fieldName}" in edit mode`);
      return false;
    }
    
    return true;
  });

  // Generate Zod schema for validation
  console.log('🧙 ReactHookWizardForm: Generating Zod schema...');
  const validationSchema = generateZodSchema(filteredFormFields);
  console.log('🧙 ReactHookWizardForm: Zod schema generated');

  // Initialize React Hook Form
  console.log('🧙 ReactHookWizardForm: Initializing useForm...');
  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
    mode: "onChange", // Validate on change for better UX in wizard
  });
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    trigger,
  } = form;
  
  console.log('🧙 ReactHookWizardForm: useForm initialized');

  // Load data from storage on mount (only for create operations)
  useEffect(() => {
    console.log('🧙 ReactHookWizardForm: useEffect for storage loading...');
    if (!hasLoadedFromStorage && !wizardStorage.isLoading) {
      // Skip localStorage loading for edit/update operations - always use fresh server data
      if (action === 'update') {
        console.log('🧙 ReactHookWizardForm: Skipping localStorage for edit operation');
        setHasLoadedFromStorage(true);
        return;
      }
      
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
  }, [hasLoadedFromStorage, wizardStorage.isLoading, action]);

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

  // Auto-save to storage when form data changes (only for create operations)
  const watchedValues = watch();
  useEffect(() => {
    // Skip auto-saving for edit/update operations - no need to save drafts of edits
    if (hasLoadedFromStorage && isDirty && action === 'create') {
      const timeoutId = setTimeout(() => {
        wizardStorage.saveToStorage(watchedValues);
      }, 1000); // Debounce auto-save by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, hasLoadedFromStorage, isDirty, action]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && !hasLoadedFromStorage) {
      reset(initialData);
    }
  }, [initialData, reset, hasLoadedFromStorage]);

  // Group fields by wizard steps - supports both backend steps and logical grouping
  console.log('🧙 ReactHookWizardForm: Processing form fields...');
  const rawVisibleFields = filteredFormFields; // Already filtered above
  console.log('🧙 ReactHookWizardForm: Raw visible fields:', rawVisibleFields.length);
  const visibleFields = validateAndFilterFields(rawVisibleFields);
  console.log('🧙 ReactHookWizardForm: Valid visible fields:', visibleFields.length);
  
  const groupFieldsForWizard = (fields: FormField[]): LocalWizardStep[] => {
    console.log('🧙 groupFieldsForWizard called with', fields.length, 'fields');
    console.log('🧙 module.wizardConfig:', module.wizardConfig ? 'present' : 'missing');
    
    // Use wizard configuration if available (current version)
    if (module.wizardConfig?.steps && module.wizardConfig.steps.length > 0) {
      console.log('🧙 Using wizardConfig steps');
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
    const organizationDetails: FormField[] = [];
    const contactInfo: FormField[] = [];
    const additionalFields: FormField[] = [];
    
    fields.forEach((field) => {
      // Group by field purpose and type
      const fieldName = field.fieldName.toLowerCase();
      
      // Organization/identity fields
      if (fieldName.includes('name') || 
          fieldName.includes('title') || 
          fieldName.includes('slug') ||
          fieldName.includes('description') ||
          field.fieldType === 'icon') {
        organizationDetails.push(field);
      }
      // Contact and address fields
      else if (field.fieldType === 'email' || 
               field.fieldType === 'textArea' ||
               fieldName.includes('email') || 
               fieldName.includes('phone') || 
               fieldName.includes('address') ||
               fieldName.includes('domain') ||
               fieldName.includes('url') ||
               fieldName.includes('website')) {
        contactInfo.push(field);
      }
      // Selection fields and other types
      else if (field.fieldType === 'select' || 
               field.fieldType === 'multiSelect' || 
               field.fieldType === 'dynamicSelect' || 
               field.fieldType === 'dependentSelect' || 
               field.fieldType === 'multiDependentSelect' || 
               field.fieldType === 'date' ||
               field.fieldType === 'checkbox' ||
               field.fieldType === 'boolean') {
        additionalFields.push(field);
      }
      // Default: text fields and others
      else {
        // Determine by field name if it's not already categorized
        if (fieldName.includes('contact') || fieldName.includes('location')) {
          contactInfo.push(field);
        } else {
          organizationDetails.push(field);
        }
      }
    });
    
    // Create steps based on available fields
    const wizardSteps = [];
    
    // Step 1: Organization/Entity Details
    if (organizationDetails.length > 0) {
      const validOrgDetails = validateAndFilterFields(organizationDetails);
      if (validOrgDetails.length > 0) {
        wizardSteps.push({
          id: 'organization-details',
          title: currentLanguage === "mm" ? "အဖွဲ့အစည်း အချက်အလက်" : "Organization Details",
          description: currentLanguage === "mm" ? "အမည်နှင့် အကြောင်းအရာများ" : "Names and descriptions",
          icon: 'Building',
          fields: validOrgDetails,
          stepNumber: wizardSteps.length + 1,
        });
      }
    }
    
    // Step 2: Contact Information
    if (contactInfo.length > 0) {
      const validContactInfo = validateAndFilterFields(contactInfo);
      if (validContactInfo.length > 0) {
        wizardSteps.push({
          id: 'contact-info',
          title: currentLanguage === "mm" ? "ဆက်သွယ်ရန် အချက်အလက်" : "Contact Information", 
          description: currentLanguage === "mm" ? "လိပ်စာနှင့် ဆက်သွယ်ရန်" : "Address and contact details",
          icon: 'MapPin',
          fields: validContactInfo,
          stepNumber: wizardSteps.length + 1,
        });
      }
    }
    
    // Step 3: Additional Configuration
    if (additionalFields.length > 0) {
      const validAdditionalFields = validateAndFilterFields(additionalFields);
      if (validAdditionalFields.length > 0) {
        wizardSteps.push({
          id: 'additional-config',
          title: currentLanguage === "mm" ? "အခြား သတ်မှတ်ချက်များ" : "Additional Configuration",
          description: currentLanguage === "mm" ? "ထပ်တိုး ရွေးချယ်မှုများ" : "Additional options and settings",
          icon: 'Settings',
          fields: validAdditionalFields,
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
      schemaType: module.wizardConfig ? 'wizardConfig' : 'automatic grouping'
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

  const handleNext = async (e?: React.FormEvent) => {
    // Prevent default form submission if called from form submit
    if (e) {
      e.preventDefault();
    }
    
    console.log('🧙 handleNext called with currentStep:', currentStep, 'totalSteps:', totalSteps);
    
    // Safety check
    if (!steps[currentStep] || !steps[currentStep].fields) {
      console.error('Invalid step or fields not found');
      return;
    }
    
    // Validate current step fields before proceeding
    const currentStepFields = steps[currentStep].fields.map(f => f.fieldName);
    const isValid = await trigger(currentStepFields);
    console.log('🧙 Step validation result:', isValid);
    
    if (isValid && currentStep < totalSteps - 1) {
      console.log('🧙 Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps - 1) {
      console.log('🧙 On final step - user must manually click Create button to submit');
      // No auto-submit - user must click the Create button
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FieldValues) => {
    console.log('🧙 onSubmit called - manual submission via Create button click');
    console.log('🧙 Current step:', currentStep, 'Total steps:', totalSteps);
    try {
      // Convert form data to FormData for server action
      const formData = new FormData();
      
      // For update operations, include version and other metadata fields
      if (action === "update" && initialData) {
        // Include version for optimistic concurrency control
        if (initialData.version !== undefined) {
          formData.append("version", String(initialData.version));
          console.log(`🔍 Client Debug (Wizard): Adding version field: ${initialData.version}`);
        }
      }
      
      console.log("🔍 Client Debug (Wizard): Processing form data entries...", data);
      Object.entries(data).forEach(([key, value], index) => {
        console.log(`🔍 Client Debug (Wizard): Processing field ${index + 1}:`, {
          key,
          value,
          valueType: typeof value,
          valueConstructor: value?.constructor?.name,
          isNull: value === null,
          isUndefined: value === undefined,
          isObject: typeof value === "object",
          isArray: Array.isArray(value),
          hasEnProperty: typeof value === "object" && value !== null && "en" in value
        });
        
        if (value !== null && value !== undefined) {
          try {
            if (typeof value === "object" && value.en !== undefined) {
              // Handle multi-language fields - send as nested JSON object
              console.log(`🔍 Client Debug (Wizard): Adding multilang field "${key}":`, { en: value.en, mm: value.mm });
              formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
              // Handle array values (multi-select)
              console.log(`🔍 Client Debug (Wizard): Adding array field "${key}" with ${value.length} items:`, value);
              value.forEach((item, itemIndex) => {
                console.log(`🔍 Client Debug (Wizard): Adding array item ${itemIndex}:`, { item, itemType: typeof item });
                formData.append(key, String(item));
              });
            } else {
              // Safe serialization - use String() constructor instead of .toString() method
              // This avoids client/server boundary issues with client references
              console.log(`🔍 Client Debug (Wizard): Adding regular field "${key}":`, { value, type: typeof value });
              formData.append(key, String(value));
            }
            console.log(`✅ Client Debug (Wizard): Successfully processed field "${key}"`);
          } catch (error) {
            console.error(`❌ Client Debug (Wizard): Error processing field "${key}":`, {
              error: error instanceof Error ? error.message : String(error),
              errorName: error instanceof Error ? error.name : 'Unknown',
              key,
              value,
              valueType: typeof value
            });
          }
        } else {
          console.log(`⏭️ Client Debug (Wizard): Skipping null/undefined field "${key}"`);
        }
      });
      
      console.log("🔍 Client Debug (Wizard): Final FormData entries:");
      let formDataCount = 0;
      for (const [key, value] of formData.entries()) {
        formDataCount++;
        console.log(`  ${formDataCount}. ${key} = ${value} (${typeof value})`);
      }

      console.log("🔍 Client Debug (Wizard): Calling submitModuleForm with params:", {
        moduleSlug,
        action,
        itemId,
        formDataEntryCount: Array.from(formData.entries()).length
      });
      
      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect - we want to handle redirect manually for better UX
      );
      
      console.log("🧙 Wizard form server action result:", result);
      
      if (!result.success) {
        console.log("🧙 Wizard form result.success is false. Analyzing error structure:", {
          hasFieldErrors: !!(result.fieldErrors && result.fieldErrors.length > 0),
          fieldErrors: result.fieldErrors,
          hasErrors: !!result.errors,
          errors: result.errors,
          error: result.error,
          traceId: result.traceId
        });
        
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          // Handle backend field validation errors
          console.log("🔍 Wizard backend field validation errors:", result.fieldErrors);
          const fieldErrorsText = result.fieldErrors.join("\n");
          const mainError = result.error || (currentLanguage === "mm" 
            ? "ဖောင်း validation မအောင်မြင်ပါ" 
            : "Form submission failed");
          const traceInfo = result.traceId ? `\n\nTrace ID: ${result.traceId}` : '';
          const errorMessage = `${mainError}\n\nField errors:\n${fieldErrorsText}${traceInfo}`;
          
          // Show error toast for immediate feedback
          console.log("🧙 CALLING toastError for field validation errors:", mainError);
          toastError(mainError);
          console.log("🧙 toastError called successfully");
          
          throw new Error(errorMessage);
        } else if (result.errors) {
          // Handle other validation errors (legacy format)
          const errorMessages = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n");
          
          // Show error toast for immediate feedback
          const toastErrorMessage = result.error || (currentLanguage === "mm" 
            ? "ဖောင်း validation မအောင်မြင်ပါ" 
            : "Form submission failed");
          console.log("🧙 CALLING toastError for legacy validation errors:", toastErrorMessage);
          toastError(toastErrorMessage);
          console.log("🧙 toastError called successfully");
          
          throw new Error(errorMessages);
        } else {
          const errorMessage = result.error || (currentLanguage === "mm" 
            ? "ဖောင်း ပေးပို့မှု မအောင်မြင်ပါ"
            : "Form submission failed");
          
          // Show error toast for immediate feedback
          console.log("🧙 CALLING toastError for general error:", errorMessage);
          toastError(errorMessage);
          console.log("🧙 toastError called successfully");
          
          throw new Error(errorMessage);
        }
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
      
      // Controlled redirect with user-friendly delay
      if (action === 'create') {
        console.log('🧙 Scheduling redirect to module list after successful creation');
        setTimeout(() => {
          router.push(`/${moduleSlug}`);
        }, 1500); // Give user time to see success message
      }
    } catch (error) {
      console.error("🧙 Wizard form submission error:", error);
      
      // Debug the error structure
      console.log("🧙 Catch block - error analysis:", {
        isError: error instanceof Error,
        errorMessage: error instanceof Error ? error.message : String(error),
        includesFormSubmissionFailed: error instanceof Error ? error.message.includes("Form submission failed") : false,
        includesFieldErrors: error instanceof Error ? error.message.includes("Field errors:") : false,
        includesTraceID: error instanceof Error ? error.message.includes("Trace ID:") : false
      });
      
      // Only show additional error toast if this is not a handled error
      // (handled errors already showed their own toast above)
      if (error instanceof Error && error.message.includes("Form submission failed") && 
          !error.message.includes("Field errors:") && !error.message.includes("Trace ID:")) {
        // This is likely a network or unexpected error, show user-friendly message
        const errorMessage = currentLanguage === "mm" 
          ? "ဖောင်း ပေးပို့မှု မအောင်မြင်ပါ"
          : "Form submission failed";
        console.log("🧙 CALLING toastError in catch block:", errorMessage);
        toastError(errorMessage);
        console.log("🧙 toastError called successfully in catch block");
      } else {
        console.log("🧙 Skipping catch block toastError - error already handled above");
      }
      
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
        <div className="flex-1">
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
        <Form {...form}>
          <form 
            onSubmit={currentStep < totalSteps - 1 ? handleNext : handleSubmit(onSubmit)} 
            className="space-y-6"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key press in input fields
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'textarea') {
                e.preventDefault();
              }
            }}
          >
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
                      <FormFieldRenderer
                        field={field}
                        currentLanguage={currentLanguage}
                        isVerticalLayout={isVerticalLayout}
                        errors={errors}
                        watch={watch}
                        tenantId={tenantId}
                        appId={appId}
                        username={username}
                      />
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

          {/* Auto-save Indicator (only for create operations) */}
          {hasLoadedFromStorage && isDirty && action === 'create' && (
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
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || currentStep >= totalSteps - 1}
              >
                {currentLanguage === "mm" ? "ရှေ့သို့" : "Next"}
                <IconComponent name="ArrowRight" className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                onClick={() => {
                  console.log('🧙 Create button clicked - user manually submitting form');
                }}
              >
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
        </Form>
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
