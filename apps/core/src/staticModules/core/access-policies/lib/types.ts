/**
 * Access Policy frontend types — mirror backend
 * `libs/nest/src/dtos/access-policy.dto.ts` and the storage shape from
 * `libs/nest/src/services/access-policy-config.service.ts`. Kept loose
 * (`Record<string, RoleAccessPolicy>`) on `accessPolicy` so adding new
 * roles doesn't require a TypeScript migration.
 */

export interface QueryAllowedField {
  fieldName: string;
  fieldType: string;
  operators: string[];
}

export interface AccessOperationRead {
  allow: boolean;
  restrictInvisibleFields?: boolean;
}
export interface AccessOperationUpdate {
  allow: boolean;
  restrictUnaccessibleFields?: boolean;
}
export interface AccessOperationWithResource {
  allow: boolean;
  IsResourceBase?: boolean;
}

export interface AccessOperation {
  create?: boolean;
  read?: AccessOperationRead;
  update?: AccessOperationUpdate;
  softDelete?: boolean;
  hardDelete?: boolean;
  readSoftDeleted?: AccessOperationWithResource;
  restoreSoftDeleted?: AccessOperationWithResource;
  schema?: AccessOperationWithResource;
  /** Reference / picker-only access. */
  reference?: AccessOperationWithResource;
  /** Custom actions specific to a module (kept open-ended). */
  [extra: string]: unknown;
}

export interface RoleAccessPolicy {
  operation: AccessOperation;
  unaccessibleFields: string[];
  invisibleFields: string[];
  relatedDataOnly: boolean;
  accessDenied: boolean;
}

export interface AccessPolicy {
  _id?: string;
  moduleName: string;
  serviceName: string;
  resourceIdField: string;
  hasOrganizationField: boolean;
  organizationIdFieldName: string;
  hasDepartmentField: boolean;
  departmentIdFieldName: string;
  queryAllowedFields: QueryAllowedField[];
  accessPolicy: Record<string, RoleAccessPolicy>;
  organizationId?: string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAccessPolicyDto = Omit<
  AccessPolicy,
  '_id' | 'version' | 'createdAt' | 'updatedAt'
>;
export type UpdateAccessPolicyDto = Partial<CreateAccessPolicyDto> & {
  version?: number;
};

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error?: string;
  data: T;
  timestamp: Date;
}

/** Action keys recognised by the policy renderer. Order = column order. */
export const POLICY_ACTIONS = [
  'create',
  'read',
  'update',
  'softDelete',
  'hardDelete',
  'readSoftDeleted',
  'restoreSoftDeleted',
  'schema',
  'reference',
] as const;
export type PolicyAction = (typeof POLICY_ACTIONS)[number];

/**
 * Standard role names used in `moduleAccessPolicy.json`. New entries
 * may include other role names; the editor renders whatever shows up.
 */
export const STANDARD_ROLES = [
  'systemAdmin',
  'organizationAdmin',
  'organizationMember',
  'departmentAdmin',
  'departmentMember',
  'public',
] as const;

export const SERVICE_OPTIONS = [
  'core',
  'Content',
  'library',
  'cpms',
  'finance',
] as const;
