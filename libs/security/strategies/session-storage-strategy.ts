// Session Storage Strategy - Single Responsibility: Session storage operations
import { CacheKeys } from '@repo/cache';
import type { 
  SessionStorageStrategy, 
  SessionData, 
  SessionConfig, 
  SessionCache,
  SESSION_CONSTANTS
} from '../types/session-types';

export class StandardSessionStorageStrategy implements SessionStorageStrategy {
  constructor(
    private cache: SessionCache,
    private config: SessionConfig
  ) {}

  async storeSession(sessionData: SessionData): Promise<void> {
    const sessionKey = CacheKeys.userSession(sessionData.tenantId, sessionData.sessionId);
    const lookupKey = CacheKeys.sessionLookup(sessionData.sessionId);
    
    await Promise.all([
      // Store session data
      this.cache.set(sessionKey, sessionData, this.config.maxAge),
      // Store global session lookup to find tenant
      this.cache.set(lookupKey, { 
        userId: sessionData.userId, 
        tenantId: sessionData.tenantId 
      }, this.config.maxAge)
    ]);
  }

  async retrieveSession(sessionId: string): Promise<SessionData | null> {
    try {
      // First, lookup which tenant this session belongs to
      const lookupKey = CacheKeys.sessionLookup(sessionId);
      const lookupData = await this.cache.get<{ userId: string; tenantId: string }>(lookupKey);
      
      if (!lookupData) {
        return null;
      }
      
      // Now get the actual session data from tenant-scoped key
      const sessionKey = CacheKeys.userSession(lookupData.tenantId, sessionId);
      const sessionData = await this.cache.get<SessionData>(sessionKey);
      
      return sessionData;
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      // Get session info first for cleanup
      const lookupKey = CacheKeys.sessionLookup(sessionId);
      const sessionInfo = await this.cache.get<{ userId: string; tenantId: string }>(lookupKey);
      
      if (!sessionInfo) {
        console.warn(`Session lookup not found for sessionId: ${sessionId}`);
        return;
      }
      
      // Remove session data using tenant-scoped key
      const sessionKey = CacheKeys.userSession(sessionInfo.tenantId, sessionId);
      
      await Promise.all([
        this.cache.del(sessionKey),
        this.cache.del(lookupKey)
      ]);
    } catch (error) {
      console.error('Failed to destroy session:', error);
    }
  }

  async destroyAllUserSessions(userId: string, tenantId: string): Promise<void> {
    try {
      // Get all user sessions using tenant-scoped key
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const sessionIds = await this.cache.get<string[]>(userSessionsKey) || [];
      
      // Destroy each session
      const destroyPromises = sessionIds.map(sessionId => this.destroySession(sessionId));
      await Promise.all(destroyPromises);
      
      // Clear the user sessions list
      await this.cache.del(userSessionsKey);
    } catch (error) {
      console.error('Failed to destroy all user sessions:', error);
    }
  }
}