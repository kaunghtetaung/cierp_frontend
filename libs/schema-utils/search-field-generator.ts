import type { 
  ModuleSchema, 
  FormField, 
  TableColumn,
  QueryAllowedField 
} from '@repo/types';

/**
 * Maps form field types to appropriate search operators
 */
const getOperatorsForFieldType = (fieldType: string): string[] => {
  switch (fieldType) {
    case 'number':
    case 'integer':
      return ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'];
    case 'date':
      return ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'];
    case 'boolean':
    case 'checkbox':
      return ['$eq', '$ne'];
    case 'select':
    case 'multiSelect':
    case 'dynamicSelect':
    case 'dependentSelect':
    case 'radio':
      return ['$eq', '$ne', '$in', '$nin'];
    case 'text':
    case 'email':
    case 'phone':
    case 'textArea':
    default:
      return ['$regex', '$eq', '$ne'];
  }
};

/**
 * Maps form field type to search input type
 */
const getSearchFieldType = (fieldType: string): string => {
  switch (fieldType) {
    case 'number':
    case 'integer':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
    case 'checkbox':
      return 'boolean';
    case 'select':
    case 'multiSelect':
    case 'dynamicSelect':
    case 'dependentSelect':
    case 'radio':
      return 'select';
    default:
      return 'text';
  }
};

/**
 * Check if a field name is allowed by access policy
 */
const isFieldAllowed = (
  fieldName: string, 
  allowedFields?: QueryAllowedField[]
): boolean => {
  if (!allowedFields || allowedFields.length === 0) {
    return true; // If no restrictions, allow all
  }
  return allowedFields.some(field => field.fieldName === fieldName);
};

/**
 * Generate search field configuration from module schema
 * Combines table columns, form fields, and access policies
 */
export function generateSearchFields(
  module: ModuleSchema
): QueryAllowedField[] {
  const searchFields: QueryAllowedField[] = [];
  const processedFields = new Set<string>();

  // Get filterable columns from data table schema
  const filterableColumns = module.dataTableSchema.columns.filter(
    col => col.filterable !== false
  );

  // Process each filterable column
  filterableColumns.forEach(column => {
    // Skip if already processed or not allowed
    if (processedFields.has(column.fieldName)) return;
    
    // Check if field is allowed by access policy
    if (module.moduleAccessPolicy?.queryAllowedFields) {
      if (!isFieldAllowed(column.fieldName, module.moduleAccessPolicy.queryAllowedFields)) {
        return;
      }
    }

    // Find corresponding form field for additional metadata
    const formField = module.formFields.find(
      field => field.fieldName === column.fieldName
    );

    // Determine field type and operators
    let fieldType = 'text';
    let operators = ['$regex', '$eq'];

    if (formField) {
      fieldType = getSearchFieldType(formField.fieldType);
      operators = getOperatorsForFieldType(formField.fieldType);
    } else if (column.type) {
      // Fallback to column type if no form field
      fieldType = column.type === 'number' ? 'number' : 
                  column.type === 'date' ? 'date' :
                  column.type === 'boolean' ? 'boolean' :
                  'text';
      operators = getOperatorsForFieldType(fieldType);
    }

    // Add to search fields
    searchFields.push({
      fieldName: column.fieldName,
      fieldType,
      operators,
      label: column.label,
      // Include additional metadata if available
      isMultilingual: formField?.isMultiLang || false,
      dropdownConfig: formField?.dropdownConfig,
      options: formField?.options
    } as QueryAllowedField);

    processedFields.add(column.fieldName);
  });

  // Add any additional searchable form fields not in columns
  // Note: These fields will be available for advanced search but not simple search
  module.formFields.forEach(field => {
    // Skip if already processed, hidden, or not allowed
    if (processedFields.has(field.fieldName) || field.hidden) return;
    
    // Check if field is allowed by access policy
    if (module.moduleAccessPolicy?.queryAllowedFields) {
      if (!isFieldAllowed(field.fieldName, module.moduleAccessPolicy.queryAllowedFields)) {
        return;
      }
    }

    // Check if this field exists in table columns
    const existsInColumns = module.dataTableSchema.columns.some(
      col => col.fieldName === field.fieldName
    );

    // Only add non-column fields for specific searchable types
    // These will be available in advanced search but not simple search
    if (!existsInColumns && ['text', 'email', 'phone', 'textArea'].includes(field.fieldType)) {
      searchFields.push({
        fieldName: field.fieldName,
        fieldType: getSearchFieldType(field.fieldType),
        operators: getOperatorsForFieldType(field.fieldType),
        label: field.label,
        isMultilingual: field.isMultiLang || false,
        // Mark as form-only field for reference
        isFormOnly: true
      } as QueryAllowedField);

      processedFields.add(field.fieldName);
    }
  });

  return searchFields;
}

/**
 * Get the primary search field for quick search
 * Usually the first text field or name field that exists in table columns
 */
export function getPrimarySearchField(
  module: ModuleSchema
): QueryAllowedField | null {
  // Get column field names for verification
  const columnFieldNames = new Set(
    module.dataTableSchema.columns.map(col => col.fieldName)
  );
  
  const searchFields = generateSearchFields(module);
  
  // Filter to only fields that exist in table columns
  const columnsSearchFields = searchFields.filter(field => 
    columnFieldNames.has(field.fieldName)
  );
  
  // Look for common name fields first (that exist in columns)
  const nameField = columnsSearchFields.find(field => 
    ['name', 'title', 'displayName', 'fullName', 'username', 'email'].includes(field.fieldName)
  );
  
  if (nameField) return nameField;
  
  // Otherwise return first text field from columns
  return columnsSearchFields.find(field => 
    field.fieldType === 'text' && 
    field.operators.includes('$regex')
  ) || columnsSearchFields[0] || null;
}

/**
 * Merge schema-based fields with access policy fields
 * Preserves any additional fields from access policy
 */
export function mergeWithAccessPolicy(
  schemaFields: QueryAllowedField[],
  policyFields?: QueryAllowedField[]
): QueryAllowedField[] {
  if (!policyFields || policyFields.length === 0) {
    return schemaFields;
  }

  const merged = [...schemaFields];
  const existingFieldNames = new Set(schemaFields.map(f => f.fieldName));

  // Add any policy fields not in schema
  policyFields.forEach(policyField => {
    if (!existingFieldNames.has(policyField.fieldName)) {
      merged.push(policyField);
    }
  });

  return merged;
}