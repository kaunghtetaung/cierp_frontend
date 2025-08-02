/**
 * Main module schema interfaces and response types
 */

import { MultilingualText, LucideIconName, ServiceName, SupportedLanguage } from './module-schema';
import { FormLayout, FormField } from './form-types';
import { DataTableSchema, ExtraActionForm } from './table-types';
import { ModuleAccessPolicy } from './access-policy-types';

// Module schema interface
export interface ModuleSchema {
  id: number; // Unique module identifier
  name: MultilingualText;
  slug: string; // controller route
  serviceName: ServiceName;
  description: MultilingualText;
  iconName: LucideIconName; // Lucide icon name for UI display
  
  // Form configuration
  formLayout: FormLayout;
  customLayoutName?: string; // optional for custom layouts
  formFields: FormField[];
  
  // Data table configuration
  dataTableSchema: DataTableSchema;
  
  // Extra action forms for custom operations beyond CRUD
  extraActionForms: ExtraActionForm[];
  
  // Module access policy for role-based permissions (only included in initialize endpoint)
  moduleAccessPolicy?: ModuleAccessPolicy;
}

// Service module information response
export interface ModuleInfoDto {
  serviceName: ServiceName;
  modules: ModuleSchema[];
}

// Single module schema response
export interface ModuleSchemaDto {
  module: ModuleSchema;
}

/**
 * Initialize endpoint response with strong typing for Next.js server-side consumption
 * 
 * This interface provides complete type safety for the /initialize endpoint response.
 * Server-side applications can use this to get full TypeScript support for:
 * 
 * @example
 * ```typescript
 * import { InitializeResponseDto, CoreModuleName, LucideIconName } from '@/libs/types';
 * 
 * const response: InitializeResponseDto = await fetch('/initialize').then(r => r.json());
 * 
 * // Access module schemas with full type safety
 * const userModule = response.modules.find(m => m.slug === 'users');
 * const iconName: LucideIconName = userModule?.iconName;
 * const formFields = userModule?.formFields;
 * const extraActions = userModule?.extraActionForms;
 * ```
 */
export interface InitializeResponseDto {
  // Array of all core module schemas with access policies
  modules: readonly ModuleSchema[];
  // Service metadata
  serviceName: ServiceName;
  // Timestamp of when the response was generated
  timestamp: string; // ISO 8601 format
  // Available languages in the system
  supportedLanguages: readonly SupportedLanguage[];
}

// Complete initialize response class for server-side usage
export class InitializeResponse implements InitializeResponseDto {
  readonly modules: readonly ModuleSchema[];
  readonly serviceName: ServiceName;
  readonly timestamp: string;
  readonly supportedLanguages: readonly SupportedLanguage[] = ['en', 'mm'];

  constructor(serviceName: ServiceName, modules: ModuleSchema[]) {
    this.serviceName = serviceName;
    this.modules = Object.freeze(modules);
    this.timestamp = new Date().toISOString();
  }
}

// DTO class for service module information
export class ModuleInfo implements ModuleInfoDto {
  constructor(
    public readonly serviceName: ServiceName,
    public readonly modules: ModuleSchema[]
  ) {}
}

// DTO class for single module schema
export class ModuleSchemaResponse implements ModuleSchemaDto {
  constructor(public readonly module: ModuleSchema) {}
}