// Session Validation Strategy - Single Responsibility: Session validation logic
import type { 
  SessionValidationStrategy, 
  SessionData, 
  SessionConfig, 
  SessionContext,
  SessionValidationResult 
} from '../types/session-types';

export class StandardSessionValidationStrategy implements SessionValidationStrategy {
  constructor(private config: SessionConfig) {}

  validateSession(
    sessionData: SessionData,
    context: SessionContext = {}
  ): SessionValidationResult {
    const now = context.currentTime || new Date();

    // Ensure dates are properly parsed (handle both Date objects and string dates from cache)
    const expiresAt = sessionData.expiresAt instanceof Date 
      ? sessionData.expiresAt 
      : new Date(sessionData.expiresAt);
    
    const createdAt = sessionData.createdAt instanceof Date 
      ? sessionData.createdAt 
      : new Date(sessionData.createdAt);
      
    const lastActivityAt = sessionData.lastActivityAt instanceof Date 
      ? sessionData.lastActivityAt 
      : new Date(sessionData.lastActivityAt);

    // Validate date parsing
    if (isNaN(expiresAt.getTime()) || isNaN(createdAt.getTime()) || isNaN(lastActivityAt.getTime())) {
      return {
        valid: false,
        error: {
          type: 'invalid',
          message: 'Session contains invalid date values',
          timestamp: now
        }
      };
    }

    // Check if session has expired
    if (now > expiresAt) {
      return {
        valid: false,
        error: {
          type: 'expired',
          message: 'Session has expired',
          timestamp: now
        }
      };
    }

    // Check IP address validation
    if (this.config.ipValidation && 
        context.ipAddress && 
        sessionData.ipAddress && 
        context.ipAddress !== sessionData.ipAddress) {
      return {
        valid: false,
        error: {
          type: 'ip_mismatch',
          message: 'IP address mismatch',
          timestamp: now
        }
      };
    }

    // Check user agent validation
    if (this.config.userAgentValidation && 
        context.userAgent && 
        sessionData.userAgent && 
        context.userAgent !== sessionData.userAgent) {
      return {
        valid: false,
        error: {
          type: 'user_agent_mismatch',
          message: 'User agent mismatch',
          timestamp: now
        }
      };
    }

    // Check if session should be renewed
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const shouldRenew = timeUntilExpiry <= this.config.renewThreshold * 1000;

    // Return session data with properly parsed dates
    const validatedSession: SessionData = {
      ...sessionData,
      expiresAt,
      createdAt,
      lastActivityAt
    };

    return {
      valid: true,
      session: validatedSession,
      shouldRenew
    };
  }
}