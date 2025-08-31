/**
 * Form utility functions for consistent form handling across the application
 */

import type { FormField } from "@repo/types";

/**
 * Creates FormData from an object, handling multi-language fields and arrays
 */
export function createFormData(
  data: Record<string, any>,
  extraData?: Record<string, any>
): FormData {
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
    appendToFormData(formData, key, value);
  });

  return formData;
}

/**
 * Appends a value to FormData, handling different value types
 */
function appendToFormData(formData: FormData, key: string, value: any): void {
  if (value === null || value === undefined) {
    return;
  }

  // Handle multi-language fields
  if (isMultiLanguageField(value)) {
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
  else if (value instanceof File) {
    formData.append(key, value);
  }
  // Handle file-like objects
  else if (value && typeof value === "object" && value.type === "file") {
    // Skip file-like objects that aren't actual File instances
    return;
  }
  // Handle regular values
  else {
    formData.append(key, String(value));
  }
}

/**
 * Checks if a value is a multi-language field object
 */
function isMultiLanguageField(value: any): boolean {
  return (
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof File) &&
    !value.type &&
    Object.keys(value).every((key) => 
      ["en", "mm", "zh", "th", "ko", "ja"].includes(key)
    )
  );
}

/**
 * Processes multi-language field values for forms
 */
export function processMultiLanguageFields(
  fields: FormField[],
  data: Record<string, any>
): Record<string, any> {
  const processed = { ...data };

  fields.forEach((field) => {
    if (field.isMultiLanguage && data[field.fieldName]) {
      const value = data[field.fieldName];
      
      // Ensure multi-language structure
      if (typeof value === "string") {
        processed[field.fieldName] = { en: value };
      } else if (typeof value === "object" && !Array.isArray(value)) {
        processed[field.fieldName] = value;
      }
    }
  });

  return processed;
}

/**
 * Filters form fields based on action and field properties
 */
export function filterFormFields(
  fields: FormField[],
  action: "create" | "update"
): FormField[] {
  return fields.filter((field) => {
    // Filter out hidden fields
    if (field.hidden) return false;
    
    // Filter out password fields in edit mode
    if (action === "update" && field.fieldType === "password") {
      return false;
    }
    
    // Filter out read-only fields in create mode
    if (action === "create" && field.readOnly) {
      return false;
    }
    
    return true;
  });
}

/**
 * Validates required fields are present in data
 */
export function validateRequiredFields(
  fields: FormField[],
  data: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  fields.forEach((field) => {
    if (field.required && !field.hidden) {
      const value = data[field.fieldName];
      
      if (value === null || value === undefined || value === "") {
        missing.push(field.fieldName);
      }
      
      // Check multi-language fields
      if (field.isMultiLanguage && typeof value === "object") {
        const hasValue = Object.values(value).some((v) => v !== "" && v !== null && v !== undefined);
        if (!hasValue) {
          missing.push(field.fieldName);
        }
      }
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extracts default values from form fields
 */
export function getDefaultValues(fields: FormField[]): Record<string, any> {
  const defaults: Record<string, any> = {};

  fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      defaults[field.fieldName] = field.defaultValue;
    } else if (field.isMultiLanguage) {
      defaults[field.fieldName] = { en: "" };
    } else if (field.fieldType === "checkbox") {
      defaults[field.fieldName] = false;
    } else if (field.fieldType === "number") {
      defaults[field.fieldName] = 0;
    } else if (field.fieldType === "select" && field.multiple) {
      defaults[field.fieldName] = [];
    } else {
      defaults[field.fieldName] = "";
    }
  });

  return defaults;
}