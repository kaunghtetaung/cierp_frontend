/**
 * Form field and validation types for module schema system
 */

import { MultilingualText } from './module-schema';

// Field types supported by the form system - Complete 13 field types
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number'
  | 'select' 
  | 'multiSelect'
  | 'dynamicSelect'
  | 'dependentSelect'
  | 'multiDependentSelect'
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
  pattern?: string; // Regex pattern for validation
  min?: number; // For number/date fields
  max?: number; // For number/date fields
  minDate?: string; // For date fields (ISO string)
  maxDate?: string; // For date fields (ISO string)
  fileSize?: number; // For file fields - max size in bytes
  fileTypes?: string[]; // For file fields - allowed file extensions
  custom?: string; // Custom validation function name
  errorMessage: MultilingualText;
  
  // Additional validation options
  email?: boolean; // Email format validation
  url?: boolean; // URL format validation  
  phone?: boolean; // Phone number validation
  alphanumeric?: boolean; // Only letters and numbers
  numeric?: boolean; // Only numbers
  noWhitespace?: boolean; // No whitespace allowed
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

// Dropdown configuration for all select-type fields
export interface DropdownConfig {
  type: 'static' | 'dynamic' | 'dependent';
  
  // Selection behavior
  multiple?: boolean; // Allow multiple selections
  searchable?: boolean; // Allow searching through options
  clearable?: boolean; // Allow clearing selection
  placeholder?: MultilingualText; // Custom placeholder text
  
  // Static configuration (for type: 'static')
  options?: SelectOption[]; // Static options
  
  // Dynamic configuration (for type: 'dynamic')
  refPath?: string; // API endpoint for dynamic data (e.g., "/organizations/ref")
  preloadData?: boolean; // Preload data on component mount
  labelField?: string; // Field name for option labels (default: 'displayName')
  valueField?: string; // Field name for option values (default: '_id')
  
  // Dependent configuration (for type: 'dependent')
  dependsOn?: string[]; // Field names this dropdown depends on
  queryParams?: string[]; // Query parameter names to pass dependency values
  dependencyMap?: Record<string, SelectOption[]>; // Static dependency mapping for offline use
  
  // UI customization
  maxHeight?: number; // Maximum dropdown height in pixels
  optionTemplate?: string; // Custom option template name
  
  // Data transformation
  transformResponse?: string; // Function name to transform API response
  filterOptions?: string; // Function name to filter options
}

// Form field configuration
export interface FormField {
  fieldName: string;
  fieldType: FieldType;
  validationRule?: ValidationRule;
  placeHolder?: string;
  label: MultilingualText;
  
  // Select/Radio field options (for static types)
  options?: SelectOption[]; // For select, radio fields (deprecated - use dropdownConfig.options)
  
  // Field dependency configuration (deprecated - use dropdownConfig)
  dependency?: FieldDependency; // For dependent select fields (deprecated - use dropdownConfig)
  
  // Advanced dropdown configuration (for select, dynamicSelect, dependentSelect)
  dropdownConfig?: DropdownConfig; // Preferred configuration for all select-type fields
  
  // Data source configuration (backend format)
  dataSource?: {
    endpoint: string;
    method?: 'GET' | 'POST';
    dependentField?: string;
    labelField?: string;
    valueField?: string;
    [key: string]: any;
  };
  
  // Field-specific configurations
  multiple?: boolean; // For select fields that allow multiple selection (deprecated - use dropdownConfig.multiple)
  accept?: string; // For file fields (e.g., "image/*", ".pdf,.doc")
  rows?: number; // For textArea fields
  cols?: number; // For textArea fields
  maxFiles?: number; // For file fields - maximum number of files
  fileSize?: number; // For file fields - maximum file size in bytes
  
  // Field behavior
  readonly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean; // Quick required flag (also available in validationRule)
  
  // Default and initial values
  defaultValue?: unknown;
  
  // Wizard form support
  stepId?: string; // For wizard forms - group fields by step ID (optional)
  
  // Multi-language support
  isMultiLang?: boolean; // For multi-language input fields
  
  // UI customization
  className?: string; // Custom CSS classes
  style?: Record<string, unknown>; // Inline styles
  helperText?: MultilingualText; // Helper text to display below field
  
  // Field ordering and grouping
  order?: number; // Field display order
  group?: string; // Field group for organizing related fields
}

// Wizard step metadata
export interface WizardStep {
  id: string;
  stepKey: string; // Unique step identifier for rendering
  title: MultilingualText;
  description?: MultilingualText;
  icon?: string;
  order?: number;
  fields: string[]; // Field names to include in this step
}

// Wizard validation configuration
export interface WizardValidationConfig {
  validateOnStepChange?: boolean; // Validate when moving between steps
  validateAllOnSubmit?: boolean; // Validate all steps before final submission
  showValidationSummary?: boolean; // Show validation summary on final step
}

// Wizard navigation configuration
export interface WizardNavigationConfig {
  allowBackNavigation?: boolean; // Allow going back to previous steps
  allowSkipSteps?: boolean; // Allow skipping to any step
  showProgressBar?: boolean; // Show progress indicator
  showStepNumbers?: boolean; // Show step numbering
  showStepTitles?: boolean; // Show step titles in navigation
  showStepDescription?: boolean; // Show step descriptions
}

// Wizard theme configuration
export interface WizardThemeConfig {
  stepLayout?: 'horizontal' | 'vertical'; // Layout of step navigation
  showIcons?: boolean; // Show step icons
  compactMode?: boolean; // Use compact styling
}

// Enhanced module schema for wizard forms
export interface WizardFormConfig {
  steps: WizardStep[]; // Step definitions (required for wizard forms)
  validation?: WizardValidationConfig; // Validation behavior
  navigation?: WizardNavigationConfig; // Navigation behavior  
  theme?: WizardThemeConfig; // Theme and styling
}