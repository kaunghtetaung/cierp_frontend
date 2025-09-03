// Error Factory - Consistent error creation across the application
import type { 
  ApplicationError, 
  ErrorContext, 
  ErrorType
} from './error-types';
import { 
  ERROR_CODES, 
  HTTP_ERROR_MAPPINGS, 
  RETRYABLE_ERROR_CODES, 
  ERROR_CONSTANTS,
  ErrorSeverity,
  ErrorCategory 
} from './error-types';

export class ApplicationErrorImpl implements ApplicationError {
  readonly type: ErrorType;
  readonly code: string;
  readonly message: string;
  readonly context: ErrorContext;
  readonly cause?: Error;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    context: ErrorContext,
    options: {
      cause?: Error;
      statusCode?: number;
      retryable?: boolean;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
    } = {}
  ) {
    this.type = type;
    this.code = code;
    this.message = this.truncateMessage(message);
    this.context = context;
    this.cause = options.cause;
    this.statusCode = options.statusCode || HTTP_ERROR_MAPPINGS[code as keyof typeof HTTP_ERROR_MAPPINGS];
    this.retryable = options.retryable ?? RETRYABLE_ERROR_CODES.has(code as any);
    this.severity = options.severity || this.determineSeverity(type, code);
    this.category = options.category || this.determineCategory(type);
  }

  private truncateMessage(message: string): string {
    if (message.length <= ERROR_CONSTANTS.MAX_ERROR_MESSAGE_LENGTH) {
      return message;
    }
    return message.substring(0, ERROR_CONSTANTS.MAX_ERROR_MESSAGE_LENGTH - 3) + '...';
  }

  private determineSeverity(type: ErrorType, code: string): ErrorSeverity {
    // Critical errors
    if (type === 'AUTHENTICATION_ERROR' || type === 'AUTHORIZATION_ERROR') {
      return ErrorSeverity.HIGH;
    }
    
    if (code === ERROR_CODES.INTERNAL_ERROR || code === ERROR_CODES.UNKNOWN_ERROR) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors
    if (type === 'DATABASE_ERROR' || type === 'CONFIGURATION_ERROR') {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors
    if (type === 'API_ERROR' || type === 'EXTERNAL_SERVICE_ERROR') {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity errors (validation, etc.)
    return ErrorSeverity.LOW;
  }

  private determineCategory(type: ErrorType): ErrorCategory {
    switch (type) {
      case 'VALIDATION_ERROR':
        return ErrorCategory.CLIENT;
      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
        return ErrorCategory.SECURITY;
      case 'NETWORK_ERROR':
        return ErrorCategory.NETWORK;
      case 'BUSINESS_LOGIC_ERROR':
        return ErrorCategory.BUSINESS;
      case 'API_ERROR':
      case 'DATABASE_ERROR':
      case 'CACHE_ERROR':
        return ErrorCategory.SERVER;
      default:
        return ErrorCategory.SERVER;
    }
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      context: this.context,
      statusCode: this.statusCode,
      retryable: this.retryable,
      severity: this.severity,
      category: this.category,
      cause: this.cause?.message,
      stack: this.cause?.stack?.substring(0, ERROR_CONSTANTS.MAX_STACK_TRACE_LENGTH)
    };
  }
}

export class ErrorFactory {
  
  static createValidationError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.INVALID_INPUT
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'VALIDATION_ERROR',
      code,
      message,
      this.buildContext('validation', context)
    );
  }

  static createAuthenticationError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.INVALID_CREDENTIALS
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'AUTHENTICATION_ERROR',
      code,
      message,
      this.buildContext('authentication', context),
      { severity: ErrorSeverity.HIGH, category: ErrorCategory.SECURITY }
    );
  }

  static createAuthorizationError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.ACCESS_DENIED
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'AUTHORIZATION_ERROR',
      code,
      message,
      this.buildContext('authorization', context),
      { severity: ErrorSeverity.HIGH, category: ErrorCategory.SECURITY }
    );
  }

  static createNetworkError(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
    code: string = ERROR_CODES.CONNECTION_ERROR
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'NETWORK_ERROR',
      code,
      message,
      this.buildContext('network_request', context),
      { cause, retryable: true, category: ErrorCategory.NETWORK }
    );
  }

  static createApiError(
    message: string,
    context: Partial<ErrorContext>,
    statusCode?: number,
    code: string = ERROR_CODES.API_UNAVAILABLE
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'API_ERROR',
      code,
      message,
      this.buildContext('api_request', context),
      { statusCode, category: ErrorCategory.SERVER }
    );
  }

  static createCacheError(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
    code: string = ERROR_CODES.CACHE_READ_ERROR
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'CACHE_ERROR',
      code,
      message,
      this.buildContext('cache_operation', context),
      { cause, retryable: true, category: ErrorCategory.SERVER }
    );
  }

  static createSessionError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.SESSION_EXPIRED
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'SESSION_ERROR',
      code,
      message,
      this.buildContext('session_management', context),
      { severity: ErrorSeverity.MEDIUM, category: ErrorCategory.SECURITY }
    );
  }

  static createTokenError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.TOKEN_EXPIRED
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'TOKEN_ERROR',
      code,
      message,
      this.buildContext('token_management', context),
      { severity: ErrorSeverity.MEDIUM, category: ErrorCategory.SECURITY }
    );
  }

  static createBusinessLogicError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.BUSINESS_RULE_VIOLATION
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'BUSINESS_LOGIC_ERROR',
      code,
      message,
      this.buildContext('business_logic', context),
      { category: ErrorCategory.BUSINESS }
    );
  }

  static createConfigurationError(
    message: string,
    context: Partial<ErrorContext>,
    code: string = ERROR_CODES.MISSING_CONFIGURATION
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'CONFIGURATION_ERROR',
      code,
      message,
      this.buildContext('configuration', context),
      { severity: ErrorSeverity.HIGH, category: ErrorCategory.SERVER }
    );
  }

  static createUnknownError(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error
  ): ApplicationError {
    return new ApplicationErrorImpl(
      'UNKNOWN_ERROR',
      ERROR_CODES.UNKNOWN_ERROR,
      message,
      this.buildContext('unknown_operation', context),
      { cause, severity: ErrorSeverity.CRITICAL }
    );
  }

  static fromError(
    error: Error,
    context: Partial<ErrorContext>,
    defaultType: ErrorType = 'UNKNOWN_ERROR'
  ): ApplicationError {
    // If it's already an ApplicationError, return as is
    if (error instanceof ApplicationErrorImpl) {
      return error;
    }

    // Try to infer error type from error message or constructor
    const inferredType = this.inferErrorType(error);
    const type = inferredType || defaultType;
    
    return new ApplicationErrorImpl(
      type,
      this.inferErrorCode(error, type),
      error.message || 'An unknown error occurred',
      this.buildContext('error_conversion', context),
      { cause: error }
    );
  }

  private static inferErrorType(error: Error): ErrorType | null {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    if (name.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    
    if (name.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'AUTHENTICATION_ERROR';
    }
    
    if (message.includes('network') || message.includes('fetch') || name.includes('typeerror')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('cache') || message.includes('redis')) {
      return 'CACHE_ERROR';
    }
    
    if (message.includes('session')) {
      return 'SESSION_ERROR';
    }
    
    if (message.includes('token')) {
      return 'TOKEN_ERROR';
    }
    
    return null;
  }

  private static inferErrorCode(error: Error, type: ErrorType): string {
    const message = error.message.toLowerCase();
    
    switch (type) {
      case 'VALIDATION_ERROR':
        return message.includes('required') ? ERROR_CODES.MISSING_REQUIRED_FIELD : ERROR_CODES.INVALID_INPUT;
      case 'AUTHENTICATION_ERROR':
        return message.includes('expired') ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_CREDENTIALS;
      case 'NETWORK_ERROR':
        return message.includes('timeout') ? ERROR_CODES.NETWORK_TIMEOUT : ERROR_CODES.CONNECTION_ERROR;
      case 'CACHE_ERROR':
        return message.includes('write') ? ERROR_CODES.CACHE_WRITE_ERROR : ERROR_CODES.CACHE_READ_ERROR;
      case 'SESSION_ERROR':
        return ERROR_CODES.SESSION_EXPIRED;
      case 'TOKEN_ERROR':
        return ERROR_CODES.TOKEN_EXPIRED;
      default:
        return ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  private static buildContext(operation: string, partial: Partial<ErrorContext>): ErrorContext {
    return {
      timestamp: new Date(),
      operation,
      ...partial
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}