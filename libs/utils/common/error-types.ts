// Common Error Types and Interfaces - Consistent error handling across the application

export interface ErrorContext {
  readonly timestamp: Date;
  readonly operation: string;
  readonly component?: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly requestId?: string;
  readonly metadata?: Record<string, any>;
}

export interface ApplicationError {
  readonly type: ErrorType;
  readonly code: string;
  readonly message: string;
  readonly context: ErrorContext;
  readonly cause?: Error;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  toJSON(): Record<string, any>;
}

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'CACHE_ERROR'
  | 'DATABASE_ERROR'
  | 'SESSION_ERROR'
  | 'TOKEN_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorHandler {
  canHandle(error: unknown): boolean;
  handle(error: unknown, context: Partial<ErrorContext>): ApplicationError;
}

export interface ErrorReporter {
  report(error: ApplicationError): Promise<void>;
}

export interface ErrorRecovery {
  canRecover(error: ApplicationError): boolean;
  recover(error: ApplicationError): Promise<any>;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for metrics and monitoring
export enum ErrorCategory {
  CLIENT = 'client',
  SERVER = 'server',
  NETWORK = 'network',
  BUSINESS = 'business',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

// Common error codes
export const ERROR_CODES = {
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  
  // Network/API errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Cache errors
  CACHE_MISS: 'CACHE_MISS',
  CACHE_WRITE_ERROR: 'CACHE_WRITE_ERROR',
  CACHE_READ_ERROR: 'CACHE_READ_ERROR',
  
  // Business logic errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  
  // Configuration errors
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

// HTTP status code mappings
export const HTTP_ERROR_MAPPINGS = {
  [ERROR_CODES.INVALID_INPUT]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
  [ERROR_CODES.INVALID_FORMAT]: 400,
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.TOKEN_INVALID]: 401,
  [ERROR_CODES.SESSION_EXPIRED]: 401,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [ERROR_CODES.ACCESS_DENIED]: 403,
  [ERROR_CODES.TENANT_MISMATCH]: 403,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.API_UNAVAILABLE]: 503,
  [ERROR_CODES.UNKNOWN_ERROR]: 500
} as const;

// Retryable error codes
export const RETRYABLE_ERROR_CODES = new Set([
  ERROR_CODES.NETWORK_TIMEOUT,
  ERROR_CODES.CONNECTION_ERROR,
  ERROR_CODES.API_UNAVAILABLE,
  ERROR_CODES.CACHE_READ_ERROR,
  ERROR_CODES.CACHE_WRITE_ERROR
]);

// Error constants
export const ERROR_CONSTANTS = {
  MAX_ERROR_MESSAGE_LENGTH: 500,
  MAX_STACK_TRACE_LENGTH: 2000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000,
  ERROR_REPORT_TIMEOUT: 5000
} as const;