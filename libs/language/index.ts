// Language service public API
// Main entry point for language service functionality

// Explicitly re-export types
export type {
  Language,
  LanguageServiceConfig,
  LanguageServiceInterface,
  LanguageChangeRequest,
  LanguageChangeResponse,
  LanguageGetResponse,
} from "./types";

// Explicitly re-export config and utils
export * from "./config";
export * from "./utils";

// Explicitly re-export the service and its instance
export * from "./service";

// Language Provider and Hook
export { LanguageProvider, useLanguage } from "./LanguageProvider";

// Re-export for convenience
export { LanguageService, languageService } from "./service";
export {
  DEFAULT_LANGUAGES,
  DEFAULT_CONFIG,
  createLanguageConfig,
} from "./config";
