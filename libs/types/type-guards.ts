/**
 * Type guards and utility functions for module schema validation
 */

import { 
  ModuleSchema, 
  InitializeResponseDto, 
  ModuleInfoDto,
  ModuleSchemaDto 
} from './module-schema-interfaces';
import { FormField } from './form-types';
import { DataTableSchema } from './table-types';
import { MultilingualText } from './module-schema';

// Type guard for MultilingualText
export const isMultilingualText = (obj: any): obj is MultilingualText => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.en === 'string' &&
    typeof obj.mm === 'string'
  );
};

// Type guard for FormField
export const isFormField = (obj: any): obj is FormField => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.fieldName === 'string' &&
    typeof obj.fieldType === 'string' &&
    isMultilingualText(obj.label)
  );
};

// Type guard for DataTableSchema
export const isDataTableSchema = (obj: any): obj is DataTableSchema => {
  // Allow parent container modules with minimal dataTableSchema (no layout, no actions)
  if (obj && typeof obj === 'object' && Array.isArray(obj.columns)) {
    // If columns is empty, this is likely a parent container - allow it
    if (obj.columns.length === 0) {
      return true;
    }
    // If columns exist, require full schema
    return (
      typeof obj.layout === 'string' &&
      obj.actions &&
      typeof obj.actions === 'object'
    );
  }
  return false;
};

// Type guard for ModuleSchema
export const isModuleSchema = (obj: any): obj is ModuleSchema => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    isMultilingualText(obj.name) &&
    typeof obj.slug === 'string' &&
    typeof obj.serviceName === 'string' &&
    isMultilingualText(obj.description) &&
    typeof obj.iconName === 'string' &&
    typeof obj.formLayout === 'string' &&
    Array.isArray(obj.formFields) &&
    obj.formFields.every(isFormField) &&
    isDataTableSchema(obj.dataTableSchema) &&
    Array.isArray(obj.extraActionForms)
  );
};

// Type guard for InitializeResponseDto
export const isInitializeResponse = (obj: any): obj is InitializeResponseDto => {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.modules) &&
    obj.modules.every(isModuleSchema) &&
    typeof obj.serviceName === 'string' &&
    typeof obj.timestamp === 'string' &&
    Array.isArray(obj.supportedLanguages)
  );
};

// Type guard for ModuleInfoDto
export const isModuleInfo = (obj: any): obj is ModuleInfoDto => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.serviceName === 'string' &&
    Array.isArray(obj.modules) &&
    obj.modules.every(isModuleSchema)
  );
};

// Type guard for ModuleSchemaDto
export const isModuleSchemaDto = (obj: any): obj is ModuleSchemaDto => {
  return (
    obj &&
    typeof obj === 'object' &&
    isModuleSchema(obj.module)
  );
};

// Utility function to validate API response structure
export const validateApiResponse = <T>(
  data: unknown,
  typeGuard: (obj: any) => obj is T
): T | null => {
  try {
    if (typeGuard(data)) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('API response validation failed:', error);
    return null;
  }
};

// Utility function to safely access multilingual text
export const getLocalizedText = (
  text: MultilingualText | undefined,
  language: 'en' | 'mm' = 'en'
): string => {
  if (!text || !isMultilingualText(text)) {
    return '';
  }
  return text[language] || text.en || '';
};

// Utility function to find module by slug
export const findModuleBySlug = (
  modules: ModuleSchema[],
  slug: string
): ModuleSchema | undefined => {
  return modules.find(module => module.slug === slug);
};

// Utility function to get modules by service name
export const getModulesByService = (
  modules: ModuleSchema[],
  serviceName: string
): ModuleSchema[] => {
  return modules.filter(module => module.serviceName === serviceName);
};