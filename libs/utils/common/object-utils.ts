// Common Utility Functions - Shared utilities across the application
import type { ApplicationError } from "./error-types";
import { ErrorFactory } from "./error-factory";

// ===== ASYNC UTILITIES =====

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const backoffDelay = delay * Math.pow(backoffMultiplier, attempt - 1);
      await sleep(backoffDelay);
    }
  }

  throw lastError;
}

// ===== VALIDATION UTILITIES =====

/**
 * Check if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if string is not empty
 */
export function isNotEmpty(value: string | null | undefined): value is string {
  return isNotNullish(value) && value.trim().length > 0;
}

/**
 * Check if array is not empty
 */
export function isNotEmptyArray<T>(
  value: T[] | null | undefined
): value is T[] {
  return isNotNullish(value) && value.length > 0;
}

/**
 * Check if object is not empty
 */
export function isNotEmptyObject(
  value: object | null | undefined
): value is object {
  return isNotNullish(value) && Object.keys(value).length > 0;
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[],
  context: { operation: string; component?: string }
): void {
  const missingFields = requiredFields.filter(
    (field) => !isNotNullish(obj[field])
  );

  if (missingFields.length > 0) {
    throw ErrorFactory.createValidationError(
      `Missing required fields: ${missingFields.join(", ")}`,
      context
    );
  }
}

// ===== OBJECT UTILITIES =====

/**
 * Deep clone an object (JSON-serializable objects only)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Pick specific properties from an object
 */
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific properties from an object
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Merge objects deeply
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}

// ===== STRING UTILITIES =====

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "..."
): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate random string
 */
// Async utilities
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ===== DATE UTILITIES =====
// Date utilities have been moved to date.ts for better organization
// Import from @repo/utils/date for date-related functions

/**
 * Check if date is expired
 */
export function isExpired(
  expiryDate: Date | string,
  bufferMinutes = 0
): boolean {
  const expiry =
    typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;

  if (isNaN(expiry.getTime())) {
    throw ErrorFactory.createValidationError(
      `Invalid expiry date: ${expiryDate}`,
      { operation: "check_expiry" }
    );
  }

  const now = new Date();
  const buffer = bufferMinutes * 60 * 1000; // Convert to milliseconds

  return now.getTime() > expiry.getTime() - buffer;
}

// ===== PERFORMANCE UTILITIES =====

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ===== RESULT TYPE UTILITIES =====

/**
 * Result type for better error handling
 */
export type Result<T, E = ApplicationError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create success result
 */
export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create error result
 */
export function createError<E = ApplicationError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: { operation: string; component?: string }
): Promise<Result<T>> {
  try {
    const data = await operation();
    return createSuccess(data);
  } catch (error) {
    const appError = ErrorFactory.fromError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return createError(appError);
  }
}

/**
 * Safe sync operation wrapper
 */
export function safeSync<T>(
  operation: () => T,
  context: { operation: string; component?: string }
): Result<T> {
  try {
    const data = operation();
    return createSuccess(data);
  } catch (error) {
    const appError = ErrorFactory.fromError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return createError(appError);
  }
}
