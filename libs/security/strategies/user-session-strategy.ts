// User Session Strategy - Single Responsibility: User session list management
import { CacheKeys, CacheTTL } from '@repo/cache';
import type { 
  UserSessionStrategy, 
  SessionConfig, 
  SessionCache
} from '../types/session-types';

export class StandardUserSessionStrategy implements UserSessionStrategy {
  constructor(
    private cache: SessionCache,
    private config: SessionConfig
  ) {}

  async addToUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const currentSessions = await this.cache.get<string[]>(userSessionsKey) || [];
      
      // Add new session ID if not already present
      if (!currentSessions.includes(sessionId)) {
        const updatedSessions = [...currentSessions, sessionId];
        
        // Enforce session limit
        if (updatedSessions.length > this.config.maxSessions) {
          await this.enforceSessionLimit(tenantId, userId);
          // Re-fetch sessions after cleanup
          const cleanedSessions = await this.cache.get<string[]>(userSessionsKey) || [];
          cleanedSessions.push(sessionId);
          await this.cache.set(userSessionsKey, cleanedSessions, CacheTTL.LONG);
        } else {
          await this.cache.set(userSessionsKey, updatedSessions, CacheTTL.LONG);
        }
      }
    } catch (error) {
      console.error('Failed to add to user sessions:', error);
    }
  }

  async removeFromUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const currentSessions = await this.cache.get<string[]>(userSessionsKey) || [];
      
      const updatedSessions = currentSessions.filter(id => id !== sessionId);
      
      if (updatedSessions.length !== currentSessions.length) {
        if (updatedSessions.length === 0) {
          await this.cache.del(userSessionsKey);
        } else {
          await this.cache.set(userSessionsKey, updatedSessions, CacheTTL.LONG);
        }
      }
    } catch (error) {
      console.error('Failed to remove from user sessions:', error);
    }
  }

  async getUserSessions(tenantId: string, userId: string): Promise<string[]> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      return await this.cache.get<string[]>(userSessionsKey) || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  async enforceSessionLimit(tenantId: string, userId: string): Promise<void> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const currentSessions = await this.cache.get<string[]>(userSessionsKey) || [];
      
      if (currentSessions.length >= this.config.maxSessions) {
        // Remove oldest sessions to make room
        const sessionsToRemove = currentSessions.slice(0, currentSessions.length - this.config.maxSessions + 1);
        
        // Destroy the old sessions
        for (const oldSessionId of sessionsToRemove) {
          // Destroy session by removing both session data and lookup
          const lookupKey = CacheKeys.sessionLookup(oldSessionId);
          const sessionKey = CacheKeys.userSession(tenantId, oldSessionId);
          await Promise.all([
            this.cache.del(sessionKey),
            this.cache.del(lookupKey)
          ]);
        }
        
        // Update user sessions list
        const remainingSessions = currentSessions.slice(sessionsToRemove.length);
        if (remainingSessions.length === 0) {
          await this.cache.del(userSessionsKey);
        } else {
          await this.cache.set(userSessionsKey, remainingSessions, CacheTTL.LONG);
        }
      }
    } catch (error) {
      console.error('Failed to enforce session limit:', error);
    }
  }
}