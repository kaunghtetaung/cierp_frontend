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
  | 'phone'
  | 'select'
  | 'multiSelect'
  | 'dynamicSelect'
  | 'dependentSelect'
  | 'multiDependentSelect'
  | 'typeaheadSelect'
  | 'checkbox'
  | 'boolean'
  | 'date'
  | 'radio'
  | 'file'
  | 'mediaBrowser'      // Single file selection with media browser dialog
  | 'mediaGallery'      // Multiple file selection with media browser dialog
  | 'mediaUploader'     // Upload + browse combo
  | 'textArea'
  | 'htmlContent'
  | 'icon'
  | 'nrcField'
  | 'arrayField';

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
  
  // Phone-specific validation options
  e164?: boolean; // Require E.164 format (+[country][number])
  phoneCountry?: string; // Default country for phone validation (e.g., 'US', 'MM')
  allowInternational?: boolean; // Allow international phone numbers (default: true)
  
  // Password strength options
  showStrengthIndicator?: boolean; // Show password strength meter for password fields
  strengthMeterConfig?: PasswordStrengthConfig; // Custom strength requirements
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
  serviceName?: string; // Service name for cross-service references (e.g., 'core', 'library')
  
  // Typeahead configuration (for typeaheadSelect fields)
  enableTypeahead?: boolean; // Enable typeahead functionality
  minSearchLength?: number; // Minimum characters before search (default: 2)
  debounceMs?: number; // Debounce delay in milliseconds (default: 300)
  searchParam?: string; // Query parameter name for search (default: 'search')
  emptyMessage?: string; // Message when no results found
  
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

// Quick Entry configuration for inline entity creation
export interface QuickEntryConfig {
  enabled?: boolean; // Enable quick entry feature (default: false)
  endpoint?: string; // API endpoint for creating new entity (e.g., '/authors', '/publishers')
  modalTitle?: MultilingualText; // Custom title for quick entry dialog
  modalSize?: 'sm' | 'md' | 'lg' | 'xl'; // Modal size (default: 'sm')
  fields: QuickEntryField[]; // Fields to show in quick entry form
  defaultValues?: Record<string, any>; // Default values for new entity (from backend)
  serviceName?: string; // Service name for cross-service creation
  refreshOnCreate?: boolean; // Refresh dropdown options after creation (default: true)
  autoSelect?: boolean; // Auto-select newly created item (default: true)
}

// Quick Entry field configuration
export interface QuickEntryField {
  fieldName: string; // Field name in target module
  fieldType: 'text' | 'email' | 'textArea' | 'number' | 'select'; // Supported field types for quick entry
  label: MultilingualText;
  placeHolder?: string;
  required?: boolean;
  defaultValue?: unknown;
  validationRule?: Partial<ValidationRule>; // Simplified validation for quick entry
  options?: SelectOption[]; // For select fields
}

// Phone field configuration
export interface PhoneFieldConfig {
  defaultCountry?: string; // Default country code (e.g., 'US', 'MM')
  preferredCountries?: string[]; // Countries to show at top of dropdown
  onlyCountries?: string[]; // Restrict to specific countries
  excludeCountries?: string[]; // Countries to exclude
  showDialingCode?: boolean; // Show country dialing code (default: true)
  showCountryFlag?: boolean; // Show country flag (default: true)
  placeholder?: string; // Custom placeholder text
  format?: 'international' | 'national' | 'e164'; // Display format (default: 'international')
  autoFormat?: boolean; // Auto-format as user types (default: true)
  validateOnChange?: boolean; // Validate on every change (default: false)
  enableSearch?: boolean; // Enable country search (default: true)
}

// NRC field configuration
export interface NrcFieldConfig {
  defaultState?: number; // Default state/region code (1-14)
  strictTownshipValidation?: boolean; // Enable strict township code validation (default: false)
  showFormatHelper?: boolean; // Show format example and help text (default: true)
  currentLanguage?: string; // Current language for labels ('en' | 'mm')
  allowFreeForm?: boolean; // Allow custom free-form NRC entry (default: true)
}

// Media browser configuration
export interface MediaBrowserConfig {
  // Selection behavior
  selectionMode?: 'single' | 'multiple';  // Single or multiple file selection (default: 'single' for mediaBrowser, 'multiple' for mediaGallery)
  maxFiles?: number;                      // Maximum files for multiple selection (default: 10)

  // File filtering
  allowedTypes?: string[];                // MIME types (e.g., ['image/*', 'application/pdf'])
  allowedExtensions?: string[];           // File extensions (e.g., ['.jpg', '.png', '.pdf'])
  maxFileSize?: number;                   // Maximum file size in bytes (e.g., 5242880 = 5MB)

  // Folder access
  basePath?: string;                      // Starting folder (e.g., 'public', 'private/common', 'personal')
  allowFolderNavigation?: boolean;        // Allow navigating folders (default: true)
  restrictToPath?: boolean;               // Restrict to basePath only (default: false)
  allowedFolders?: string[];              // Specific folders user can access (e.g., ['public', 'private/common'])

  // Upload behavior
  allowUpload?: boolean;                  // Allow uploading new files (default: true)
  uploadPath?: string;                    // Where to upload new files (default: basePath)

  // UI customization
  viewMode?: 'grid' | 'list';            // Default view mode (default: 'grid')
  dialogSize?: 'md' | 'lg' | 'xl' | 'full';  // Dialog size (default: 'xl')
  showFolderTree?: boolean;               // Show folder tree sidebar (default: true)
  showPreview?: boolean;                  // Show file preview (default: true)

  // Return value format
  returnFormat?: 'url' | 'key' | 'object';  // What to return as field value (default: 'url')
  // 'url': Full URL (e.g., "https://s3.../file.pdf")
  // 'key': S3 key (e.g., "core/public/file.pdf")
  // 'object': Full file object { key, url, name, size, type, thumbnail }

  // Signed URL configuration (for private files)
  useSignedUrl?: boolean;                     // Force signed URL for private files (default: true)
  signedUrlExpiry?: number;                   // Default expiry in seconds (default: 604800 * 520 = ~10 years)
  allowExpirySelection?: boolean;             // Show dropdown to select expiry time (default: false)
  expiryOptions?: Array<{ label: string; value: number }>; // Custom expiry options
  // Default options: [Permanent (~10 years), 1 Month (30 days), 1 Year (365 days)]
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
    serviceName?: string; // Optional service name for cross-service references (e.g., 'core', 'library')
    dependentField?: string;
    labelField?: string;
    valueField?: string;
    enableTypeahead?: boolean;
    minSearchLength?: number;
    debounceMs?: number;
    searchParam?: string;
    emptyMessage?: string;
    [key: string]: any;
  };
  
  // Phone field configuration (for fieldType: 'phone')
  phoneConfig?: PhoneFieldConfig; // Configuration for phone input fields

  // NRC field configuration (for fieldType: 'nrcField')
  nrcConfig?: NrcFieldConfig; // Configuration for Myanmar NRC input fields

  // Media browser configuration (for fieldType: 'mediaBrowser', 'mediaGallery', 'mediaUploader')
  mediaBrowserConfig?: MediaBrowserConfig; // Configuration for media file browser

  // Quick Entry configuration for dynamic fields
  quickEntry?: QuickEntryConfig; // Configuration for inline entity creation
  
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

  // Array field support
  children?: FormField[]; // Child fields for arrayField type
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

// Password strength configuration
export interface PasswordStrengthConfig {
  minLength?: number; // Minimum password length (default: 8)
  requireUppercase?: boolean; // Require uppercase letters (default: true)
  requireLowercase?: boolean; // Require lowercase letters (default: true)
  requireNumbers?: boolean; // Require numbers (default: true)
  requireSpecialChars?: boolean; // Require special characters (default: true)
  specialChars?: string; // Custom special characters set (default: @$!%*?&)
  showRequirements?: boolean; // Show detailed requirements list (default: true)
  showStrengthMeter?: boolean; // Show visual strength meter (default: true)
  strengthLabels?: {
    weak: MultilingualText;
    medium: MultilingualText;
    strong: MultilingualText;
  };
  requirementMessages?: {
    minLength: MultilingualText;
    uppercase: MultilingualText;
    lowercase: MultilingualText;
    numbers: MultilingualText;
    specialChars: MultilingualText;
  };
}

// Password strength validation result
export interface PasswordStrengthResult {
  score: number; // 0-100 strength score
  level: 'weak' | 'medium' | 'strong'; // Strength level
  requirements: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
  errors: string[]; // List of validation errors
  isValid: boolean; // Overall validation result
}