// Dynamic module schema types for appSchemaData
export interface ModuleSchema {
  id: number
  name: LocalizedText
  slug: string
  serviceName: string
  description: LocalizedText
  iconName: string
  formLayout: 'vertical' | 'horizontal' | 'grid' | 'wizard'
  formFields: FormField[]
  dataTableSchema: DataTableSchema
  extraActionForms: ExtraActionForm[]
  moduleAccessPolicy: ModuleAccessPolicy
}

export interface LocalizedText {
  en: string
  mm: string
}

export interface FormField {
  fieldName: string
  fieldType: 'text' | 'email' | 'password' | 'textArea' | 'select' | 'multiSelect' | 'date' | 'boolean' | 'checkbox' | 'number' | 'icon' | 'radio' | 'file' | 'htmlContent'
  label: LocalizedText
  placeHolder?: string
  validationRule?: ValidationRule
  readonly: boolean
  hidden: boolean
  rows?: number
  options?: SelectOption[]
  isMultiLang?: boolean // Flag to indicate if this field supports multilanguage input
}

export interface ValidationRule {
  required: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  errorMessage: LocalizedText
}

export interface SelectOption {
  value: string
  label: LocalizedText
}

export interface DataTableSchema {
  layout: 'standard' | 'withCheckbox' | 'minimal'
  columns: DataTableColumn[]
  actions: DataTableActions
  pagination: PaginationConfig
  sorting: SortingConfig
  filtering: FilteringConfig
}

export interface DataTableColumn {
  fieldName: string
  label: LocalizedText
  sortable: boolean
  filterable: boolean
  type: 'text' | 'date' | 'boolean' | 'number' | 'status' | 'icon'
  format?: string
}

export interface DataTableActions {
  view?: ActionConfig
  edit?: ActionConfig
  delete?: ActionConfig
  extraActions: ExtraAction[]
}

export interface ActionConfig {
  type: 'page' | 'modal' | 'api'
  label: LocalizedText
  icon: string
  permission: string
}

export interface ExtraAction {
  actionKey: string
  type: 'modal' | 'page' | 'api'
  label: LocalizedText
  icon: string
  permission: string
  endpoint: string
  confirmMessage?: LocalizedText
}

export interface ExtraActionForm {
  actionKey: string
  title: LocalizedText
  description: LocalizedText
  iconName: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  formType: 'modal' | 'page'
  formName: string
  requiresSelection: boolean
  buttonStyle: 'primary' | 'secondary' | 'warning' | 'destructive'
  permission: string
  confirmMessage?: LocalizedText
}

export interface PaginationConfig {
  enabled: boolean
  defaultLimit: number
  allowedLimits: number[]
}

export interface SortingConfig {
  enabled: boolean
  defaultSort: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface FilteringConfig {
  enabled: boolean
  searchFields: string[]
}

export interface ModuleAccessPolicy {
  resourceIdField: string
  hasOrganizationField: boolean
  organizationIdFieldName: string
  hasDepartmentField: boolean
  departmentIdFieldName: string
  queryAllowedFields?: QueryAllowedField[]
  accessPolicy: {
    systemAdmin: AccessPolicyRule
    organizationAdmin: AccessPolicyRule
    organizationMember: AccessPolicyRule
    departmentAdmin?: AccessPolicyRule
    public: AccessPolicyRule
  }
}

export interface QueryAllowedField {
  fieldName: string
  fieldType: string
  operators: string[]
}

export interface AccessPolicyRule {
  operation: {
    create: boolean
    read: {
      allow: boolean
      restrictInvisibleFields: boolean
    }
    update: {
      allow: boolean
      restrictUnaccessibleFields?: boolean
    }
    softDelete: boolean
    hardDelete: boolean
    readSoftDeleted: {
      allow: boolean
      IsResourceBase: boolean
    }
    restoreSoftDeleted: {
      allow: boolean
      IsResourceBase: boolean
    }
    schema: {
      allow: boolean
      IsResourceBase: boolean
    }
  }
  unaccessibleFields: string[]
  invisibleFields: string[]
  relatedDataOnly: boolean
  accessDenied: boolean
}

export interface AppSchemaResponse {
  serviceName: string
  supportedLanguages: string[]
  modules: ModuleSchema[]
  timestamp: string
}