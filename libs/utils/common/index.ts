// Common utilities index - shared between client and server
export * from "./constants";
export * from "./validation";
export * from "./url";
export * from "./security";
export * from "./formatters";
export * from "./localization";
export * from "./styles";

// Date utilities
export * from "./date";

// Object utilities (excluding isExpired to avoid conflict with date.ts)
export {
  sleep,
  withTimeout,
  retry,
  pick,
  omit,
  deepMerge,
  deepClone,
  isNotNullish,
  isNotEmpty,
  isNotEmptyArray,
  isNotEmptyObject,
  validateRequiredFields,
  toCamelCase,
  toSnakeCase,
  truncate,
  safeAsync,
} from "./object-utils";

// Error handling utilities (excluding ERROR_CODES to avoid conflict with constants.ts)
export type {
  ErrorSeverity,
  ErrorCategory,
  ErrorReporter,
} from "./error-types";

export { ERROR_CONSTANTS } from "./error-types";

// Export ApplicationError class (not type) from error-factory
export { ApplicationError, ErrorFactory } from "./error-factory";
export * from "./error-reporter";

// Structured logging for Loki compatibility
export * from "./logger";

// Re-export commonly used items with aliases for backward compatibility
export { generateSecureRandomString as generateRandomString } from "./security";
