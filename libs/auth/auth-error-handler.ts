// Centralized Authentication Error Handler
// Handles JWT token expiration, logout, and redirection logic

import { toastError, toastWarning } from "@repo/utils";

/**
 * Configuration for auth error handling
 */
interface AuthErrorConfig {
  loginPath: string;
  preserveReturnUrl: boolean;
  showToastNotifications: boolean;
  clearStorageOnLogout: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AuthErrorConfig = {
  loginPath: "/login",
  preserveReturnUrl: true,
  showToastNotifications: true,
  clearStorageOnLogout: true
};

/**
 * Centralized authentication error handler
 */
export class AuthErrorHandler {
  private static instance: AuthErrorHandler | null = null;
  private config: AuthErrorConfig;
  private isHandlingAuthError = false; // Prevent multiple simultaneous redirects

  private constructor(config: Partial<AuthErrorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<AuthErrorConfig>): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler(config);
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication errors (401/403)
   */
  async handleAuthError(error: any, context?: { url?: string; userLanguage?: string }): Promise<void> {
    // Prevent multiple simultaneous auth error handling
    if (this.isHandlingAuthError) {
      console.log("🔐 AuthErrorHandler: Already handling auth error, skipping...");
      return;
    }

    this.isHandlingAuthError = true;

    try {
      const language = context?.userLanguage || this.getCurrentLanguage();
      
      console.log("🔐 AuthErrorHandler: Handling authentication error", {
        errorStatus: error.statusCode || error.status,
        errorMessage: error.message,
        url: context?.url,
        timestamp: new Date().toISOString()
      });

      // Show appropriate toast notification
      if (this.config.showToastNotifications) {
        const isExpired = this.isTokenExpiredError(error);
        
        if (isExpired) {
          toastWarning(
            language === 'mm' 
              ? 'သင့်အကောင့်ဝင်ခွင့် သက်တမ်းကုန်ပါပြီ။ ထပ်မံဝင်ရောက်ပါ။'
              : 'Your session has expired. Please log in again.'
          );
        } else {
          toastError(
            language === 'mm'
              ? 'ဒီအရင်းအမြစ်ကို ရယူရန် ခွင့်ပြုချက် မရှိပါ။'
              : 'You do not have permission to access this resource.'
          );
        }
      }

      // Clear client-side storage if configured
      if (this.config.clearStorageOnLogout) {
        await this.clearClientStorage();
      }

      // Redirect to login page after a short delay for toast to show
      setTimeout(() => {
        this.redirectToLogin(context?.url);
      }, 1000);

    } catch (redirectError) {
      console.error("🔐 AuthErrorHandler: Error during auth error handling:", redirectError);
    } finally {
      // Reset the flag after a delay to prevent rapid successive calls
      setTimeout(() => {
        this.isHandlingAuthError = false;
      }, 2000);
    }
  }

  /**
   * Handle token refresh failures
   */
  async handleTokenRefreshFailure(context?: { url?: string; userLanguage?: string }): Promise<void> {
    const language = context?.userLanguage || this.getCurrentLanguage();
    
    console.log("🔐 AuthErrorHandler: Token refresh failed, logging out user");

    if (this.config.showToastNotifications) {
      toastError(
        language === 'mm'
          ? 'အကောင့်ဝင်ခွင့် ပြန်လည်ရယူ၍ မရပါ။ ထပ်မံဝင်ရောက်ပါ။'
          : 'Unable to refresh your session. Please log in again.'
      );
    }

    await this.handleAuthError({ statusCode: 401, message: 'Token refresh failed' }, context);
  }

  /**
   * Check if error is due to expired token
   */
  private isTokenExpiredError(error: any): boolean {
    const message = (error.message || '').toLowerCase();
    const backendMessage = (error.backendMessage || '').toLowerCase();
    
    return (
      error.statusCode === 401 ||
      error.status === 401 ||
      message.includes('expired') ||
      message.includes('invalid') ||
      backendMessage.includes('expired') ||
      backendMessage.includes('invalid')
    );
  }

  /**
   * Clear client-side storage (tokens, session data, etc.)
   */
  private async clearClientStorage(): Promise<void> {
    try {
      // Only run in browser environment
      if (typeof window === 'undefined') return;

      console.log("🔐 AuthErrorHandler: Clearing client storage");

      // Clear localStorage
      const keysToRemove = [
        'auth-token',
        'refresh-token', 
        'user-data',
        'session-data',
        'wizard-form-draft', // Clear any form drafts
        'module-cache'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore localStorage errors
        }
      });

      // Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore sessionStorage errors
      }

      // Note: HttpOnly cookies (like session cookies) will be cleared by the server
      // We can't clear them from client-side JavaScript for security reasons
      
    } catch (error) {
      console.warn("🔐 AuthErrorHandler: Error clearing client storage:", error);
    }
  }

  /**
   * Redirect to login page with return URL
   */
  private redirectToLogin(currentUrl?: string): void {
    try {
      // Only run in browser environment
      if (typeof window === 'undefined') return;

      // Prevent infinite redirect loops - if we're already on login page, don't redirect again
      const currentPath = window.location.pathname;
      if (currentPath === this.config.loginPath || currentPath.endsWith('/login')) {
        console.log("🔐 AuthErrorHandler: Already on login page, preventing infinite redirect");
        return;
      }

      let loginUrl = this.config.loginPath;

      // Add return URL if configured and we have a current URL that's not already login
      if (this.config.preserveReturnUrl && currentUrl) {
        // Don't preserve URLs that are already login pages or contain recursive returnUrl
        if (!currentUrl.includes('/login') && !currentUrl.includes('returnUrl')) {
          const returnUrl = encodeURIComponent(currentUrl);
          loginUrl += `?returnUrl=${returnUrl}`;
        }
      }

      console.log("🔐 AuthErrorHandler: Redirecting to login:", loginUrl);

      // Use window.location.href for full page redirect (clears all state)
      window.location.href = loginUrl;
      
    } catch (error) {
      console.error("🔐 AuthErrorHandler: Error redirecting to login:", error);
      // Fallback: try to reload the page
      try {
        window.location.reload();
      } catch (reloadError) {
        console.error("🔐 AuthErrorHandler: Fallback reload also failed:", reloadError);
      }
    }
  }

  /**
   * Get current language from various sources
   */
  private getCurrentLanguage(): 'en' | 'mm' {
    try {
      if (typeof window !== 'undefined') {
        // Try URL path first
        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang === 'en' || pathLang === 'mm') {
          return pathLang;
        }
        
        // Try localStorage
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'en' || storedLang === 'mm') {
          return storedLang;
        }
        
        // Try cookie
        const cookieLang = document.cookie.split(';')
          .find(c => c.trim().startsWith('x-lang='))
          ?.split('=')[1];
        if (cookieLang === 'en' || cookieLang === 'mm') {
          return cookieLang;
        }
      }
    } catch (error) {
      // Ignore errors in language detection
    }
    
    return 'en'; // Default fallback
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AuthErrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if currently handling an auth error (for external use)
   */
  isHandling(): boolean {
    return this.isHandlingAuthError;
  }
}

/**
 * Convenience function to get auth error handler instance
 */
export function getAuthErrorHandler(config?: Partial<AuthErrorConfig>): AuthErrorHandler {
  return AuthErrorHandler.getInstance(config);
}

/**
 * Convenience function to handle auth errors
 */
export async function handleAuthError(
  error: any, 
  context?: { url?: string; userLanguage?: string }
): Promise<void> {
  const handler = getAuthErrorHandler();
  return handler.handleAuthError(error, context);
}

/**
 * Convenience function to handle token refresh failures  
 */
export async function handleTokenRefreshFailure(
  context?: { url?: string; userLanguage?: string }
): Promise<void> {
  const handler = getAuthErrorHandler();
  return handler.handleTokenRefreshFailure(context);
}