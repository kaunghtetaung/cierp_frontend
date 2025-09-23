// Tenant Token Initializer - Server-side token initialization after tenant settings retrieval
import { cache } from "react";
import type { TenantSettingsDto } from "@repo/types";
import { TenantTokenStrategy } from "@repo/auth/tenant-token-strategy";
import { getCacheInstance } from "@repo/cache";

export interface TokenInitializationResult {
  success: boolean;
  hasCredentials: boolean;
  tokenCreated: boolean;
  error?: string;
  details?: {
    tenantId: string;
    clientIdFound: boolean;
    clientSecretFound: boolean;
  };
}

/**
 * Initialize tenant access token after tenant settings are retrieved
 * This function is cached at the request level to ensure single execution
 * 
 * Flow:
 * 1. Extract apiAccess credentials from tenant settings
 * 2. Create tenant access token using those credentials
 * 3. Cache the token for subsequent API calls
 * 
 * @param tenantSettings - Full tenant settings including secrets
 * @returns Initialization result with status and details
 */
export const initializeTenantToken = cache(
  async (tenantSettings: TenantSettingsDto | null): Promise<TokenInitializationResult> => {
    // Early return if no tenant settings
    if (!tenantSettings) {
      console.log("🚫 Token Initializer: No tenant settings provided");
      return {
        success: false,
        hasCredentials: false,
        tokenCreated: false,
        error: "No tenant settings available"
      };
    }

    const tenantId = tenantSettings.id;
    console.log(`\n🔧 === TENANT TOKEN INITIALIZER START === Tenant: ${tenantId}`);

    try {
      // Check if tenant has secrets
      if (!tenantSettings.secret) {
        console.log(`⚠️ Token Initializer: No secrets found for tenant ${tenantId}`);
        return {
          success: false,
          hasCredentials: false,
          tokenCreated: false,
          error: "Tenant has no secrets configured",
          details: {
            tenantId,
            clientIdFound: false,
            clientSecretFound: false
          }
        };
      }

      // Extract API access credentials
      let clientId: string | undefined;
      let clientSecret: string | undefined;

      // Check for apiAccess credentials (preferred)
      if (tenantSettings.secret.apiAccess) {
        clientId = tenantSettings.secret.apiAccess.clientId;
        clientSecret = tenantSettings.secret.apiAccess.clientSecret;
        console.log(`🔍 Token Initializer: Found apiAccess credentials`);
      }
      
      // Fallback to root-level credentials (legacy support)
      if (!clientId && !clientSecret && tenantSettings.secret) {
        const secrets = tenantSettings.secret as any;
        if (secrets.clientId && secrets.clientSecret) {
          clientId = secrets.clientId;
          clientSecret = secrets.clientSecret;
          console.log(`🔍 Token Initializer: Found root-level credentials (legacy)`);
        }
      }

      // Check if we have valid credentials
      const hasClientId = !!clientId;
      const hasClientSecret = !!clientSecret;
      const hasCredentials = hasClientId && hasClientSecret;

      if (!hasCredentials) {
        console.log(`❌ Token Initializer: Missing credentials for tenant ${tenantId}`);
        console.log(`   - Client ID found: ${hasClientId}`);
        console.log(`   - Client Secret found: ${hasClientSecret}`);
        
        return {
          success: false,
          hasCredentials: false,
          tokenCreated: false,
          error: "Missing API credentials in tenant settings",
          details: {
            tenantId,
            clientIdFound: hasClientId,
            clientSecretFound: hasClientSecret
          }
        };
      }

      // Create tenant token strategy
      const cacheInstance = getCacheInstance();
      const tokenStrategy = new TenantTokenStrategy(cacheInstance);

      // Check if token already exists
      const existingToken = await tokenStrategy.getToken(tenantId);
      if (existingToken) {
        console.log(`✅ Token Initializer: Tenant token already exists for ${tenantId}`);
        return {
          success: true,
          hasCredentials: true,
          tokenCreated: false, // Already existed
          details: {
            tenantId,
            clientIdFound: true,
            clientSecretFound: true
          }
        };
      }

      // Create new tenant token
      console.log(`🔄 Token Initializer: Creating tenant access token for ${tenantId}`);
      const newToken = await tokenStrategy.createTenantToken(
        tenantId,
        clientId!,
        clientSecret!
      );

      if (newToken) {
        console.log(`✅ Token Initializer: Successfully created tenant token for ${tenantId}`);
        console.log(`🔧 === TENANT TOKEN INITIALIZER SUCCESS ===\n`);
        
        return {
          success: true,
          hasCredentials: true,
          tokenCreated: true,
          details: {
            tenantId,
            clientIdFound: true,
            clientSecretFound: true
          }
        };
      } else {
        console.error(`❌ Token Initializer: Failed to create token for ${tenantId}`);
        console.log(`🔧 === TENANT TOKEN INITIALIZER FAILED ===\n`);
        
        return {
          success: false,
          hasCredentials: true,
          tokenCreated: false,
          error: "Failed to create tenant access token",
          details: {
            tenantId,
            clientIdFound: true,
            clientSecretFound: true
          }
        };
      }

    } catch (error) {
      console.error(`❌ Token Initializer: Error initializing token for ${tenantId}:`, error);
      console.log(`🔧 === TENANT TOKEN INITIALIZER ERROR ===\n`);
      
      return {
        success: false,
        hasCredentials: false,
        tokenCreated: false,
        error: error instanceof Error ? error.message : "Unknown error during initialization",
        details: {
          tenantId,
          clientIdFound: false,
          clientSecretFound: false
        }
      };
    }
  }
);

/**
 * Initialize tenant token from tenant ID
 * This is a convenience function that fetches tenant settings first
 */
export const initializeTenantTokenById = cache(
  async (tenantId: string): Promise<TokenInitializationResult> => {
    try {
      // Get tenant settings with secrets
      const { getTenantWithSecrets } = await import("./wrapper");
      const tenantSettings = await getTenantWithSecrets(tenantId);
      
      if (!tenantSettings) {
        return {
          success: false,
          hasCredentials: false,
          tokenCreated: false,
          error: `Failed to fetch tenant settings for ${tenantId}`
        };
      }

      // Initialize token with the settings
      return await initializeTenantToken(tenantSettings);
    } catch (error) {
      console.error(`Error fetching tenant settings for initialization:`, error);
      return {
        success: false,
        hasCredentials: false,
        tokenCreated: false,
        error: error instanceof Error ? error.message : "Failed to fetch tenant settings"
      };
    }
  }
);

/**
 * Check if tenant token exists without creating it
 */
export async function checkTenantTokenExists(tenantId: string): Promise<boolean> {
  try {
    const cacheInstance = getCacheInstance();
    const tokenStrategy = new TenantTokenStrategy(cacheInstance);
    const token = await tokenStrategy.getToken(tenantId);
    return !!token;
  } catch (error) {
    console.error(`Error checking tenant token:`, error);
    return false;
  }
}