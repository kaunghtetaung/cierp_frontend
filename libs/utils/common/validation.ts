// Enhanced validation utilities with security focus
import type { ValidationError } from "@repo/types";

/**
 * Email validation with comprehensive checks
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Password strength validation
 */
export interface PasswordValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly score: number; // 0-100
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 25;
  } else {
    score += 15;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 15;
  else errors.push("Password must contain lowercase letters");

  if (/[A-Z]/.test(password)) score += 15;
  else errors.push("Password must contain uppercase letters");

  if (/[0-9]/.test(password)) score += 15;
  else errors.push("Password must contain numbers");

  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else errors.push("Password must contain special characters");

  // Common pattern checks
  if (!/(..).*\1/.test(password)) score += 10; // No repeated patterns

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(100, score),
  };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Validate slug format (URL-safe)
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: string): boolean {
  // Enhanced regex to allow uppercase letters, numbers, hyphens, and underscores
  const tenantRegex = /^[a-zA-Z0-9-_]+$/;
  return (
    tenantRegex.test(tenantId) && tenantId.length >= 3 && tenantId.length <= 50
  );
}

/**
 * Validate language code format
 */
export function isValidLanguageCode(language: string): boolean {
  // Support common language codes (en, mm, en-US, etc.)
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(language);
}

/**
 * Type guard to check if we have a valid tenant ID
 */
export function hasTenantId(tenantId: string | null): tenantId is string {
  return tenantId !== null && tenantId.length > 0;
}

/**
 * Type guard to check if we have a valid request ID
 */
export function hasRequestId(requestId: string | null): requestId is string {
  return requestId !== null && requestId.length > 0;
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ""));
}

/**
 * Create validation error object
 */
export function createValidationError(
  field: string,
  message: string,
  code: string
): ValidationError {
  return {
    field,
    message,
    code,
  };
}

/**
 * Validate required fields
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === "") {
    return createValidationError(
      fieldName,
      `${fieldName} is required`,
      "REQUIRED"
    );
  }
  return null;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): ValidationError | null {
  if (value.length < min) {
    return createValidationError(
      fieldName,
      `${fieldName} must be at least ${min} characters`,
      "MIN_LENGTH"
    );
  }
  if (value.length > max) {
    return createValidationError(
      fieldName,
      `${fieldName} must be no more than ${max} characters`,
      "MAX_LENGTH"
    );
  }
  return null;
}

/**
 * Validate array length
 */
export function validateArrayLength(
  value: unknown[],
  fieldName: string,
  min: number,
  max: number
): ValidationError | null {
  if (value.length < min) {
    return createValidationError(
      fieldName,
      `${fieldName} must have at least ${min} items`,
      "MIN_ITEMS"
    );
  }
  if (value.length > max) {
    return createValidationError(
      fieldName,
      `${fieldName} must have no more than ${max} items`,
      "MAX_ITEMS"
    );
  }
  return null;
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number
): ValidationError | null {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return createValidationError(
      "file",
      `File size must be less than ${maxSizeMB}MB`,
      "FILE_TOO_LARGE"
    );
  }
  return null;
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): ValidationError | null {
  if (!allowedTypes.includes(file.type)) {
    return createValidationError(
      "file",
      `File type ${file.type} is not allowed`,
      "INVALID_FILE_TYPE"
    );
  }
  return null;
}
