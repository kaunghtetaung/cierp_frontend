/**
 * Module Schema Editor Types
 * Type definitions for the schema editor module
 */

// Multilingual text interface
export interface MultilingualText {
  en: string;
  mm: string;
  [key: string]: string;
}

// Field types supported by the form system
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'select'
  | 'multiSelect'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'time'
  | 'radio'
  | 'file'
  | 'textArea'
  | 'htmlContent'
  | 'dynamicSelect'
  | 'dependentSelect'
  | 'phone'
  | 'icon'
  | 'number'
  | 'nrcField'
  | 'tel'
  | 'objectField'
  | 'arrayField'
  | 'mediaBrowser'
  | 'mediaGallery'
  | 'mediaUploader';

// Form layout options
export type FormLayout =
  | 'horizontal'
  | 'vertical'
  | 'wizard-horizontal'
  | 'wizard-vertical'
  | 'custom'
  | 'studentWizardForm';

// Table layout configuration
export type TableLayout = 'withCheckbox' | 'withSelect' | 'standard';

// Validation rule interface
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  showStrengthIndicator?: boolean;
  errorMessage?: MultilingualText;
}

// Select field option
export interface SelectOption {
  label: MultilingualText;
  value: unknown;
}

// DataSource configuration for dynamic dropdown fields
export interface DataSource {
  endpoint: string;
  method?: 'GET' | 'POST';
  serviceName?: string;
  dependentField?: string;
  searchParam?: string;
  labelField?: string;
  valueField?: string;
  enableTypeahead?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
  showEmptyMessage?: boolean;
  emptyMessage?: MultilingualText;
  loadInitialData?: boolean;
}

// Field dependency configuration
export interface FieldDependency {
  dependsOn: string;
  values: Record<string, unknown[]>;
}

// Form field configuration
export interface FormField {
  fieldName: string;
  fieldType: FieldType;
  validationRule?: ValidationRule;
  placeHolder?: string | MultilingualText;
  label: MultilingualText;
  description?: MultilingualText;
  helpText?: MultilingualText;
  options?: SelectOption[];
  dependency?: FieldDependency;
  dataSource?: DataSource;
  multiple?: boolean;
  accept?: string;
  rows?: number;
  readonly?: boolean;
  hidden?: boolean;
  hideInEditMode?: boolean;
  defaultValue?: unknown;
  isMultilingual?: boolean;
  layoutHint?: {
    row: number;
    column: number;
    width: 'full' | 'half' | 'third' | 'quarter';
  };
  conditionalVisibility?: {
    dependsOn: string;
    operator: 'equals' | 'notEquals' | 'checked' | 'unchecked' | 'in' | 'notIn';
    value?: unknown;
    action?: 'hide' | 'show' | 'disable' | 'enable';
    copyFrom?: string;
  };
  children?: FormField[];
  groupLabel?: MultilingualText;
  dependsOn?: {
    field: string;
    value: unknown;
  };
}

// Table column type
export type TableColumnType = 'text' | 'date' | 'boolean' | 'number' | 'image' | 'status';

// Table column configuration
export interface TableColumn {
  fieldName: string;
  label: MultilingualText;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: TableColumnType;
  isMultilingual?: boolean;
  format?: string;
  renderAs?: 'text' | 'badge' | 'link' | 'array' | 'list';
  populate?: {
    path: string;
    select?: string;
    displayField?: string;
    isMultilingual?: boolean;
  };
}

// Prefilter field configuration
export interface PrefilterField {
  fieldName: string;
  label: MultilingualText;
  type: 'select' | 'dynamicSelect' | 'dependentSelect' | 'text';
  dataSource?: DataSource;
  options?: SelectOption[];
  defaultValue?: unknown;
  multiple?: boolean;
}

// Prefilter field group
export interface PrefilterFieldGroup {
  groupKey: string;
  groupLabel: MultilingualText;
  fields: PrefilterField[];
  collapsed?: boolean;
}

// Data table schema configuration
export interface DataTableSchema {
  layout: TableLayout;
  columns: TableColumn[];
  actions: {
    edit?: { type: string; label: MultilingualText; icon?: string };
    delete?: { type: string; label: MultilingualText; icon?: string };
    view?: { type: string; label: MultilingualText; icon?: string };
    extraActions?: any[];
  };
  pagination?: {
    enabled: boolean;
    defaultLimit: number;
    allowedLimits: number[];
    isClientSidePaging?: boolean;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    sortAllowedFieldList?: string[];
  };
  filtering?: {
    enabled: boolean;
    searchFields?: string[];
  };
  prefilters?: {
    enabled: boolean;
    displayMode?: 'accordion' | 'tabs';
    fields?: PrefilterField[];
    fieldGroups?: PrefilterFieldGroup[];
  };
}

// Wizard step configuration
export interface WizardStep {
  stepNumber: number;
  stepKey: string;
  title: MultilingualText;
  description?: MultilingualText;
  fields: string[];
  optional?: boolean;
}

// Wizard configuration
export interface WizardConfig {
  steps: WizardStep[];
  navigation?: {
    showStepNumbers?: boolean;
    showProgressBar?: boolean;
    allowStepClick?: boolean;
    showStepLabels?: boolean;
  };
  validation?: {
    validateOnStepChange?: boolean;
    showInlineErrors?: boolean;
    scrollToFirstError?: boolean;
  };
  allowStepReview?: boolean;
  showReviewStep?: boolean;
}

// Access operation configuration
export interface AccessOperation {
  create?: boolean;
  read?: { allow: boolean; restrictInvisibleFields?: boolean };
  update?: { allow: boolean; restrictUnaccessibleFields?: boolean };
  softDelete?: boolean;
  hardDelete?: boolean;
  readSoftDeleted?: { allow: boolean; IsResourceBase?: boolean };
  restoreSoftDeleted?: { allow: boolean; IsResourceBase?: boolean };
  schema?: { allow: boolean; IsResourceBase?: boolean };
}

// Role-based access policy configuration
export interface RoleAccessPolicy {
  operation: AccessOperation;
  unaccessibleFields: string[];
  invisibleFields: string[];
  relatedDataOnly: boolean;
  accessDenied: boolean;
}

// Module access policy configuration
export interface ModuleAccessPolicy {
  resourceIdField: string;
  hasOrganizationField: boolean;
  organizationIdFieldName: string;
  hasDepartmentField: boolean;
  departmentIdFieldName: string;
  queryAllowedFields: {
    fieldName: string;
    fieldType: string;
    operators: string[];
  }[];
  accessPolicy: {
    [roleName: string]: RoleAccessPolicy;
  };
}

// Extra action form configuration
export interface ExtraActionForm {
  actionKey: string;
  title: MultilingualText;
  description?: MultilingualText;
  iconName?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  formType: 'modal' | 'page' | 'drawer';
  formApproach?: 'schema-driven' | 'pre-built' | 'hybrid';
  formName?: string;
  formFields?: FormField[];
  formLayout?: FormLayout;
  requiresSelection?: boolean;
  permission?: string;
  buttonStyle?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

// Detail view field configuration
export interface DetailViewField {
  fieldName: string;
  label: MultilingualText;
  type: FieldType;
  visible: boolean;
  printable: boolean;
  colspan?: number;
  renderAs?: 'text' | 'badge' | 'link' | 'list' | 'table';
  displayFormat?: string;
  isMultilingual?: boolean;
}

// Detail view section
export interface DetailViewSection {
  name: string;
  title: MultilingualText;
  fields: DetailViewField[];
  layout?: 'grid' | 'list' | 'table';
  columns?: number;
  printable?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Detail view schema
export interface DetailViewSchema {
  layout: 'standard' | 'card' | 'tabbed' | 'printable';
  sections: DetailViewSection[];
  printConfig?: {
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showHeader?: boolean;
    showFooter?: boolean;
  };
}

// Complete module schema
export interface ModuleSchema {
  _id?: string;
  id: number;
  name: MultilingualText;
  slug: string;
  serviceName: string;
  description: MultilingualText;
  iconName: string;
  parentModule?: string | null;
  hasDashboard?: boolean;
  formLayout: FormLayout;
  customLayoutName?: string;
  formFields: FormField[];
  wizardConfig?: WizardConfig;
  dataTableSchema: DataTableSchema;
  extraActionForms: ExtraActionForm[];
  detailViewSchema?: DetailViewSchema;
  moduleAccessPolicy?: ModuleAccessPolicy;
  isActive?: boolean;
  version?: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// Create module schema DTO
export interface CreateModuleSchemaDto {
  id?: number;
  name: MultilingualText;
  slug: string;
  serviceName: string;
  description: MultilingualText;
  iconName: string;
  parentModule?: string | null;
  hasDashboard?: boolean;
  formLayout: FormLayout;
  customLayoutName?: string;
  formFields: FormField[];
  wizardConfig?: WizardConfig;
  dataTableSchema: DataTableSchema;
  extraActionForms?: ExtraActionForm[];
  detailViewSchema?: DetailViewSchema;
  moduleAccessPolicy?: ModuleAccessPolicy;
  isActive?: boolean;
  organizationId?: string;
}

// Update module schema DTO
export interface UpdateModuleSchemaDto {
  id?: number;
  name?: MultilingualText;
  slug?: string;
  serviceName?: string;
  description?: MultilingualText;
  iconName?: string;
  parentModule?: string | null;
  hasDashboard?: boolean;
  formLayout?: FormLayout;
  customLayoutName?: string;
  formFields?: FormField[];
  wizardConfig?: WizardConfig;
  dataTableSchema?: DataTableSchema;
  extraActionForms?: ExtraActionForm[];
  detailViewSchema?: DetailViewSchema;
  moduleAccessPolicy?: ModuleAccessPolicy;
  isActive?: boolean;
  organizationId?: string;
  version?: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}

export interface ModuleSchemaListResponse {
  data: ModuleSchema[];
  total?: number;
}

// Available roles for access policy
export const AVAILABLE_ROLES = [
  'systemAdmin',
  'organizationAdmin',
  'departmentAdmin',
  'organizationMember',
  'customRole',
  'user',
  'public',
] as const;

// Available field types for form builder
export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'number', label: 'Number' },
  { value: 'tel', label: 'Phone' },
  { value: 'textArea', label: 'Text Area' },
  { value: 'select', label: 'Select' },
  { value: 'multiSelect', label: 'Multi Select' },
  { value: 'dynamicSelect', label: 'Dynamic Select' },
  { value: 'dependentSelect', label: 'Dependent Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'switch', label: 'Switch' },
  { value: 'radio', label: 'Radio' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'file', label: 'File' },
  { value: 'htmlContent', label: 'HTML Content' },
  { value: 'icon', label: 'Icon' },
  { value: 'nrcField', label: 'NRC Field' },
  { value: 'objectField', label: 'Object Field' },
  { value: 'arrayField', label: 'Array Field' },
  { value: 'mediaBrowser', label: 'Media Browser' },
  { value: 'mediaGallery', label: 'Media Gallery' },
  { value: 'mediaUploader', label: 'Media Uploader' },
];

// Available form layouts
export const FORM_LAYOUTS: { value: FormLayout; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'wizard-horizontal', label: 'Wizard (Horizontal)' },
  { value: 'wizard-vertical', label: 'Wizard (Vertical)' },
  { value: 'custom', label: 'Custom' },
];

// Available table layouts
export const TABLE_LAYOUTS: { value: TableLayout; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'withCheckbox', label: 'With Checkbox' },
  { value: 'withSelect', label: 'With Select' },
];
