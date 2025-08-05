"use client";

import React, { useState } from "react";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { IconComponent } from "@repo/ui/components/icons";
import { MultiLanguageInput } from "./MultiLanguageInput";
import { DynamicSelect } from "./DynamicSelect";
import { generateZodSchema } from "@/lib/form-schema";
import type { ExtraActionForm, FormField } from "@repo/types";

interface DynamicExtraActionFormProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  moduleSlug?: string; // For server action routing
  hideHeader?: boolean; // Hide the form header to prevent duplication in modals
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

// Render form field based on type
function renderField(
  field: FormField,
  control: any,
  currentLanguage: string,
  isVerticalLayout: boolean = true,
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
    ? "space-y-2"
    : "flex items-start gap-2 sm:gap-4";
  const labelContainerClasses = isVerticalLayout
    ? ""
    : "flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2";
  const inputContainerClasses = isVerticalLayout
    ? ""
    : "flex-1 min-w-0 space-y-1";

  // Handle different field types
  switch (field.fieldType) {
    case "text":
    case "email":
    case "password":
    case "number":
    case "date":
    case "icon":
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
                  className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    field.readonly ? "bg-muted cursor-not-allowed" : ""
                  }`}
                  {...validationProps}
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
                  className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    field.readonly ? "bg-muted cursor-not-allowed" : ""
                  }`}
                  {...validationProps}
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
      // Use new DynamicSelect component for advanced dropdown functionality
      if (field.dropdownConfig) {
        console.log(`🎨 DynamicExtraActionForm: Rendering select field "${field.fieldName}" with config:`, {
          fieldType: field.fieldType,
          dropdownConfig: field.dropdownConfig,
          hasWatch: !!watch,
        });
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
                render={({ field: { onChange, value } }) => {
                  console.log(`🔧 DynamicExtraActionForm: Controller render for "${field.fieldName}" with value:`, value);
                  return (
                    <DynamicSelect
                      field={field}
                      value={value}
                      onChange={onChange}
                      currentLanguage={currentLanguage}
                      watch={watch}
                    />
                  );
                }}
              />
              {errors[field.fieldName] && (
                <p className="text-xs text-red-500">
                  {errors[field.fieldName]?.message}
                </p>
              )}
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
                      <option key={option.value as string} value={option.value as string}>
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
              <p className="text-xs text-red-500">
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
              render={({ field: { onChange, value, name } }) => (
                <input
                  type="text"
                  id={field.fieldName}
                  name={name}
                  value={value || ""}
                  onChange={onChange}
                  placeholder={placeholder}
                  disabled={field.readonly}
                  className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    field.readonly ? "bg-muted cursor-not-allowed" : ""
                  }`}
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

export function DynamicExtraActionForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: DynamicExtraActionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(`🏗️ DynamicExtraActionForm: Rendering form for action "${action.actionKey}"`, {
    actionKey: action.actionKey,
    formFieldsCount: action.formFields?.length,
    formFields: action.formFields,
    selectedItemsCount: selectedItems?.length,
  });

  // Ensure we have form fields for schema-driven approach
  if (!action.formFields || action.formFields.length === 0) {
    console.error(`❌ DynamicExtraActionForm: No form fields for action "${action.actionKey}"`);
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          {currentLanguage === "mm"
            ? "ဖောင်မ်ကွက်များ မတွေ့ရှိပါ"
            : "No form fields found"}
        </p>
      </div>
    );
  }

  // Generate Zod schema for validation
  const validationSchema = generateZodSchema(action.formFields);

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {},
    mode: action.formValidation?.validateOnChange ? "onChange" : "onSubmit",
  });

  const isVerticalLayout = action.formLayout === "vertical" || action.formLayout === "wizard-vertical";

  const handleFormSubmit = async (data: FieldValues) => {
    try {
      setIsSubmitting(true);

      // Convert form data to FormData for server action
      const formData = new FormData();

      // Add selected items if this action requires selection
      if (action.requiresSelection && selectedItems) {
        selectedItems.forEach((id) => formData.append("selectedIds", id));
      }

      // Add form field data
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

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header - Only render if we have title or description and not hidden */}
      {!hideHeader && (action.title || action.description) && (
        <div className="flex items-start gap-3">
          {action.iconName && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent
                name={action.iconName}
                className="w-5 h-5 text-primary"
              />
            </div>
          )}
          <div>
            {action.title && (
              <h2 className="text-lg font-semibold">
                {getLocalizedText(action.title, currentLanguage)}
              </h2>
            )}
            {action.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {getLocalizedText(action.description, currentLanguage)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selection Info */}
      {action.requiresSelection && selectedItems && selectedItems.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            {currentLanguage === "mm"
              ? `ရွေးချယ်ထားသော အရာ ${selectedItems.length} ခု`
              : `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`}
          </p>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className={isVerticalLayout ? "space-y-4" : "space-y-4"}>
          {action.formFields.map((field) =>
            renderField(field, control, currentLanguage, isVerticalLayout, errors, watch)
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {action.cancelButtonText
              ? getLocalizedText(action.cancelButtonText, currentLanguage)
              : currentLanguage === "mm"
              ? "မလုပ်တော့ပါ"
              : "Cancel"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={
              action.buttonStyle === "secondary" 
                ? "secondary"
                : action.buttonStyle === "warning"
                ? "destructive" 
                : "default"
            }
            className={
              action.buttonStyle === "warning"
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : ""
            }
          >
            {isSubmitting && action.showProgress && (
              <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
            )}
            {action.submitButtonText
              ? getLocalizedText(action.submitButtonText, currentLanguage)
              : currentLanguage === "mm"
              ? "သိမ်းမည်"
              : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}