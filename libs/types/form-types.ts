/**
 * Form field and validation types for module schema system
 */

import { MultilingualText } from './module-schema';

// Field types supported by the form system
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'checkbox' 
  | 'date' 
  | 'radio' 
  | 'file' 
  | 'textArea' 
  | 'htmlContent';

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

// Form field configuration
export interface FormField {
  fieldName: string;
  fieldType: FieldType;
  validationRule?: ValidationRule;
  placeHolder?: string;
  label: MultilingualText;
  options?: SelectOption[]; // For select, radio fields
  dependency?: FieldDependency; // For dependent select fields
  multiple?: boolean; // For select fields that allow multiple selection
  accept?: string; // For file fields (e.g., "image/*", ".pdf,.doc")
  rows?: number; // For textArea fields
  readonly?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
}