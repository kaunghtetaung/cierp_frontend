/**
 * Table schema and action types for module schema system
 */

import { MultilingualText, LucideIconName, ButtonStyle, HttpMethod } from './module-schema';

// Table layout configuration
export type TableLayout = 'withCheckbox' | 'withSelect' | 'standard';

// Table column types
export type TableColumnType = 'text' | 'date' | 'boolean' | 'number' | 'image' | 'status';

// Action types for table operations
export type ActionType = 'modal' | 'page' | 'inline';

// Form types for extra actions
export type ExtraActionFormType = 'modal' | 'page' | 'drawer';

// Table column configuration
export interface TableColumn {
  fieldName: string;
  label: MultilingualText;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: TableColumnType;
  format?: string; // For date formatting, etc.
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

// Extra action form configuration for custom module operations
export interface ExtraActionForm {
  actionKey: string; // Unique identifier for the action (e.g., 'resetPassword', 'assignRoles')
  title: MultilingualText;
  description?: MultilingualText;
  iconName?: LucideIconName;
  endpoint: string; // API endpoint for the action
  method: HttpMethod;
  formType: ExtraActionFormType;
  formName: string; // Pre-built form component name for frontend (e.g., 'userPwdChangeForm', 'RoleAssignForm')
  requiresSelection?: boolean; // Whether this action requires selecting items first
  confirmMessage?: MultilingualText;
  permission?: string; // Required permission to access this action
  buttonStyle?: ButtonStyle;
}