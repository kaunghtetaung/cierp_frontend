/**
 * Base types for module schema system
 * Used for Next.js server-side and backend /app/initialize service
 */

// Supported languages in the system
export type SupportedLanguage = 'en' | 'mm';

// Core module names
export type CoreModuleName = 'applications' | 'organizations' | 'departments' | 'users' | 'roles' | 'groups';

// Lucide icon names with string fallback for flexibility
export type LucideIconName = 
  | 'Building2' | 'Building' | 'Layout' | 'User' | 'Crown' | 'Users' | 'Settings'
  | 'KeyRound' | 'UserCog' | 'Mail' | 'Phone' | 'Calendar' | 'Clock' | 'Edit' | 'edit'
  | 'Trash' | 'Eye' | 'Plus' | 'Minus' | 'Search' | 'Filter' | 'Save' | 'Cancel'
  | 'delete' | 'view' | string;

// Multilingual text interface
export interface MultilingualText {
  en: string;
  mm: string;
  [key: string]: string;
}

// HTTP methods for API operations
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Button styles for UI actions
export type ButtonStyle = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

// Service names in the system
export type ServiceName = 'Core' | string;