// Token Health Service - Background monitoring and proactive refresh
// Single Responsibility: Monitor token health and refresh before expiration

import type { TokenManager } from '../managers/token-manager';
import { TOKEN_CONSTANTS } from '../types/token-types';

interface TokenHealthConfig {
  checkIntervalMs: number;
  refreshThresholdMinutes: number;
  maxRetries: number;
}

interface ActiveSession {
  tenantId: string;
  userId?: string;
  lastCheck: number;
  retryCount: number;
}

export class TokenHealthService {
  private static instance: TokenHealthService;
  private tokenManager: TokenManager | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, ActiveSession> = new Map();
  
  private config: TokenHealthConfig = {
    checkIntervalMs: 2 * 60 * 1000, // Check every 2 minutes
    refreshThresholdMinutes: TOKEN_CONSTANTS.DEFAULT_REFRESH_THRESHOLD_MINUTES,
    maxRetries: 3
  };

  private constructor() {
    // Bind methods to maintain context
    this.performHealthCheck = this.performHealthCheck.bind(this);
  }

  static getInstance(): TokenHealthService {
    if (!TokenHealthService.instance) {
      TokenHealthService.instance = new TokenHealthService();
    }
    return TokenHealthService.instance;
  }

  /**
   * Initialize the service with TokenManager
   */
  initialize(tokenManager: TokenManager, config?: Partial<TokenHealthConfig>): void {
    this.tokenManager = tokenManager;
    
    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('🏥 TokenHealthService: Initialized with config:', this.config);
  }

  /**
   * Start monitoring token health
   */
  startMonitoring(): void {
    if (this.healthCheckTimer) {
      console.log('🏥 TokenHealthService: Already monitoring');
      return;
    }

    console.log('🏥 TokenHealthService: Starting background token monitoring');
    this.healthCheckTimer = setInterval(this.performHealthCheck, this.config.checkIntervalMs);
  }

  /**
   * Stop monitoring token health
   */
  stopMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('🏥 TokenHealthService: Stopped background token monitoring');
    }
  }

  /**
   * Register a session for monitoring
   */
  registerSession(tenantId: string, userId?: string): void {
    const sessionKey = userId ? `${tenantId}:${userId}` : tenantId;
    
    this.activeSessions.set(sessionKey, {
      tenantId,
      userId,
      lastCheck: Date.now(),
      retryCount: 0
    });

    console.log(`🏥 TokenHealthService: Registered session for monitoring: ${sessionKey}`);

    // Start monitoring if not already running
    if (!this.healthCheckTimer) {
      this.startMonitoring();
    }
  }

  /**
   * Unregister a session from monitoring
   */
  unregisterSession(tenantId: string, userId?: string): void {
    const sessionKey = userId ? `${tenantId}:${userId}` : tenantId;
    this.activeSessions.delete(sessionKey);
    
    console.log(`🏥 TokenHealthService: Unregistered session: ${sessionKey}`);

    // Stop monitoring if no active sessions
    if (this.activeSessions.size === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Perform health check on all active sessions
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.tokenManager || this.activeSessions.size === 0) {
      return;
    }

    console.log(`🏥 TokenHealthService: Performing health check on ${this.activeSessions.size} sessions`);

    const promises: Promise<void>[] = [];

    for (const entry of this.activeSessions.entries()) {
      const [sessionKey, session] = entry;
      promises.push(this.checkSessionHealth(sessionKey, session));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Check health of a specific session
   */
  private async checkSessionHealth(sessionKey: string, session: ActiveSession): Promise<void> {
    try {
      if (session.userId) {
        // Check user token health
        await this.checkUserTokenHealth(session.tenantId, session.userId, sessionKey);
      } else {
        // Check tenant token health
        await this.checkTenantTokenHealth(session.tenantId, sessionKey);
      }

      // Reset retry count on successful check
      session.retryCount = 0;
      session.lastCheck = Date.now();
    } catch (error) {
      console.error(`🏥 TokenHealthService: Health check failed for ${sessionKey}:`, error);
      session.retryCount++;

      // Remove session if it exceeds max retries
      if (session.retryCount >= this.config.maxRetries) {
        console.warn(`🏥 TokenHealthService: Removing session ${sessionKey} after ${this.config.maxRetries} failed attempts`);
        this.activeSessions.delete(sessionKey);
      }
    }
  }

  /**
   * Check user token health and refresh if needed
   */
  private async checkUserTokenHealth(tenantId: string, userId: string, sessionKey: string): Promise<void> {
    if (!this.tokenManager) return;

    // Use the enhanced ensureValidUserToken method
    const token = await this.tokenManager.ensureValidUserToken(
      tenantId, 
      userId, 
      this.config.refreshThresholdMinutes
    );

    if (!token) {
      console.warn(`🏥 TokenHealthService: Failed to ensure valid token for user session ${sessionKey}`);
      throw new Error(`Token refresh failed for user session ${sessionKey}`);
    }

    console.log(`🏥 TokenHealthService: User token health check passed for ${sessionKey}`);
  }

  /**
   * Check tenant token health and refresh if needed
   */
  private async checkTenantTokenHealth(tenantId: string, sessionKey: string): Promise<void> {
    if (!this.tokenManager) return;

    // Check if tenant token exists and is valid
    const tenantToken = await this.tokenManager.getTenantAccessToken(tenantId);
    
    if (!tenantToken) {
      // Attempt to refresh tenant token
      console.log(`🏥 TokenHealthService: Tenant token missing for ${sessionKey}, attempting refresh`);
      
      try {
        const { getTenantSecrets } = await import("@repo/tenant/wrapper");
        const tenantSecrets = await getTenantSecrets(tenantId);
        
        let clientId: string | undefined;
        let clientSecret: string | undefined;

        if (tenantSecrets?.clientId && tenantSecrets?.clientSecret) {
          clientId = tenantSecrets.clientId;
          clientSecret = tenantSecrets.clientSecret;
        } else if (
          tenantSecrets?.apiAccess?.clientId &&
          tenantSecrets?.apiAccess?.clientSecret
        ) {
          clientId = tenantSecrets.apiAccess.clientId;
          clientSecret = tenantSecrets.apiAccess.clientSecret;
        }

        if (clientId && clientSecret) {
          const refreshedToken = await this.tokenManager.getTenantAccessTokenWithRefresh(
            tenantId,
            clientId,
            clientSecret
          );
          
          if (!refreshedToken) {
            throw new Error(`Failed to refresh tenant token for ${sessionKey}`);
          }
          
          console.log(`🏥 TokenHealthService: Successfully refreshed tenant token for ${sessionKey}`);
        } else {
          throw new Error(`No tenant credentials available for ${sessionKey}`);
        }
      } catch (error) {
        console.error(`🏥 TokenHealthService: Failed to refresh tenant token for ${sessionKey}:`, error);
        throw error;
      }
    } else {
      console.log(`🏥 TokenHealthService: Tenant token health check passed for ${sessionKey}`);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    activeSessions: number;
    config: TokenHealthConfig;
  } {
    return {
      isMonitoring: this.healthCheckTimer !== null,
      activeSessions: this.activeSessions.size,
      config: this.config
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<TokenHealthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🏥 TokenHealthService: Updated config:', this.config);

    // Restart monitoring with new interval if active
    if (this.healthCheckTimer) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Cleanup on app shutdown
   */
  destroy(): void {
    this.stopMonitoring();
    this.activeSessions.clear();
    console.log('🏥 TokenHealthService: Destroyed');
  }
}

// Export singleton instance
export const tokenHealthService = TokenHealthService.getInstance();