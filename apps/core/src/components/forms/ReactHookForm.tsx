"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { IconComponent } from "@repo/ui/components/icons";
import { FormFieldRenderer } from "./FormFieldRenderer";
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
  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;

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
      
      // For update operations, include version and other metadata fields
      if (action === "update" && initialData) {
        // Include version for optimistic concurrency control
        if (initialData.version !== undefined) {
          formData.append("version", String(initialData.version));
        }
        // Include _id if present
        if (initialData._id) {
          formData.append("_id", String(initialData._id));
        }
      }
      
      Object.entries(data).forEach(([key, value]) => {
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
          
          // Show error toast for immediate feedback
          toastError(mainError);
        } else if (result.errors) {
          // Handle other validation errors (legacy format)
          const errorMessages = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n");
          setSubmitError(errorMessages);
          
          // Show error toast for immediate feedback
          const toastErrorMessage = result.error || getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', currentLanguage as 'en' | 'mm');
          toastError(toastErrorMessage);
        } else {
          const errorMessage = result.error || getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', currentLanguage as 'en' | 'mm');
          setSubmitError(errorMessage);
          
          // Show error toast for immediate feedback
          toastError(errorMessage);
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
      <Form {...form}>
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
              .map((field) => (
                <FormFieldRenderer
                  key={field.fieldName}
                  field={field}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={isVerticalLayout}
                  errors={errors}
                  watch={watch}
                />
              ))}
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
      </Form>
    </div>
  );
}