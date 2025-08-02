// App Schema Package - Next.js Server-side only
// This package handles Core module schemas from /core/initialize endpoint
// For form configurations, table schemas, access policies, and module definitions

export * from './wrapper';
export * from './appSchema.service';

// Primary exports for module schemas
export {
  getModuleSchemas,
  getModules,
  getModuleBySlug,
  getModulesByService,
  getSupportedLanguages,
  getServiceInfo,
  hasModule,
  getModuleFormFields,
  getModuleTableSchema,
  getModuleExtraActions,
  getModuleAccessPolicy,
  validateModuleSchemas,
  clearModuleSchemasCache,
  getLocalizedModuleText,
  getCoreModuleNames,
  isCoreModule,
  getSchemasForRequest,
  getModuleForRequest,
  AppSchemaService,
  AppSchemaWrapper,
  appSchemaWrapper,
  initialize,
  getSchemas,
  getAppSchema
} from './wrapper';

// Service-level exports (with service suffix for clarity)
export {
  getModuleSchemas as getModuleSchemasService,
  getModules as getModulesService,
  getModuleBySlug as getModuleBySlugService,
  getModulesByService as getModulesByServiceService,
  getSupportedLanguages as getSupportedLanguagesService,
  getServiceInfo as getServiceInfoService,
  hasModule as hasModuleService,
  getModuleFormFields as getModuleFormFieldsService,
  getModuleTableSchema as getModuleTableSchemaService,
  getModuleExtraActions as getModuleExtraActionsService,
  getModuleAccessPolicy as getModuleAccessPolicyService,
  validateModuleSchemas as validateModuleSchemasService,
  clearModuleSchemasCache as clearModuleSchemasCacheService,
  getLocalizedModuleText as getLocalizedModuleTextService,
  getCoreModuleNames as getCoreModuleNamesService,
  isCoreModule as isCoreModuleService
} from './appSchema.service';

// Module Schema Types (from @repo/types)
export type {
  InitializeResponseDto,
  ModuleSchema,
  SupportedLanguage,
  CoreModuleName,
  FormField,
  DataTableSchema,
  ExtraActionForm,
  ModuleAccessPolicy,
  MultilingualText,
  FieldType,
  FormLayout,
  ValidationRule,
  SelectOption,
  FieldDependency,
  TableLayout,
  TableColumn,
  TableColumnType,
  TableAction,
  ExtraAction,
  TableActions,
  PaginationConfig,
  SortingConfig,
  FilteringConfig,
  ActionType,
  ExtraActionFormType,
  ButtonStyle,
  HttpMethod,
  LucideIconName,
  ServiceName,
  AccessOperation,
  RoleAccessPolicy,
  QueryAllowedField,
  SystemRole
} from '@repo/types';

// Legacy aliases for backward compatibility
export { getModuleSchemas as getAppSchemas } from './appSchema.service';
export { getModuleSchemas as getInitializeData } from './appSchema.service';
export { clearModuleSchemasCache as clearAppSchemaCache } from './appSchema.service';

// Constants
export const APP_SCHEMA_MODULE_VERSION = '1.0.0';
export const APP_SCHEMA_PURPOSE = 'Core module schemas (forms, tables, access policies) - Server-side only';
export const CORE_MODULES = ['applications', 'organizations', 'departments', 'users', 'roles', 'groups'] as const;
export const SUPPORTED_LANGUAGES = ['en', 'mm'] as const;

// Configuration constants
export const DEFAULT_CACHE_TTL = 60 * 60 * 24; // 24 hours
export const API_ENDPOINT = '/core/initialize';
export const SERVICE_NAME = 'Core';

// Re-export core type utilities
export {
  isInitializeResponse,
  isModuleSchema,
  findModuleBySlug,
  getModulesByService as getModulesByServiceUtil,
  getLocalizedText,
  validateApiResponse,
  isMultilingualText,
  isFormField,
  isDataTableSchema,
  isModuleInfo,
  isModuleSchemaDto
} from '@repo/types';