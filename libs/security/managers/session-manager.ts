// Refactored Session Manager - SOLID principles implementation
// Single Responsibility: Coordinate session strategies and provide unified API
// Open/Closed: Extensible via strategy injection
// Dependency Inversion: Depends on abstractions (interfaces), not concretions

import { getCacheInstance } from "@repo/cache";
import { SECURITY_CONFIG } from "@repo/utils/common/constants";
import type {
  SessionCreationStrategy,
  SessionValidationStrategy,
  SessionRenewalStrategy,
  SessionStorageStrategy,
  SessionActivityStrategy,
  SessionCleanupStrategy,
  UserSessionStrategy,
  SessionConfig,
  SessionData,
  SessionValidationResult,
  SessionContext,
  SessionCreateOptions,
  SessionCache,
} from "../types/session-types";

// Strategy implementations
import { StandardSessionCreationStrategy } from "../strategies/session-creation-strategy";
import { StandardSessionValidationStrategy } from "../strategies/session-validation-strategy";
import { StandardSessionRenewalStrategy } from "../strategies/session-renewal-strategy";
import { StandardSessionStorageStrategy } from "../strategies/session-storage-strategy";
import { StandardSessionActivityStrategy } from "../strategies/session-activity-strategy";
import { StandardSessionCleanupStrategy } from "../strategies/session-cleanup-strategy";
import { StandardUserSessionStrategy } from "../strategies/user-session-strategy";

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60,
  renewThreshold: 5 * 60, // 5 minutes
  maxSessions: 5,
  requireHttps: process.env.NODE_ENV === "production",
  trackActivity: true,
  ipValidation: true,
  userAgentValidation: true,
};

/**
 * Refactored Session Manager using Strategy Pattern and Dependency Injection
 *
 * Responsibilities:
 * 1. Coordinate different session strategies
 * 2. Provide unified session management API
 * 3. Handle high-level session workflow orchestration
 */
export class SessionManager {
  private config: SessionConfig;
  private cache: SessionCache;

  // Strategy instances - following Dependency Injection principle
  private creationStrategy: SessionCreationStrategy;
  private validationStrategy: SessionValidationStrategy;
  private renewalStrategy: SessionRenewalStrategy;
  private storageStrategy: SessionStorageStrategy;
  private activityStrategy: SessionActivityStrategy;
  private cleanupStrategy: SessionCleanupStrategy;
  private userSessionStrategy: UserSessionStrategy;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };

    // Dependency injection setup
    this.cache = getCacheInstance() as unknown as SessionCache;

    // Initialize strategies with injected dependencies
    this.creationStrategy = new StandardSessionCreationStrategy(this.config);
    this.validationStrategy = new StandardSessionValidationStrategy(
      this.config
    );
    this.renewalStrategy = new StandardSessionRenewalStrategy(this.config);
    this.storageStrategy = new StandardSessionStorageStrategy(
      this.cache,
      this.config
    );
    this.activityStrategy = new StandardSessionActivityStrategy(
      this.cache,
      this.config
    );
    this.cleanupStrategy = new StandardSessionCleanupStrategy(
      this.cache,
      this.config
    );
    this.userSessionStrategy = new StandardUserSessionStrategy(
      this.cache,
      this.config
    );
  }

  // ===== SESSION CREATION METHODS =====
  async createSession(
    userId: string,
    tenantId: string,
    options: SessionCreateOptions = {}
  ): Promise<SessionData> {
    const session = this.creationStrategy.createSession(
      userId,
      tenantId,
      options
    );

    // Store session using storage strategy
    await this.storageStrategy.storeSession(session);

    // Add to user's sessions list
    await this.userSessionStrategy.addToUserSessions(
      tenantId,
      userId,
      session.sessionId
    );

    return session;
  }

  // ===== SESSION VALIDATION METHODS =====
  async validateSession(
    sessionId: string,
    context: SessionContext = {}
  ): Promise<SessionValidationResult> {
    try {
      // Retrieve session using storage strategy
      const sessionData = await this.storageStrategy.retrieveSession(sessionId);

      if (!sessionData) {
        return {
          valid: false,
          error: {
            type: "not_found",
            message: "Session not found",
            timestamp: new Date(),
          },
        };
      }

      // Validate session using validation strategy
      const result = this.validationStrategy.validateSession(
        sessionData,
        context
      );

      // Auto-renew if needed
      if (result.valid && result.shouldRenew && result.session) {
        const renewedSession = this.renewalStrategy.renewSession(
          result.session
        );
        await this.storageStrategy.storeSession(renewedSession);
        result.session = renewedSession;
      }

      return result;
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: {
          type: "invalid",
          message: "Session validation failed",
          timestamp: new Date(),
        },
      };
    }
  }

  // ===== SESSION RENEWAL METHODS =====
  async renewSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await this.storageStrategy.retrieveSession(sessionId);
    if (!sessionData) return null;

    const renewedSession = this.renewalStrategy.renewSession(sessionData);
    await this.storageStrategy.storeSession(renewedSession);
    return renewedSession;
  }

  shouldRenewSession(sessionData: SessionData): boolean {
    return this.renewalStrategy.shouldRenew(sessionData);
  }

  // ===== SESSION DESTRUCTION METHODS =====
  async destroySession(sessionId: string): Promise<void> {
    // Get session info for user session cleanup
    const sessionData = await this.storageStrategy.retrieveSession(sessionId);

    // Destroy session using storage strategy
    await this.storageStrategy.destroySession(sessionId);

    // Remove from user's sessions list if we have the session data
    if (sessionData) {
      await this.userSessionStrategy.removeFromUserSessions(
        sessionData.tenantId,
        sessionData.userId,
        sessionId
      );
    }
  }

  async destroyAllUserSessions(
    userId: string,
    tenantId: string
  ): Promise<void> {
    await this.storageStrategy.destroyAllUserSessions(userId, tenantId);
  }

  // ===== SESSION ACTIVITY METHODS =====
  async updateActivity(
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    return await this.activityStrategy.updateActivity(sessionId, metadata);
  }

  trackLastActivity(
    sessionData: SessionData,
    metadata?: Record<string, unknown>
  ): SessionData {
    return this.activityStrategy.trackLastActivity(sessionData, metadata);
  }

  // ===== SESSION CLEANUP METHODS =====
  async cleanExpiredSessions(): Promise<number> {
    return await this.cleanupStrategy.cleanExpiredSessions();
  }

  async getActiveSessionCount(
    userId: string,
    tenantId: string
  ): Promise<number> {
    return await this.cleanupStrategy.getActiveSessionCount(userId, tenantId);
  }

  // ===== USER SESSION MANAGEMENT METHODS =====
  async getUserSessions(tenantId: string, userId: string): Promise<string[]> {
    return await this.userSessionStrategy.getUserSessions(tenantId, userId);
  }

  async enforceSessionLimit(tenantId: string, userId: string): Promise<void> {
    await this.userSessionStrategy.enforceSessionLimit(tenantId, userId);
  }

  // ===== CONFIGURATION ACCESS =====
  getConfig(): Readonly<SessionConfig> {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update strategies with new config
    this.creationStrategy = new StandardSessionCreationStrategy(this.config);
    this.validationStrategy = new StandardSessionValidationStrategy(
      this.config
    );
    this.renewalStrategy = new StandardSessionRenewalStrategy(this.config);
    this.storageStrategy = new StandardSessionStorageStrategy(
      this.cache,
      this.config
    );
    this.activityStrategy = new StandardSessionActivityStrategy(
      this.cache,
      this.config
    );
    this.cleanupStrategy = new StandardSessionCleanupStrategy(
      this.cache,
      this.config
    );
    this.userSessionStrategy = new StandardUserSessionStrategy(
      this.cache,
      this.config
    );
  }
}
