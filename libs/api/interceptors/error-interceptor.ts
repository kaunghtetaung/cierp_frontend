// Global API Error Interceptor
// Handles and categorizes API errors for consistent error handling across the application
// Supports multilingual error messages with backend integration

import type { 
  ErrorInterceptor, 
  HttpResponseContext 
} from '../types/http-types';
import type { ApiResponse } from '@repo/types';
import { 
  getLocalizedErrorMessage, 
  getLocalizedRecoveryActions,
  frontendErrorMessages 
} from '../messages/error-messages';
import { handleAuthError } from '../../auth/auth-error-handler';

/**
 * API Error Categories for structured error handling
 */
export enum ApiErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TENANT_ERROR = 'TENANT_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Enhanced API Error with categorization and multilingual support
 */
export interface ApiError extends Error {
  category: ApiErrorCategory;
  statusCode?: number;
  errorCode?: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  retryable: boolean;
  
  // Backend integration fields
  backendMessage?: string;        // Localized message from backend (when available)
  backendErrorCode?: string;      // Backend's specific error code
  traceId?: string;              // Backend correlation ID
  path?: string;                 // Request path from backend
  
  // Frontend multilingual support
  frontendMessageKey?: string;   // Key for frontend error message lookup
  userMessage: string;           // Final localized message shown to user
  language: 'en' | 'mm';        // User's current language preference
  recoveryActions?: string[];    // Localized recovery suggestions
}

/**
 * Error interceptor for API responses
 * Categorizes errors and provides structured error information
 */
export class GlobalErrorInterceptor implements ErrorInterceptor {
  async intercept(context: HttpResponseContext): Promise<HttpResponseContext> {
    if (!context.error) {
      return context;
    }

    // Log the raw error first for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 GlobalErrorInterceptor: Raw error before processing:', {
        error: context.error,
        errorType: typeof context.error,
        errorConstructor: context.error?.constructor?.name,
        errorMessage: context.error?.message,
        errorStack: context.error?.stack,
        responseStatus: context.response?.status,
        requestUrl: context.request?.url
      });
    }

    // Categorize and enhance the error
    const enhancedError = this.categorizeError(context.error, context);
    
    // Handle authentication errors with centralized handler
    if (enhancedError.category === ApiErrorCategory.AUTHENTICATION || 
        enhancedError.category === ApiErrorCategory.AUTHORIZATION) {
      
      console.log('🔐 GlobalErrorInterceptor: Detected auth error, delegating to AuthErrorHandler');
      
      // Use centralized auth error handler for logout and redirection
      // This runs in the background - we don't wait for it
      handleAuthError(enhancedError, {
        url: context.request?.url,
        userLanguage: enhancedError.language
      }).catch(authError => {
        console.error('🔐 GlobalErrorInterceptor: Auth error handling failed:', authError);
      });
    }
    
    // Log error for monitoring
    this.logError(enhancedError, context);

    // Return context with enhanced error
    return {
      ...context,
      error: enhancedError
    };
  }

  private categorizeError(error: any, context?: HttpResponseContext): ApiError {
    const timestamp = new Date().toISOString();
    let category = ApiErrorCategory.UNKNOWN;
    let statusCode: number | undefined;
    let errorCode: string | undefined;
    let details: Record<string, any> | undefined;
    let retryable = false;
    
    // Extract backend error information if available
    let backendMessage: string | undefined;
    let backendErrorCode: string | undefined;
    let traceId: string | undefined;
    let path: string | undefined;
    
    // Get current language (default to 'en' if not available)
    const language: 'en' | 'mm' = this.getCurrentLanguage();
    
    // Check if error is from backend with structured format
    if (error.response?.data) {
      const backendError = error.response.data;
      backendMessage = backendError.message;
      backendErrorCode = backendError.errorCode;
      traceId = backendError.traceId;
      path = backendError.path;
      statusCode = backendError.statusCode || error.response.status;
      
      // Map backend error codes to frontend categories
      category = this.mapBackendErrorToCategory(backendErrorCode, statusCode);
    }

    // Handle fetch/network errors
    if (error instanceof TypeError || error.name === 'TypeError') {
      category = ApiErrorCategory.NETWORK;
      retryable = true;
    }
    // Handle timeout errors
    else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      category = ApiErrorCategory.TIMEOUT;
      retryable = true;
    }
    // Handle HTTP response errors
    else if (error.status || error.statusCode) {
      statusCode = error.status || error.statusCode;
      
      switch (statusCode) {
        case 401:
          category = ApiErrorCategory.AUTHENTICATION;
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          category = ApiErrorCategory.AUTHORIZATION;
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          category = ApiErrorCategory.NOT_FOUND;
          errorCode = 'NOT_FOUND';
          break;
        case 422:
          category = ApiErrorCategory.VALIDATION;
          errorCode = 'VALIDATION_ERROR';
          details = error.details || error.errors;
          break;
        case 408:
          category = ApiErrorCategory.TIMEOUT;
          retryable = true;
          break;
        case 429:
          category = ApiErrorCategory.SERVER_ERROR;
          errorCode = 'RATE_LIMITED';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          category = ApiErrorCategory.SERVER_ERROR;
          retryable = true;
          break;
        default:
          if (statusCode >= 400 && statusCode < 500) {
            category = ApiErrorCategory.VALIDATION;
          } else if (statusCode >= 500) {
            category = ApiErrorCategory.SERVER_ERROR;
            retryable = true;
          }
      }
    }

    // Handle tenant-specific errors
    if (error.message?.includes('tenant') || errorCode?.includes('TENANT')) {
      category = ApiErrorCategory.TENANT_ERROR;
    }

    // Determine frontend message key for client-side errors
    const frontendMessageKey = this.getFrontendMessageKey(category, error);
    
    // Generate user-facing message (priority: backend > frontend > generic)
    const userMessage = this.generateUserMessage(
      backendMessage,
      frontendMessageKey,
      language,
      error.message
    );
    
    // Get recovery actions
    const recoveryActions = this.getRecoveryActions(
      backendErrorCode || frontendMessageKey,
      category,
      language
    );

    // Create enhanced error
    const enhancedError: ApiError = Object.assign(new Error(error.message || 'An unknown error occurred'), {
      category,
      statusCode,
      errorCode,
      details,
      timestamp,
      requestId: error.requestId,
      retryable,
      stack: error.stack,
      
      // Backend integration
      backendMessage,
      backendErrorCode,
      traceId,
      path,
      
      // Multilingual support
      frontendMessageKey,
      userMessage,
      language,
      recoveryActions
    });

    return enhancedError;
  }

  /**
   * Get current user language from context
   */
  private getCurrentLanguage(): 'en' | 'mm' {
    // Try to get language from various sources
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        // Try to get from URL path first
        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang === 'en' || pathLang === 'mm') {
          return pathLang;
        }
        
        // Try to get from localStorage/cookie
        const storedLang = localStorage.getItem('language') || 
                          document.cookie.split(';')
                            .find(c => c.trim().startsWith('language='))
                            ?.split('=')[1];
        if (storedLang === 'en' || storedLang === 'mm') {
          return storedLang;
        }
      }
    } catch (error) {
      // Ignore errors in language detection
    }
    
    return 'en'; // Default to English
  }

  /**
   * Map backend error codes to frontend categories
   */
  private mapBackendErrorToCategory(
    backendErrorCode?: string, 
    statusCode?: number
  ): ApiErrorCategory {
    if (!backendErrorCode && !statusCode) {
      return ApiErrorCategory.UNKNOWN;
    }
    
    // Map specific backend error codes
    const errorCodeMapping: Record<string, ApiErrorCategory> = {
      'UNAUTHORIZED_REQUEST': ApiErrorCategory.AUTHENTICATION,
      'FORBIDDEN_ACCESS': ApiErrorCategory.AUTHORIZATION,
      'TOKEN_MISSING_ROLES': ApiErrorCategory.AUTHORIZATION,
      'USER_NOT_FOUND': ApiErrorCategory.NOT_FOUND,
      'ORGANIZATION_NOT_FOUND': ApiErrorCategory.NOT_FOUND,
      'RESOURCE_NOT_FOUND': ApiErrorCategory.NOT_FOUND,
      'BAD_REQUEST_FORMAT': ApiErrorCategory.VALIDATION,
      'VALIDATION_ERROR': ApiErrorCategory.VALIDATION,
      'SERVICE_TIMEOUT': ApiErrorCategory.TIMEOUT,
      'INVALID_MICROSERVICE_RESPONSE': ApiErrorCategory.SERVER_ERROR,
      'UNEXPECTED_ERROR': ApiErrorCategory.SERVER_ERROR,
    };
    
    if (backendErrorCode && errorCodeMapping[backendErrorCode]) {
      return errorCodeMapping[backendErrorCode];
    }
    
    // Fallback to HTTP status code mapping
    if (statusCode) {
      switch (statusCode) {
        case 401: return ApiErrorCategory.AUTHENTICATION;
        case 403: return ApiErrorCategory.AUTHORIZATION;
        case 404: return ApiErrorCategory.NOT_FOUND;
        case 408: return ApiErrorCategory.TIMEOUT;
        case 422: return ApiErrorCategory.VALIDATION;
        case 429: return ApiErrorCategory.SERVER_ERROR;
        case 500:
        case 502:
        case 503:
        case 504: return ApiErrorCategory.SERVER_ERROR;
        default:
          if (statusCode >= 400 && statusCode < 500) return ApiErrorCategory.VALIDATION;
          if (statusCode >= 500) return ApiErrorCategory.SERVER_ERROR;
      }
    }
    
    return ApiErrorCategory.UNKNOWN;
  }

  /**
   * Get frontend message key for client-side errors
   */
  private getFrontendMessageKey(category: ApiErrorCategory, error: any): string | undefined {
    // Map categories to frontend message keys
    const categoryMapping: Record<ApiErrorCategory, string> = {
      [ApiErrorCategory.NETWORK]: 'NETWORK_CONNECTION_FAILED',
      [ApiErrorCategory.TIMEOUT]: 'NETWORK_TIMEOUT',
      [ApiErrorCategory.AUTHENTICATION]: 'SESSION_EXPIRED',
      [ApiErrorCategory.AUTHORIZATION]: 'INSUFFICIENT_PERMISSIONS',
      [ApiErrorCategory.VALIDATION]: 'CLIENT_VALIDATION_FAILED',
      [ApiErrorCategory.NOT_FOUND]: 'DATA_LOAD_FAILED',
      [ApiErrorCategory.SERVER_ERROR]: 'UNEXPECTED_ERROR',
      [ApiErrorCategory.TENANT_ERROR]: 'UNEXPECTED_ERROR',
      [ApiErrorCategory.UNKNOWN]: 'GENERIC_ERROR',
    };
    
    // Check for specific error types
    if (error instanceof TypeError || error.name === 'TypeError') {
      return 'NETWORK_CONNECTION_FAILED';
    }
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return 'NETWORK_TIMEOUT';
    }
    
    return categoryMapping[category];
  }

  /**
   * Generate user-facing message with priority system
   */
  private generateUserMessage(
    backendMessage?: string,
    frontendMessageKey?: string,
    language: 'en' | 'mm' = 'en',
    fallbackMessage?: string
  ): string {
    // Priority 1: Use backend's localized message if available
    if (backendMessage && backendMessage.trim().length > 0) {
      return backendMessage;
    }
    
    // Priority 2: Use frontend multilingual message
    if (frontendMessageKey) {
      const localizedMessage = getLocalizedErrorMessage(frontendMessageKey, language);
      if (localizedMessage) {
        return localizedMessage;
      }
    }
    
    // Priority 3: Generic fallback message
    return getLocalizedErrorMessage('GENERIC_ERROR', language);
  }

  /**
   * Get recovery actions for errors
   */
  private getRecoveryActions(
    errorKey?: string,
    category?: ApiErrorCategory,
    language: 'en' | 'mm' = 'en'
  ): string[] {
    // Try to get recovery actions by error key first
    if (errorKey) {
      const actions = getLocalizedRecoveryActions(errorKey, language);
      if (actions.length > 0) {
        return actions;
      }
    }
    
    // Fallback to category-based recovery actions
    const categoryActions: Record<ApiErrorCategory, string[]> = {
      [ApiErrorCategory.NETWORK]: getLocalizedRecoveryActions('NETWORK_CONNECTION_FAILED', language),
      [ApiErrorCategory.TIMEOUT]: getLocalizedRecoveryActions('NETWORK_CONNECTION_FAILED', language),
      [ApiErrorCategory.AUTHENTICATION]: [
        language === 'mm' ? 'ထပ်မံ လော့ဂ်အင်ဝင်ပါ' : 'Log in again',
        language === 'mm' ? 'သင့်အထောက်အထားများကို စစ်ဆေးပါ' : 'Check your credentials'
      ],
      [ApiErrorCategory.AUTHORIZATION]: getLocalizedRecoveryActions('INSUFFICIENT_PERMISSIONS', language),
      [ApiErrorCategory.VALIDATION]: getLocalizedRecoveryActions('CLIENT_VALIDATION_FAILED', language),
      [ApiErrorCategory.NOT_FOUND]: [
        language === 'mm' ? 'စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေပါ' : 'Refresh the page',
        language === 'mm' ? 'မှန်ကန်သော လိပ်စာကို စစ်ဆေးပါ' : 'Check the correct address'
      ],
      [ApiErrorCategory.SERVER_ERROR]: [
        language === 'mm' ? 'နောက်မှ ထပ်မံကြိုးစားပါ' : 'Try again later',
        language === 'mm' ? 'ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ' : 'Contact support'
      ],
      [ApiErrorCategory.TENANT_ERROR]: [
        language === 'mm' ? 'ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ' : 'Contact support',
        language === 'mm' ? 'ပြင်ဆင်ချက်ကို စစ်ဆေးပါ' : 'Check configuration'
      ],
      [ApiErrorCategory.UNKNOWN]: [
        language === 'mm' ? 'ထပ်မံကြိုးစားပါ' : 'Try again',
        language === 'mm' ? 'ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ' : 'Contact support'
      ]
    };
    
    return category ? categoryActions[category] || [] : [];
  }

  private logError(error: ApiError, context: HttpResponseContext): void {
    const logData = {
      error: {
        message: error.message,
        category: error.category,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        timestamp: error.timestamp,
        retryable: error.retryable
      },
      request: {
        url: context.request?.url,
        method: context.request?.method,
        requestId: error.requestId
      },
      context: process.env.NODE_ENV === 'development' ? context : undefined
    };

    // Log based on severity
    switch (error.category) {
      case ApiErrorCategory.NETWORK:
      case ApiErrorCategory.TIMEOUT:
        console.warn('API Network Error:', logData);
        break;
      
      case ApiErrorCategory.AUTHENTICATION:
      case ApiErrorCategory.AUTHORIZATION:
        console.warn('API Auth Error:', logData);
        break;
      
      case ApiErrorCategory.SERVER_ERROR:
        console.error('API Server Error:', logData);
        break;
      
      case ApiErrorCategory.TENANT_ERROR:
        console.error('API Tenant Error:', logData);
        break;
      
      default:
        console.log('API Error:', logData);
    }

    // TODO: Send to error monitoring service
    // this.reportToMonitoring(error, context);
  }

  // TODO: Implement error reporting to external services
  private reportToMonitoring(error: ApiError, context: HttpResponseContext): void {
    // Report to Sentry, LogRocket, or other monitoring service
    // Example:
    // Sentry.captureException(error, {
    //   tags: {
    //     category: error.category,
    //     statusCode: error.statusCode
    //   },
    //   extra: {
    //     request: context.request,
    //     details: error.details
    //   }
    // });
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    if (error && typeof error === 'object' && 'retryable' in error) {
      return error.retryable;
    }
    return false;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError, language: string = 'en'): string {
    // Use the new userMessage field which already contains the properly localized message
    if (error.userMessage) {
      return error.userMessage;
    }
    
    // Fallback to backend message if available
    if (error.backendMessage) {
      return error.backendMessage;
    }
    
    // Final fallback to generic message
    return language === 'mm' 
      ? 'မမျှော်လင့်ထားသော အမှားအယွင်း ဖြစ်ပွားခဲ့သည်။'
      : 'An unexpected error occurred.';
  }

  /**
   * Get recovery suggestions
   */
  static getRecoveryActions(error: ApiError): string[] {
    switch (error.category) {
      case ApiErrorCategory.NETWORK:
      case ApiErrorCategory.TIMEOUT:
        return ['retry', 'check_connection'];
      
      case ApiErrorCategory.AUTHENTICATION:
        return ['login', 'refresh_token'];
      
      case ApiErrorCategory.AUTHORIZATION:
        return ['contact_admin', 'check_permissions'];
      
      case ApiErrorCategory.VALIDATION:
        return ['fix_input', 'check_requirements'];
      
      case ApiErrorCategory.SERVER_ERROR:
        return ['retry_later', 'contact_support'];
      
      case ApiErrorCategory.TENANT_ERROR:
        return ['contact_support', 'check_configuration'];
      
      default:
        return ['retry', 'contact_support'];
    }
  }
}