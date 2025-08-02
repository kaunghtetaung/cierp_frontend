// Session Cleanup Strategy - Single Responsibility: Session cleanup operations
import { CacheKeys } from '@repo/cache';
import type { 
  SessionCleanupStrategy, 
  SessionConfig, 
  SessionCache,
  SESSION_CONSTANTS
} from '../types/session-types';

export class StandardSessionCleanupStrategy implements SessionCleanupStrategy {
  constructor(
    private cache: SessionCache,
    private config: SessionConfig
  ) {}

  async cleanExpiredSessions(): Promise<number> {
    try {
      // Redis automatically handles TTL, but we can clean up orphaned lookups
      // This is primarily for maintenance and consistency
      
      // Get all session lookup keys
      const lookupPattern = 'SessionLookup:*';
      const lookupKeys = await this.cache.getKeysPattern(lookupPattern);
      
      let cleanedCount = 0;
      
      for (const lookupKey of lookupKeys) {
        const sessionId = lookupKey.split(':').pop();
        if (sessionId) {
          // Get tenant info to build proper session key
          const lookupData = await this.cache.get<{ userId: string; tenantId: string }>(lookupKey);
          if (lookupData) {
            const sessionKey = CacheKeys.userSession(lookupData.tenantId, sessionId);
            const sessionExists = await this.cache.exists(sessionKey);
            
            if (!sessionExists) {
              // Session expired but lookup still exists - clean it up
              await this.cache.del(lookupKey);
              cleanedCount++;
            }
          } else {
            // Orphaned lookup key
            await this.cache.del(lookupKey);
            cleanedCount++;
          }
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Failed to clean expired sessions:', error);
      return 0;
    }
  }

  async getActiveSessionCount(userId: string, tenantId: string): Promise<number> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const sessionIds = await this.cache.get<string[]>(userSessionsKey) || [];
      return sessionIds.length;
    } catch (error) {
      console.error('Failed to get active session count:', error);
      return 0;
    }
  }
}