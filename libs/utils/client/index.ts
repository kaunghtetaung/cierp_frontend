// Client-side utilities index
export * from "./dom";
export * from "./domain";
export * from "./auth";
export * from "./api";
export * from "./content";

// Re-export selected common utilities (avoiding conflicts)
export * from "../common/date";
export * from "../common/security";
export * from "../common/formatters";
export * from "../common/localization";
export * from "../common/error-factory";
export * from "../common/error-reporter";
export * from "../common/constants";
export * from "../common/validation";

// Re-export specific non-conflicting items from common
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
  toCamelCase,
  toSnakeCase,
  truncate,
} from "../common/object-utils";

export {
  isValidUrl,
  parseQueryParams,
  joinPaths,
  createUrl,
  getCurrentUrlParams,
  removeQueryParams,
  updateQueryParams,
  isAbsoluteUrl,
  isRelativeUrl,
  isExternalUrl,
  getDomain,
  getProtocol,
  getPathname,
  sanitizeUrl,
  createSafeRedirectUrl,
  getFileExtension,
  isImageUrl,
  isVideoUrl,
  isAudioUrl,
  normalizeUrl,
} from "../common/url";

// Toast utilities (client-side only)
export * from "../toast";
