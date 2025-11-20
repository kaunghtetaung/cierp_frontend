"use client";

import React, { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Form } from "@repo/ui";
import { FormFieldRenderer } from "@repo/schema-forms";
import { generateZodSchema } from "@repo/schema-utils";
import type { ExtraActionForm } from "@repo/types";

interface DynamicExtraActionFormProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  moduleSlug?: string; // For server action routing
  hideHeader?: boolean; // Hide the form header to prevent duplication in modals
}


export function DynamicExtraActionForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  moduleSlug,
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
  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {},
    mode: action.formValidation?.validateOnChange ? "onChange" : "onSubmit",
  });

  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const isVerticalLayout = action.formLayout === "vertical" || action.formLayout === "wizard-vertical";

  const handleFormSubmit = async (data: FieldValues) => {
    try {
      setIsSubmitting(true);
      
      // Debug log the raw form data
      console.log("🔍 DynamicExtraActionForm - Raw form data before processing:", data);

      // Convert form data to FormData for server action
      const formData = new FormData();

      // Add action metadata
      formData.append("actionKey", action.actionKey);
      
      // Add moduleSlug if provided
      if (moduleSlug && moduleSlug !== 'undefined') {
        formData.append("moduleSlug", moduleSlug);
      }

      // Add selected items if this action requires selection
      if (action.requiresSelection && selectedItems) {
        selectedItems.forEach((id) => formData.append("selectedIds", id));
        // Also add the first item as 'id' for single-item actions
        if (selectedItems.length === 1) {
          formData.append("id", selectedItems[0]);
        }
      }

      // Add form field data
      Object.entries(data).forEach(([key, value]) => {
        // Debug specific field
        if (key === "accessionGroup") {
          console.log("📌 DynamicExtraActionForm - accessionGroup field:", {
            key,
            value,
            valueType: typeof value,
            isArray: Array.isArray(value),
            stringified: String(value)
          });
        }
        
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            // Handle multi-language fields - send as nested JSON object
            formData.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            // Handle array values (multi-select)
            value.forEach((item) => formData.append(key, String(item)));
          } else {
            // Safe serialization - use String() constructor instead of .toString() method
            // This avoids client/server boundary issues with client references
            formData.append(key, String(value));
          }
        }
      });
      
      // Debug log the FormData entries
      console.log("📤 DynamicExtraActionForm - FormData being submitted:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      await onSubmit(formData);
      
      // Reset form after successful submission so user can add another entry
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current form values for debug display
  const formValues = watch();
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show by default for debugging

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
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className={isVerticalLayout ? "space-y-4" : "space-y-4"}>
            {action.formFields.map((field) =>
              <FormFieldRenderer
                key={field.fieldName}
                field={field}
                currentLanguage={currentLanguage}
                isVerticalLayout={isVerticalLayout}
                errors={errors}
                watch={watch}
              />
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
      </Form>
      
      {/* Debug Panel - Shows current form data */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <IconComponent name="Bug" className="w-4 h-4" />
              Debug: Form Data Preview
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="h-6 px-2"
            >
              <IconComponent 
                name={showDebugPanel ? "ChevronUp" : "ChevronDown"} 
                className="w-4 h-4" 
              />
            </Button>
          </div>
          
          {showDebugPanel && (
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <div className="text-muted-foreground mb-2">Form values that will be submitted:</div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(formValues, null, 2)}
                </pre>
              </div>
              
              {/* Highlight specific fields */}
              {formValues.accessionGroup && (
                <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    ⚠️ AccessionGroup Field Value:
                  </div>
                  <div className="font-mono text-xs">
                    Type: {typeof formValues.accessionGroup}<br/>
                    Value: {JSON.stringify(formValues.accessionGroup)}<br/>
                    Expected: Should be the 'name' value, not ID
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <strong>Note:</strong> This panel shows the raw form data that will be sent on submission.
                Check if field values match expected formats (e.g., accessionGroup should be name, not ID).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}