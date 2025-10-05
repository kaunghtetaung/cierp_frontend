/**
 * Table schema and action types for module schema system
 */

import { MultilingualText, LucideIconName, ButtonStyle, HttpMethod } from './module-schema';

// Table layout configuration
export type TableLayout = 'withCheckbox' | 'withSelect' | 'standard';

// Table column types
export type TableColumnType = 'text' | 'date' | 'boolean' | 'number' | 'image' | 'status' | 'icon' | 'reference';

// Action types for table operations
export type ActionType = 'modal' | 'page' | 'inline';

// Form types for extra actions
export type ExtraActionFormType = 'modal' | 'page' | 'drawer';

// Extra action form approach
export type ExtraActionFormApproach = 'schema-driven' | 'pre-built' | 'hybrid';

// Populate configuration for reference fields
export interface PopulateConfig {
  path: string; // Reference field to populate
  select: string; // Fields to select from referenced document
  displayField: string; // Specific field to display from populated data
  isMultilingual: boolean; // Whether the display field supports multiple languages
}

// Array display configuration for array fields
export interface ArrayDisplayConfig {
  field: string; // Nested field path to display (e.g., "batchId.name", "name")
  separator?: string; // Separator between array items (default: ", ")
}

// Table column configuration
export interface TableColumn {
  fieldName: string;
  label: MultilingualText;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: TableColumnType;
  format?: string; // For date formatting, etc.
  populate?: PopulateConfig; // Configuration for populated reference fields
  isArray?: boolean; // Whether this field contains an array
  arrayDisplay?: ArrayDisplayConfig; // Configuration for displaying array items
}

// Base table action configuration
export interface TableAction {
  type: ActionType;
  label: MultilingualText;
  icon?: LucideIconName;
  permission?: string; // Required permission to show this action
}

// Extra table actions (custom actions beyond CRUD)
export interface ExtraAction extends TableAction {
  actionKey: string; // Unique identifier for the action
  endpoint?: string; // Custom endpoint for the action
  confirmMessage?: MultilingualText;
}

// Table actions container
export interface TableActions {
  edit?: TableAction;
  delete?: TableAction;
  view?: TableAction;
  extraActions?: ExtraAction[];
}

// Pagination configuration
export interface PaginationConfig {
  enabled: boolean;
  defaultLimit: number;
  allowedLimits: number[];
  isClientSidePaging?: boolean; // If true, use client-side pagination; if false/undefined, use server-side
}

// Sorting configuration
export interface SortingConfig {
  enabled: boolean;
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Filtering configuration
export interface FilteringConfig {
  enabled: boolean;
  searchFields?: string[];
}

// Data table schema configuration
export interface DataTableSchema {
  layout: TableLayout;
  columns: TableColumn[];
  actions: TableActions;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
}

// Form validation configuration
export interface FormValidationConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

// Extra action form configuration for custom module operations
export interface ExtraActionForm {
  actionKey: string; // Unique identifier for the action (e.g., 'resetPassword', 'assignRoles')
  title: MultilingualText;
  description?: MultilingualText;
  iconName?: LucideIconName;
  endpoint: string; // API endpoint for the action
  method: HttpMethod;
  formType: ExtraActionFormType;
  
  // Form approach configuration
  formApproach?: ExtraActionFormApproach; // Defaults to 'schema-driven' for backend compatibility
  formName?: string; // Pre-built form component name (required for 'pre-built' approach)
  formFields?: import('./form-types').FormField[]; // Schema-driven form fields (required for 'schema-driven' approach)
  formLayout?: import('./form-types').FormLayout; // Form layout for schema-driven forms
  formValidation?: FormValidationConfig; // Validation configuration
  
  // UI configuration
  submitButtonText?: MultilingualText; // Custom submit button text
  cancelButtonText?: MultilingualText; // Custom cancel button text
  formWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; // Modal/drawer width
  showProgress?: boolean; // Show progress indicator during submission
  
  // Behavior configuration
  requiresSelection?: boolean; // Whether this action requires selecting items first
  confirmMessage?: MultilingualText; // Confirmation message before executing action
  permission?: string; // Required permission to access this action
  buttonStyle?: ButtonStyle; // Visual style of the action button (primary, secondary, warning, etc.)
}