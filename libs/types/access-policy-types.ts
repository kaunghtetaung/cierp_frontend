/**
 * Access policy and permission types for module schema system
 */

// Module access policy operation configuration
export interface AccessOperation {
  create?: boolean;
  read?: {
    allow: boolean;
    restrictInvisibleFields?: boolean;
  };
  update?: {
    allow: boolean;
    restrictUnaccessibleFields?: boolean;
  };
  softDelete?: boolean;
  hardDelete?: boolean;
  readSoftDeleted?: {
    allow: boolean;
    IsResourceBase?: boolean;
  };
  restoreSoftDeleted?: {
    allow: boolean;
    IsResourceBase?: boolean;
  };
  schema?: {
    allow: boolean;
    IsResourceBase?: boolean;
  };
}

// Role-based access policy configuration
export interface RoleAccessPolicy {
  operation: AccessOperation;
  unaccessibleFields: string[];
  invisibleFields: string[];
  relatedDataOnly: boolean;
  accessDenied: boolean;
}

// Query field configuration for filtering
export interface QueryAllowedField {
  fieldName: string;
  fieldType: string;
  operators: string[];
}

// Module access policy configuration
export interface ModuleAccessPolicy {
  resourceIdField: string;
  hasOrganizationField: boolean;
  organizationIdFieldName: string;
  hasDepartmentField: boolean;
  departmentIdFieldName: string;
  queryAllowedFields?: QueryAllowedField[];
  accessPolicy: {
    [roleName: string]: RoleAccessPolicy;
  };
}

// Common role names in the system
export type SystemRole = 
  | 'systemAdmin' 
  | 'organizationAdmin' 
  | 'organizationMember' 
  | 'departmentAdmin' 
  | 'public';