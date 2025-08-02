// Session Activity Strategy - Single Responsibility: Session activity tracking
import { CacheKeys } from '@repo/cache';
import type { 
  SessionActivityStrategy, 
  SessionData, 
  SessionConfig, 
  SessionCache 
} from '../types/session-types';

export class StandardSessionActivityStrategy implements SessionActivityStrategy {
  constructor(
    private cache: SessionCache,
    private config: SessionConfig
  ) {}

  async updateActivity(
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // First retrieve the session to get tenant info
      const lookupKey = CacheKeys.sessionLookup(sessionId);
      const lookupData = await this.cache.get<{ userId: string; tenantId: string }>(lookupKey);
      
      if (!lookupData) {
        return false;
      }

      const sessionKey = CacheKeys.userSession(lookupData.tenantId, sessionId);
      const sessionData = await this.cache.get<SessionData>(sessionKey);
      
      if (!sessionData) {
        return false;
      }

      const updatedSession = this.trackLastActivity(sessionData, metadata);
      await this.cache.set(sessionKey, updatedSession, this.config.maxAge);
      
      return true;
    } catch (error) {
      console.error('Failed to update session activity:', error);
      return false;
    }
  }

  trackLastActivity(
    sessionData: SessionData,
    metadata?: Record<string, unknown>
  ): SessionData {
    const now = new Date();
    
    return {
      ...sessionData,
      lastActivityAt: now,
      metadata: metadata ? { ...sessionData.metadata, ...metadata } : sessionData.metadata
    };
  }
}