import type { ModuleSchema, FormField } from '@repo/types';

/**
 * Pass-through function to maintain backward compatibility
 * Since backend now includes isMultiLang flag, no processing needed
 */
export function enableCommonMultilangFields(module: ModuleSchema): ModuleSchema {
  // Backend now provides isMultiLang flag directly, return as-is
  return module;
}