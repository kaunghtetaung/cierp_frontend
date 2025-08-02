// Global API Error Interceptor
// Handles and categorizes API errors for consistent error handling across the application

import type { 
  ErrorInterceptor, 
  HttpResponseContext 
} from '../types/http-types';
import type { ApiResponse } from '@repo/types';

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
 * Enhanced API Error with categorization
 */
export interface ApiError extends Error {
  category: ApiErrorCategory;
  statusCode?: number;
  errorCode?: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  retryable: boolean;
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

    // Categorize and enhance the error
    const enhancedError = this.categorizeError(context.error);
    
    // Log error for monitoring
    this.logError(enhancedError, context);

    // Return context with enhanced error
    return {
      ...context,
      error: enhancedError
    };
  }

  private categorizeError(error: any): ApiError {
    const timestamp = new Date().toISOString();
    let category = ApiErrorCategory.UNKNOWN;
    let statusCode: number | undefined;
    let errorCode: string | undefined;
    let details: Record<string, any> | undefined;
    let retryable = false;

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

    // Create enhanced error
    const enhancedError: ApiError = Object.assign(new Error(error.message || 'An unknown error occurred'), {
      category,
      statusCode,
      errorCode,
      details,
      timestamp,
      requestId: error.requestId,
      retryable,
      stack: error.stack
    });

    return enhancedError;
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
    const messages = {
      en: {
        [ApiErrorCategory.NETWORK]: 'Network connection failed. Please check your internet connection.',
        [ApiErrorCategory.AUTHENTICATION]: 'Authentication required. Please log in again.',
        [ApiErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
        [ApiErrorCategory.VALIDATION]: 'Please check your input and try again.',
        [ApiErrorCategory.NOT_FOUND]: 'The requested resource was not found.',
        [ApiErrorCategory.SERVER_ERROR]: 'Server error occurred. Please try again later.',
        [ApiErrorCategory.TENANT_ERROR]: 'Tenant configuration error. Please contact support.',
        [ApiErrorCategory.TIMEOUT]: 'Request timed out. Please try again.',
        [ApiErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.'
      },
      mm: {
        [ApiErrorCategory.NETWORK]: 'ကွန်ယက် ချိတ်ဆက်မှု မအောင်မြင်ပါ။ သင့်အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ။',
        [ApiErrorCategory.AUTHENTICATION]: 'အထောက်အထား စိစစ်ခြင်း လိုအပ်သည်။ ကျေးဇူးပြု၍ ထပ်မံ လော့ဂ်အင် ဝင်ပါ။',
        [ApiErrorCategory.AUTHORIZATION]: 'ဤလုပ်ဆောင်ချက်ကို ပြုလုပ်ရန် သင့်တွင် ခွင့်ပြုချက် မရှိပါ။',
        [ApiErrorCategory.VALIDATION]: 'ကျေးဇူးပြု၍ သင့်ထည့်သွင်းမှုကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။',
        [ApiErrorCategory.NOT_FOUND]: 'တောင်းဆိုထားသော အရင်းအမြစ်ကို မတွေ့ရှိပါ။',
        [ApiErrorCategory.SERVER_ERROR]: 'ဆာဗာ အမှားအယွင်း ဖြစ်ပွားခဲ့သည်။ ကျေးဇူးပြု၍ နောက်မှ ထပ်မံကြိုးစားပါ။',
        [ApiErrorCategory.TENANT_ERROR]: 'Tenant ပြင်ဆင်ချက် အမှားအယွင်း။ ကျေးဇူးပြု၍ ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ။',
        [ApiErrorCategory.TIMEOUT]: 'တောင်းဆိုမှု အချိန်ကုန်သွားသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။',
        [ApiErrorCategory.UNKNOWN]: 'မမျှော်လင့်ထားသော အမှားအယွင်း ဖြစ်ပွားခဲ့သည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။'
      }
    };

    return messages[language]?.[error.category] || messages.en[error.category] || error.message;
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