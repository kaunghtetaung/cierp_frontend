"use client";

import React, { useRef, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@repo/ui";
import { Input } from "@repo/ui";
import { Textarea } from "@repo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Checkbox } from "@repo/ui";
import { RadioGroup, RadioGroupItem } from "@repo/ui";
import { Label } from "@repo/ui";
import { DynamicSelect } from "./DynamicSelect";
import { TypeaheadDynamicSelect } from "./TypeaheadDynamicSelect";
import { DependentSelect } from "./DependentSelect";
import { PasswordField } from "./PasswordField";
import { MultiLanguageInput } from "./MultiLanguageInput";
import { PhoneInput } from "./PhoneInput";
import { IconComponent, IconSelector } from "@repo/ui";
import type { FormField as SchemaFormField } from "@repo/types";

// Auto-configure dropdownConfig for common organizational fields
function autoConfigureDropdown(field: SchemaFormField): SchemaFormField {
  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    return field;
  }

  // Auto-configure organization fields
  if (
    field.fieldName === "organizationId" ||
    field.fieldName === "organization" ||
    field.fieldName.toLowerCase().includes("organization")
  ) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/organizations/ref",
        searchable: true,
        clearable: false,
        preloadData: true,
      },
    };
  }

  // Auto-configure department fields (dependent on organization)
  if (
    field.fieldName === "departmentId" ||
    field.fieldName === "department" ||
    field.fieldName.toLowerCase().includes("department")
  ) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/departments/ref",
        dependsOn: ["organizationId", "organization"],
        searchable: true,
        clearable: true,
        preloadData: false,
      },
    };
  }

  // Auto-configure user fields
  if (
    field.fieldName === "userId" ||
    field.fieldName === "user" ||
    field.fieldName === "assignedTo" ||
    field.fieldName.toLowerCase().includes("user")
  ) {
    return {
      ...field,
      dropdownConfig: {
        type: "dynamic",
        refPath: "/users/ref",
        searchable: true,
        clearable: true,
        preloadData: false,
      },
    };
  }

  // Return original field if no auto-configuration applies
  return field;
}

// Convert dataSource configuration to dropdownConfig for backward compatibility
function convertDataSourceToDropdownConfig(
  field: SchemaFormField
): SchemaFormField {
  // Debug for author field
  if (field.fieldName === "author") {
    console.log("🚨 convertDataSourceToDropdownConfig called for author:", {
      hasDropdownConfig: !!field.dropdownConfig,
      hasDataSource: !!field.dataSource,
      fieldType: field.fieldType,
      dataSource: field.dataSource,
    });
  }

  // Skip if already has dropdownConfig
  if (field.dropdownConfig) {
    // BUT check if we need to override for typeahead
    if (field.dataSource?.enableTypeahead === true) {
      console.log(
        `⚠️ Field "${field.fieldName}" has dropdownConfig but also enableTypeahead=true, overriding...`
      );
      // Don't return early, continue to process
    } else {
      return field;
    }
  }

  // Handle fields with dataSource configuration
  if (field.dataSource) {
    // Debug log to see what we're getting
    if (field.fieldName === "author") {
      console.log(`🔍 DEBUG: author field dataSource:`, field.dataSource);
      console.log(
        `🔍 DEBUG: enableTypeahead value:`,
        field.dataSource.enableTypeahead
      );
      console.log(
        `🔍 DEBUG: enableTypeahead type:`,
        typeof field.dataSource.enableTypeahead
      );
    }

    // IMPORTANT: Check if dataSource has enableTypeahead flag
    const hasTypeahead = field.dataSource.enableTypeahead === true;

    const dropdownConfig: any = {
      type: "dynamic" as const,
      refPath: field.dataSource.endpoint,
      searchable: true,
      clearable: true,
      // CRITICAL: If typeahead is enabled, NEVER preload data
      // Only load data when user starts typing
      preloadData: hasTypeahead
        ? false
        : field.fieldType === "dynamicSelect"
        ? true
        : false,
    };

    if (hasTypeahead) {
      console.log(
        `🔍 Field "${field.fieldName}" has enableTypeahead=true, configuring typeahead...`
      );
      dropdownConfig.enableTypeahead = true;
      dropdownConfig.preloadData = false; // NEVER preload for typeahead - wait for user input
      dropdownConfig.minSearchLength = field.dataSource.minSearchLength || 2;
      dropdownConfig.debounceMs = field.dataSource.debounceMs || 300;
      dropdownConfig.searchParam = field.dataSource.searchParam || "search";
      dropdownConfig.emptyMessage = field.dataSource.emptyMessage;
      dropdownConfig.labelField = field.dataSource.labelField;
      dropdownConfig.valueField = field.dataSource.valueField;

      // Add extra config to ensure no initial load
      dropdownConfig.loadOnMount = false;
      dropdownConfig.requireUserInput = true;
    }

    // Handle dependent fields
    if (
      field.fieldType === "dependentSelect" &&
      field.dataSource.dependentField
    ) {
      dropdownConfig.dependsOn = [field.dataSource.dependentField];
    }

    // Determine final field type
    let finalFieldType = field.fieldType;

    // If dataSource.enableTypeahead is true, convert dynamicSelect to typeaheadSelect
    if (hasTypeahead && field.fieldType === "dynamicSelect") {
      finalFieldType = "typeaheadSelect";
      console.log(
        `🔄 Converting field "${field.fieldName}" from dynamicSelect to typeaheadSelect due to enableTypeahead flag`
      );
    } else if (field.fieldType === "multiDependentSelect") {
      finalFieldType = "multiSelect";
    } else if (
      ![
        "dynamicSelect",
        "dependentSelect",
        "typeaheadSelect",
        "multiSelect",
      ].includes(field.fieldType)
    ) {
      // Only convert unknown types to select
      finalFieldType = "select";
    }

    const result = {
      ...field,
      fieldType: finalFieldType,
      dropdownConfig,
    };

    if (hasTypeahead || field.fieldName === "author") {
      console.log(
        `✅ convertDataSourceToDropdownConfig result for "${field.fieldName}":`,
        {
          originalFieldType: field.fieldType,
          finalFieldType: result.fieldType,
          hasTypeahead: hasTypeahead,
          enableTypeahead: result.dropdownConfig?.enableTypeahead,
          preloadData: result.dropdownConfig?.preloadData,
          minSearchLength: result.dropdownConfig?.minSearchLength,
          debounceMs: result.dropdownConfig?.debounceMs,
        }
      );
    }

    return result;
  }

  return field;
}

export interface FormFieldRendererProps {
  field: SchemaFormField;
  currentLanguage?: string;
  isVerticalLayout?: boolean;
  errors?: any;
  watch?: any;
  onValueChange?: (value: any) => void;
}

export function FormFieldRenderer({
  field: originalField,
  currentLanguage = "en",
  isVerticalLayout = false,
  errors = {},
  watch: watchProp,
  onValueChange,
}: FormFieldRendererProps) {
  const { control, watch } = useFormContext();
  const watchFunction = watchProp || watch;

  // Apply auto-configuration and backward compatibility
  let field = convertDataSourceToDropdownConfig(originalField);
  if (!originalField.dataSource) {
    field = autoConfigureDropdown(field);
  }

  // Early validation - ensure field has required properties
  if (!field || !field.fieldName) {
    console.error("FormFieldRenderer: Invalid field configuration", field);
    return null;
  }

  // Get current label for the field
  const getFieldLabel = (field: SchemaFormField) => {
    if (typeof field.label === "string") return field.label;
    return (
      field.label[currentLanguage as keyof typeof field.label] || field.label.en
    );
  };

  // Get validation error message
  const getErrorMessage = (field: SchemaFormField) => {
    if (!field.validationRule?.errorMessage) return undefined;
    if (typeof field.validationRule.errorMessage === "string")
      return field.validationRule.errorMessage;
    return (
      field.validationRule.errorMessage[
        currentLanguage as keyof typeof field.validationRule.errorMessage
      ] || field.validationRule.errorMessage.en
    );
  };

  // Don't render hidden fields
  if (field.hidden) {
    return null;
  }

  // Handle multi-language fields
  if (
    field.isMultiLang &&
    (field.fieldType === "text" || field.fieldType === "textArea")
  ) {
    const containerClasses = isVerticalLayout
      ? "flex items-start gap-2 sm:gap-4"
      : "space-y-2";
    const labelContainerClasses = isVerticalLayout
      ? "flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2"
      : "";
    const inputContainerClasses = isVerticalLayout
      ? "flex-1 min-w-0 space-y-1"
      : "";

    return (
      <div className={containerClasses}>
        {isVerticalLayout ? (
          <div className={labelContainerClasses}>
            <label className="block text-xs sm:text-sm font-medium">
              {getFieldLabel(field)}{" "}
              {field.validationRule?.required && (
                <span className="text-danger">*</span>
              )}
            </label>
          </div>
        ) : (
          <label className="block text-sm font-medium">
            {getFieldLabel(field)}{" "}
            {field.validationRule?.required && (
              <span className="text-red-500">*</span>
            )}
          </label>
        )}
        <div className={inputContainerClasses}>
          <Controller
            name={field.fieldName}
            control={control}
            render={({ field: { onChange, value } }) => (
              <MultiLanguageInput
                field={field}
                defaultValue={value}
                currentLanguage={currentLanguage}
                isVerticalLayout={isVerticalLayout}
                onValueChange={(newValue) => {
                  onChange(newValue);
                  onValueChange?.(newValue);
                }}
                errors={errors}
              />
            )}
          />
        </div>
      </div>
    );
  }

  const label = getFieldLabel(field);
  const isRequired = field.validationRule?.required ?? false;
  const isReadonly = field.readonly ?? false;

  // Additional validation before rendering
  if (!field.fieldName || typeof field.fieldName !== "string") {
    console.error("FormFieldRenderer: fieldName must be a non-empty string", {
      field,
      fieldName: field.fieldName,
    });
    return (
      <div className="text-danger text-sm p-2 border border-danger rounded">
        Error: Invalid field name configuration
      </div>
    );
  }

  // Container classes for layout support
  const containerClasses = isVerticalLayout
    ? "flex items-start gap-2 sm:gap-4"
    : "space-y-2";

  return (
    <div className={containerClasses}>
      <FormField
        control={control}
        name={field.fieldName}
        render={({ field: formField, fieldState }) => (
          <FormItem className={isVerticalLayout ? "flex-1 min-w-0" : ""}>
            <FormLabel
              className={`${
                isRequired
                  ? "after:content-['*'] after:ml-0.5 after:text-danger"
                  : ""
              } ${isVerticalLayout ? "text-xs sm:text-sm" : "text-sm"}`}
            >
              {label}
            </FormLabel>
            <FormControl>
              <FormFieldInput
                field={field}
                formField={formField}
                isReadonly={isReadonly}
                currentLanguage={currentLanguage}
                errors={errors}
                watchFunction={watchFunction}
                onValueChange={onValueChange}
              />
            </FormControl>
            {fieldState.error && (
              <FormMessage className="flex items-center gap-1">
                <IconComponent name="AlertCircle" className="w-3 h-3" />
                {fieldState.error.message || getErrorMessage(field)}
              </FormMessage>
            )}
            {errors[field.fieldName] && !fieldState.error && (
              <p className="text-xs text-destructive mt-1 flex items-center">
                <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
                {errors[field.fieldName]?.message}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}

interface FormFieldInputProps {
  field: SchemaFormField;
  formField: any;
  isReadonly: boolean;
  currentLanguage: string;
  errors?: any;
  watchFunction?: any;
  onValueChange?: (value: any) => void;
}

function FormFieldInput({
  field,
  formField,
  isReadonly,
  currentLanguage,
  errors = {},
  watchFunction,
  onValueChange,
}: FormFieldInputProps) {
  const { control, watch } = useFormContext();
  const watchFunc = watchFunction || watch;

  switch (field.fieldType) {
    case "phone":
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: { onChange, value } }) => (
            <PhoneInput
              value={value || ""}
              onChange={onChange}
              disabled={isReadonly}
              config={field.phoneConfig}
              error={!!errors[field.fieldName]}
              currentLanguage={currentLanguage}
              placeholder={field.placeHolder}
            />
          )}
        />
      );

    case "text":
    case "email":
      return (
        <Controller
          control={control}
          name={field.fieldName}
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
              <Input
                ref={inputRef}
                type={field.fieldType}
                name={name}
                value={value || ""}
                onChange={(e) => {
                  onChange(e);
                  onValueChange?.(e.target.value);
                }}
                placeholder={field.placeHolder}
                readOnly={isReadonly}
                className={`${isReadonly ? "bg-muted" : ""} ${
                  hasError
                    ? "border-destructive focus:ring-destructive bg-destructive/5"
                    : ""
                }`}
              />
            );
          }}
        />
      );

    case "number":
      return (
        <Input
          {...formField}
          type="number"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            const numValue = e.target.valueAsNumber || "";
            formField.onChange(numValue);
            onValueChange?.(numValue);
          }}
        />
      );

    case "password":
      // Use enhanced PasswordField if strength indicator is enabled
      if (field.validationRule?.showStrengthIndicator) {
        return (
          <PasswordField
            value={formField.value || ""}
            onChange={(value) => {
              formField.onChange(value);
              onValueChange?.(value);
            }}
            placeholder={field.placeHolder}
            className={`${isReadonly ? "bg-muted" : ""} ${
              errors[field.fieldName]
                ? "border-destructive focus:ring-destructive bg-destructive/5"
                : ""
            }`}
            readOnly={isReadonly}
            strengthConfig={field.validationRule.strengthMeterConfig}
            currentLanguage={currentLanguage}
            showStrengthIndicator={true}
          />
        );
      }

      // Fallback to basic password input
      return (
        <Input
          {...formField}
          type="password"
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      );

    case "textArea":
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 3}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      );

    case "typeaheadSelect":
      // TypeaheadSelect always uses typeahead functionality
      // The field type itself implies typeahead should be enabled
      console.log(
        "🔍 TypeaheadSelect case reached for field:",
        field.fieldName,
        {
          fieldType: field.fieldType,
          hasDataSource: !!field.dataSource,
          hasDropdownConfig: !!field.dropdownConfig,
          enableTypeahead: field.dropdownConfig?.enableTypeahead,
          dataSource: field.dataSource,
          dropdownConfig: field.dropdownConfig,
        }
      );

      // For typeaheadSelect fields, ALWAYS use TypeaheadDynamicSelect
      // The dropdownConfig should have been set by convertDataSourceToDropdownConfig
      // But even if it's missing, we should still use typeahead for this field type
      if (field.dropdownConfig || field.dataSource) {
        // Build the typeahead configuration
        const typeaheadField = {
          ...field,
          dropdownConfig: field.dropdownConfig || {
            type: "dynamic",
            refPath: field.dataSource?.endpoint,
            searchable: true,
            clearable: true,
            preloadData: false,
            enableTypeahead: true,
            minSearchLength: field.dataSource?.minSearchLength || 2,
            debounceMs: field.dataSource?.debounceMs || 300,
            searchParam: field.dataSource?.searchParam || "search",
            emptyMessage: field.dataSource?.emptyMessage,
            labelField: field.dataSource?.labelField,
            valueField: field.dataSource?.valueField,
          },
        };

        // Ensure typeahead is enabled in the config
        if (typeaheadField.dropdownConfig) {
          typeaheadField.dropdownConfig.enableTypeahead = true;
          typeaheadField.dropdownConfig.preloadData = false;
          // Add typeahead specific settings if not already present
          if (
            !typeaheadField.dropdownConfig.minSearchLength &&
            field.dataSource?.minSearchLength
          ) {
            typeaheadField.dropdownConfig.minSearchLength =
              field.dataSource.minSearchLength;
          }
          if (
            !typeaheadField.dropdownConfig.debounceMs &&
            field.dataSource?.debounceMs
          ) {
            typeaheadField.dropdownConfig.debounceMs =
              field.dataSource.debounceMs;
          }
          if (
            !typeaheadField.dropdownConfig.searchParam &&
            field.dataSource?.searchParam
          ) {
            typeaheadField.dropdownConfig.searchParam =
              field.dataSource.searchParam;
          }
        }

        console.log("✅ Using TypeaheadDynamicSelect for:", field.fieldName);

        return (
          <TypeaheadDynamicSelect
            field={typeaheadField}
            value={formField.value}
            onChange={(newValue) => {
              formField.onChange(newValue);
              onValueChange?.(newValue);
            }}
            currentLanguage={currentLanguage}
            watch={watchFunc}
            errors={errors}
          />
        );
      }
      // Fall through to regular select handling if no dataSource or dropdownConfig
      console.log(
        "⚠️ TypeaheadSelect field has no dataSource or dropdownConfig, falling through to regular select:",
        field.fieldName
      );

    case "select":
    case "dynamicSelect":
    case "dependentSelect":
      // Note: Fields with enableTypeahead should have been converted to typeaheadSelect
      // by convertDataSourceToDropdownConfig function

      // Use DynamicSelect for advanced dropdown functionality if dropdownConfig exists
      if (field.dropdownConfig) {
        return (
          <DynamicSelect
            field={field}
            value={formField.value}
            onChange={(newValue) => {
              formField.onChange(newValue);
              onValueChange?.(newValue);
            }}
            currentLanguage={currentLanguage}
            watch={watchFunc}
            errors={errors}
          />
        );
      }

      // Fallback to regular select
      return (
        <Select
          value={formField.value || ""}
          onValueChange={(value) => {
            formField.onChange(value);
            onValueChange?.(value);
          }}
          disabled={isReadonly}
        >
          <SelectTrigger
            className={`${isReadonly ? "bg-muted" : ""} ${
              errors[field.fieldName] ? "border-destructive" : ""
            }`}
          >
            <SelectValue placeholder={field.placeHolder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
              >
                {typeof option.label === "string"
                  ? option.label
                  : option.label[
                      currentLanguage as keyof typeof option.label
                    ] || option.label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multiSelect":
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div
              className={`space-y-2 ${
                errors[field.fieldName]
                  ? "border border-destructive/20 bg-destructive/5 rounded p-2"
                  : ""
              }`}
            >
              {field.options?.map((option) => (
                <div
                  key={String(option.value)}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${field.fieldName}-${String(option.value)}`}
                    checked={
                      Array.isArray(controllerField.value) &&
                      controllerField.value.includes(String(option.value))
                    }
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(controllerField.value)
                        ? controllerField.value
                        : [];
                      const newValue = checked
                        ? [...currentValue, String(option.value)]
                        : currentValue.filter(
                            (v: string) => v !== String(option.value)
                          );
                      controllerField.onChange(newValue);
                      onValueChange?.(newValue);
                    }}
                    disabled={isReadonly}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === "string"
                      ? option.label
                      : option.label[
                          currentLanguage as keyof typeof option.label
                        ] || option.label.en}
                  </Label>
                </div>
              ))}
            </div>
          )}
        />
      );

    case "radio":
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <RadioGroup
              value={controllerField.value}
              onValueChange={(value) => {
                controllerField.onChange(value);
                onValueChange?.(value);
              }}
              disabled={isReadonly}
              className={
                errors[field.fieldName]
                  ? "border border-destructive/20 bg-destructive/5 rounded p-2"
                  : ""
              }
            >
              {field.options?.map((option) => (
                <div
                  key={String(option.value)}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={String(option.value)}
                    id={`${field.fieldName}-${String(option.value)}`}
                  />
                  <Label htmlFor={`${field.fieldName}-${String(option.value)}`}>
                    {typeof option.label === "string"
                      ? option.label
                      : option.label[
                          currentLanguage as keyof typeof option.label
                        ] || option.label.en}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      );

    case "checkbox":
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <div
              className={`flex items-center space-x-2 ${
                errors[field.fieldName] ? "text-destructive" : ""
              }`}
            >
              <Checkbox
                id={field.fieldName}
                checked={controllerField.value}
                onCheckedChange={(checked) => {
                  controllerField.onChange(checked);
                  onValueChange?.(checked);
                }}
                disabled={isReadonly}
              />
              <Label htmlFor={field.fieldName}>
                {field.placeHolder || "Enable"}
              </Label>
            </div>
          )}
        />
      );

    case "boolean":
      return (
        <Controller
          control={control}
          name={field.fieldName}
          render={({ field: controllerField }) => (
            <Select
              value={
                controllerField.value === undefined
                  ? ""
                  : String(controllerField.value)
              }
              onValueChange={(value) => {
                const boolValue = value === "true";
                controllerField.onChange(boolValue);
                onValueChange?.(boolValue);
              }}
              disabled={isReadonly}
            >
              <SelectTrigger
                className={`${isReadonly ? "bg-muted" : ""} ${
                  errors[field.fieldName] ? "border-destructive" : ""
                }`}
              >
                <SelectValue placeholder={field.placeHolder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      );

    case "date":
      return (
        <Input
          {...formField}
          type="date"
          readOnly={isReadonly}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      );

    case "file":
      return (
        <Input
          type="file"
          accept={field.accept}
          readOnly={isReadonly}
          onChange={(e) => {
            const file = e.target.files?.[0];
            formField.onChange(file);
            onValueChange?.(file);
          }}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName] ? "border-destructive" : ""
          }`}
        />
      );

    case "htmlContent":
      return (
        <Textarea
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          rows={field.rows || 5}
          className={`${isReadonly ? "bg-muted" : ""} font-mono text-sm ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      );

    case "icon":
      return (
        <IconSelector
          value={formField.value || ""}
          onSelect={(iconName) => {
            formField.onChange(iconName);
            onValueChange?.(iconName);
          }}
          placeholder={field.placeHolder || "Select an icon..."}
          disabled={isReadonly}
          className="w-full"
        />
      );

    default:
      return (
        <Input
          {...formField}
          placeholder={field.placeHolder}
          readOnly={isReadonly}
          className={`${isReadonly ? "bg-muted" : ""} ${
            errors[field.fieldName]
              ? "border-destructive focus:ring-destructive bg-destructive/5"
              : ""
          }`}
          onChange={(e) => {
            formField.onChange(e);
            onValueChange?.(e.target.value);
          }}
        />
      );
  }
}
