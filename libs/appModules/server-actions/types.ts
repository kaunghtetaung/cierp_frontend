/**
 * Type definitions for module server actions
 * Separated from server actions to avoid Next.js 'use server' export restrictions
 */

// Backend validation error response structure
export interface BackendValidationError {
  statusCode: number;
  errorCode: string;
  message: string;
  traceId: string;
  timestamp: string;
  path: string;
  extra?: {
    fieldErrors?: string[];
    requestId?: string;
    backendExtra?: {
      fieldErrors?: string[];
    };
  };
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  pagination?: any;
  error?: string;
  errors?: Record<string, string[]>;
  fieldErrors?: string[];
  traceId?: string;
  redirectTo?: string;
  // Enhanced error metadata from backend/HTTP client
  statusCode?: number;
  errorCode?: string;
  errorCategory?: string;
  userMessage?: string;
  recoveryActions?: string[];
  backendMessage?: string;
}
