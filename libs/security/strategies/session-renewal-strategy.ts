// Session Renewal Strategy - Single Responsibility: Session renewal logic
import type { 
  SessionRenewalStrategy, 
  SessionData, 
  SessionConfig 
} from '../types/session-types';

export class StandardSessionRenewalStrategy implements SessionRenewalStrategy {
  constructor(private config: SessionConfig) {}

  renewSession(sessionData: SessionData): SessionData {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge * 1000);

    return {
      ...sessionData,
      expiresAt,
      lastActivityAt: now
    };
  }

  shouldRenew(sessionData: SessionData): boolean {
    const now = new Date();
    const expiresAt = sessionData.expiresAt instanceof Date 
      ? sessionData.expiresAt 
      : new Date(sessionData.expiresAt);
    
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    return timeUntilExpiry <= this.config.renewThreshold * 1000;
  }
}