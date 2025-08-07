"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { IconComponent, IconSelector } from "@repo/ui/components/icons";
import { MultiLanguageInput } from "./MultiLanguageInput";
import { DynamicSelect } from "./DynamicSelect";
import { generateZodSchema } from "@/lib/form-schema";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { getLocalizedErrorMessage } from "@repo/api/messages";
import type { ModuleSchema, FormField, LocalizedText } from "@repo/types";

interface ReactHookFormProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  currentLanguage: string;
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
              onSelect={(iconName) => {
                console.log('🔄 ReactHookForm: Icon changing from', value, 'to', iconName);
                console.log('🔄 ReactHookForm: Field readonly?', field.readonly);
                console.log('🔄 ReactHookForm: Controller onChange type:', typeof onChange);
                onChange(iconName);
              }}
              placeholder={field.placeHolder || "Select an icon..."}
              disabled={field.readonly}
              className="w-full"
            />
          )}
        />
        {errors[field.fieldName] && (
          <p className="text-xs text-destructive mt-1 flex items-center">
            <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
            {errors[field.fieldName]?.message || getLocalizedErrorMessage('CLIENT_VALIDATION_FAILED', currentLanguage as 'en' | 'mm')}
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
            errors={errors}
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
              render={({ field: { onChange, value, name } }) => (
                <textarea
                  id={field.fieldName}
                  name={name}
                  value={value || ""}
                  onChange={onChange}
                  placeholder={placeholder}
                  disabled={field.readonly}
                  rows={field.rows || 4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors[field.fieldName] 
                      ? "border-destructive focus:ring-destructive bg-destructive/5" 
                      : "border-input focus:ring-primary"
                  } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`}
                  {...validationProps}
                />
              )}
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
              render={({ field: { onChange, value, name } }) => (
                <>
                  <select
                    id={field.fieldName}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    disabled={field.readonly}
                    multiple={field.fieldType === "multiSelect"}
                    className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      field.readonly ? "bg-muted cursor-not-allowed" : ""
                    } ${field.fieldType === "multiSelect" ? "min-h-[100px]" : ""}`}
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
                        ? "Ctrl ကိုနှိပ်ပြီး မျိုးမျိုးရွေးချယ်နိုင်သည်"
                        : "Hold Ctrl to select multiple options"}
                    </p>
                  )}
                </>
              )}
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
            render={({ field: { onChange, value, name } }) => (
              <input
                type="checkbox"
                id={field.fieldName}
                name={name}
                checked={value === true || value === "true"}
                onChange={(e) => onChange(e.target.checked)}
                disabled={field.readonly}
                className="w-4 h-4 text-primary border-input rounded focus:ring-primary disabled:cursor-not-allowed"
              />
            )}
          />
          <label htmlFor={field.fieldName} className="text-sm font-medium">
            {label}
            {field.validationRule?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          {errors[field.fieldName] && (
            <p className="text-xs text-destructive ml-2 flex items-center">
              <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
              {errors[field.fieldName]?.message || getLocalizedErrorMessage('CLIENT_VALIDATION_FAILED', currentLanguage as 'en' | 'mm')}
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
              render={({ field: { onChange, value, name } }) => (
                <input
                  type="text"
                  id={field.fieldName}
                  name={name}
                  value={value || ""}
                  onChange={onChange}
                  placeholder={placeholder}
                  disabled={field.readonly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors[field.fieldName] 
                      ? "border-destructive focus:ring-destructive bg-destructive/5" 
                      : "border-input focus:ring-primary"
                  } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`}
                />
              )}
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

export function ReactHookForm({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage,
}: ReactHookFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Generate Zod schema for validation
  const validationSchema = generateZodSchema(module.formFields);

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const isVerticalLayout = module.formLayout === "vertical";

  const onSubmit = async (data: FieldValues) => {
    setSubmitError(null);
    setIsSubmittingForm(true);
    
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

      console.log("Submitting form data:", Object.fromEntries(formData));

      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect - we'll handle navigation on client-side
      );
      
      console.log("Server action result:", result);
      
      if (!result.success) {
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          // Handle backend field validation errors
          console.log("🔍 Backend field validation errors:", result.fieldErrors);
          const fieldErrorsText = result.fieldErrors.join("\n");
          const mainError = result.error || getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', currentLanguage as 'en' | 'mm');
          const traceInfo = result.traceId ? `\n\nTrace ID: ${result.traceId}` : '';
          setSubmitError(`${mainError}\n\nField errors:\n${fieldErrorsText}${traceInfo}`);
        } else if (result.errors) {
          // Handle other validation errors (legacy format)
          const errorMessages = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n");
          setSubmitError(errorMessages);
        } else {
          const errorMessage = result.error || getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', currentLanguage as 'en' | 'mm');
          setSubmitError(errorMessage);
        }
        return;
      }
      
      // Success - show toast and handle client-side navigation
      console.log("Form submitted successfully");
      
      // Show success toast with multilingual support
      const successMessage = action === "create" 
        ? (currentLanguage === "mm" 
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} created successfully!`)
        : (currentLanguage === "mm"
          ? `${getLocalizedText(module.name, currentLanguage)} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(module.name, currentLanguage)} updated successfully!`);
      
      toastSuccess(successMessage);
      
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
      
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', currentLanguage as 'en' | 'mm');
      setSubmitError(errorMessage);
      
      // Also show error toast for immediate feedback
      toastError(errorMessage);
      
    } finally {
      setIsSubmittingForm(false);
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

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={`${
            isVerticalLayout
              ? "space-y-6" // Single column for vertical
              : "grid grid-cols-1 md:grid-cols-2 gap-6" // Multi-column for horizontal
          }`}
        >
          {module.formFields
            .filter((field) => !field.hidden)
            .map((field) =>
              renderField(field, control, currentLanguage, isVerticalLayout, errors, watch)
            )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-start gap-2">
              <IconComponent name="AlertCircle" className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-2">
                  {currentLanguage === "mm" ? "ဖောင်း validation မအောင်မြင်ပါ" : "Form validation failed"}
                </h4>
                <div className="text-sm text-destructive/90 space-y-1">
                  {submitError.split('\n').map((line, index) => (
                    <div key={index} className={line.startsWith('Field errors:') ? 'font-medium mt-2' : ''}>
                      {line.startsWith('Field errors:') ? (
                        <span className="text-destructive font-medium">
                          {currentLanguage === "mm" ? "ဖောင်းအမှားများ:" : "Field errors:"}
                        </span>
                      ) : line.startsWith('Trace ID:') ? (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                          {line}
                        </div>
                      ) : line.trim() ? (
                        <div className="flex items-start gap-1">
                          <span className="text-destructive/70 mt-1">•</span>
                          <span>{line}</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isSubmittingForm || isSubmitting}
          >
            <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
          </Button>
          <Button type="submit" size="lg" disabled={isSubmittingForm || isSubmitting}>
            {(isSubmittingForm || isSubmitting) ? (
              <>
                <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                {currentLanguage === "mm" ? "သိမ်းနေသည়..." : "Saving..."}
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
        </div>
      </form>
    </div>
  );
}