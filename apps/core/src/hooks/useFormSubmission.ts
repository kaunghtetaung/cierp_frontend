"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { getLocalizedErrorMessage } from "@repo/api/messages";
import type { LocalizedText } from "@repo/types";

interface UseFormSubmissionOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  successMessage?: LocalizedText | string;
  errorMessage?: LocalizedText | string;
  redirectPath?: string;
  currentLanguage: string;
}

export function useFormSubmission(options: UseFormSubmissionOptions) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (
    submitAction: (formData: FormData) => Promise<any>,
    data: Record<string, any>,
    extraData?: Record<string, any>
  ) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Convert data to FormData
      const formData = new FormData();
      
      // Add extra data first (like version for updates)
      if (extraData) {
        Object.entries(extraData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
      }

      // Process main form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Handle multi-language fields
          if (typeof value === "object" && !Array.isArray(value) && !value.type) {
            Object.entries(value).forEach(([lang, langValue]) => {
              if (langValue !== null && langValue !== undefined) {
                formData.append(`${key}[${lang}]`, String(langValue));
              }
            });
          }
          // Handle arrays
          else if (Array.isArray(value)) {
            value.forEach((item) => {
              formData.append(`${key}[]`, String(item));
            });
          }
          // Handle file inputs
          else if (value instanceof File || (value && typeof value === "object" && value.type === "file")) {
            if (value instanceof File) {
              formData.append(key, value);
            }
          }
          // Handle regular values
          else {
            formData.append(key, String(value));
          }
        }
      });

      // Submit the form
      const result = await submitAction(formData);

      if (result?.success) {
        // Show success message
        const message = options.successMessage
          ? typeof options.successMessage === "string"
            ? options.successMessage
            : getLocalizedText(options.successMessage, options.currentLanguage)
          : "Operation completed successfully";
        
        toastSuccess(message);

        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(result);
        }

        // Redirect if path provided
        if (options.redirectPath) {
          router.push(options.redirectPath);
        } else {
          router.refresh();
        }

        return result;
      } else {
        // Handle error response
        const errorMsg = result?.error 
          ? getLocalizedErrorMessage(result.error, options.currentLanguage)
          : options.errorMessage
            ? typeof options.errorMessage === "string"
              ? options.errorMessage
              : getLocalizedText(options.errorMessage, options.currentLanguage)
            : "An error occurred during submission";
        
        setSubmitError(errorMsg);
        toastError(errorMsg);
        
        if (options.onError) {
          options.onError(errorMsg);
        }
        
        return null;
      }
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred";
      
      setSubmitError(errorMsg);
      toastError(errorMsg);
      
      if (options.onError) {
        options.onError(errorMsg);
      }
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setSubmitError(null);

  return {
    handleSubmit,
    isSubmitting,
    submitError,
    clearError,
  };
}