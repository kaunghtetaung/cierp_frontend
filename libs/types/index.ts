// Main exports from types package
export * from './common';
export * from './auth';
export * from './tenant';
export * from './api';
export * from './ui';
export * from './content';
export * from './section';

// Module schema types for server-side usage
export * from './module-schema';
export * from './form-types';
export * from './table-types';
export * from './access-policy-types';
export * from './module-schema-interfaces';
export * from './type-guards';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Generic utility types
export interface Entity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WithTenant {
  readonly tenantId: string;
}

export interface WithTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WithMetadata {
  readonly metadata: Record<string, unknown>;
}

// Error types
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ErrorResponse {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
  readonly timestamp: Date;
  readonly path: string;
  readonly validationErrors?: ValidationError[];
}

// Configuration types
export interface EnvironmentConfig {
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly apiUrl: string;
  readonly appUrl: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly ssl: boolean;
}

export interface CacheConfig {
  readonly ttl: number;
  readonly maxItems: number;
  readonly enabled: boolean;
}

export interface SecurityConfig {
  readonly csrfEnabled: boolean;
  readonly sessionTimeout: number;
  readonly maxLoginAttempts: number;
  readonly lockoutDuration: number;
}