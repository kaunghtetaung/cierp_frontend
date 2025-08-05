/**
 * Form field and validation types for module schema system
 */

import { MultilingualText } from './module-schema';

// Field types supported by the form system
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number'
  | 'select' 
  | 'multiSelect'
  | 'checkbox' 
  | 'boolean'
  | 'date' 
  | 'radio' 
  | 'file' 
  | 'textArea' 
  | 'htmlContent'
  | 'icon';

// Form layout options
export type FormLayout = 
  | 'horizontal' 
  | 'vertical' 
  | 'wizard-horizontal' 
  | 'wizard-vertical' 
  | 'custom';

// Validation rule interface with multilingual error messages
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  errorMessage: MultilingualText;
}

// Select field option
export interface SelectOption {
  label: MultilingualText;
  value: unknown;
}

// Field dependency configuration for select fields
export interface FieldDependency {
  dependsOn: string;
  values: Record<string, unknown[]>; // Map of parent field values to child field options
}

// Dropdown configuration for dynamic select fields
export interface DropdownConfig {
  type: 'static' | 'dynamic';
  multiple?: boolean; // Allow multiple selections
  searchable?: boolean; // Allow searching through options
  clearable?: boolean; // Allow clearing selection
  preloadData?: boolean; // Preload data on component mount
  refPath?: string; // API endpoint for dynamic data (e.g., "/organizations/ref")
  dependsOn?: string[]; // Field names this dropdown depends on
  queryParams?: string[]; // Query parameter names to pass dependency values
  options?: SelectOption[]; // Static options for static type
}

// Form field configuration
export interface FormField {
  fieldName: string;
  fieldType: FieldType;
  validationRule?: ValidationRule;
  placeHolder?: string;
  label: MultilingualText;
  options?: SelectOption[]; // For select, radio fields (deprecated - use dropdownConfig.options)
  dependency?: FieldDependency; // For dependent select fields (deprecated - use dropdownConfig)
  multiple?: boolean; // For select fields that allow multiple selection (deprecated - use dropdownConfig.multiple)
  accept?: string; // For file fields (e.g., "image/*", ".pdf,.doc")
  rows?: number; // For textArea fields
  readonly?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  stepId?: string; // For wizard forms - group fields by step ID (optional)
  isMultiLang?: boolean; // For multi-language input fields
  dropdownConfig?: DropdownConfig; // Advanced dropdown configuration for select fields
}

// Wizard step metadata
export interface WizardStep {
  id: string;
  title: MultilingualText;
  description?: MultilingualText;
  icon?: string;
  order?: number;
  fields: FormField[];
}

// Enhanced module schema for wizard forms
export interface WizardFormConfig {
  steps?: WizardStep[]; // Explicit step definitions (optional)
}