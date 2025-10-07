"use client";

import { useState, useEffect } from "react";
import { TOKEN_LIFETIME_CONFIG, describeTokenConfig } from "@repo/auth/config";

interface TokenConfig {
  tokenLifetime: number;
  redisTTL: number;
  safetyMargin: number;
  refreshThreshold: number;
}

export function TokenConfigClient() {
  const [configs, setConfigs] = useState<Record<string, TokenConfig>>({});

  useEffect(() => {
    // Load the configuration on mount
    setConfigs(TOKEN_LIFETIME_CONFIG);
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m (${seconds}s)`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h (${Math.floor(seconds / 60)}m)`;
    } else {
      return `${Math.floor(seconds / 86400)}d (${Math.floor(seconds / 3600)}h)`;
    }
  };

  const getTokenTypeColor = (tokenType: string): string => {
    switch (tokenType) {
      case "initializerToken":
        return "bg-purple-100 dark:bg-purple-900";
      case "tenantAccessToken":
        return "bg-blue-100 dark:bg-blue-900";
      case "userAccessToken":
        return "bg-green-100 dark:bg-green-900";
      case "userRefreshToken":
        return "bg-orange-100 dark:bg-orange-900";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  const getTokenTypeBadgeColor = (tokenType: string): string => {
    switch (tokenType) {
      case "initializerToken":
        return "bg-purple-500 text-white";
      case "tenantAccessToken":
        return "bg-blue-500 text-white";
      case "userAccessToken":
        return "bg-green-500 text-white";
      case "userRefreshToken":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTokenTypeLabel = (tokenType: string): string => {
    switch (tokenType) {
      case "initializerToken":
        return "Initializer Token";
      case "tenantAccessToken":
        return "Tenant Access Token";
      case "userAccessToken":
        return "User Access Token";
      case "userRefreshToken":
        return "User Refresh Token";
      default:
        return tokenType;
    }
  };

  const getTokenTypeDescription = (tokenType: string): string => {
    switch (tokenType) {
      case "initializerToken":
        return "Used for fetching tenant settings and system initialization. Grant: client_credentials, Scope: tenant:read";
      case "tenantAccessToken":
        return "Used for accessing tenant-specific resources, content, and pages. Grant: client_credentials, Scope: api.read, Credentials: secret.apiAccess";
      case "userAccessToken":
        return "Used for user-authenticated API calls and user-specific operations. Grant: authorization_code, refresh_token, Credentials: secret.logInFlow";
      case "userRefreshToken":
        return "Used for obtaining new user access tokens. Long-lived token stored securely in Redis.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Token Lifetime Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View token lifetime and Redis TTL settings for each token type
          </p>
        </div>

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Object.entries(configs).map(([tokenType, config]) => (
            <div
              key={tokenType}
              className={`${getTokenTypeColor(tokenType)} rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700`}
            >
              {/* Header */}
              <div className="mb-4">
                <span
                  className={`${getTokenTypeBadgeColor(tokenType)} px-3 py-1 rounded-full text-sm font-semibold`}
                >
                  {getTokenTypeLabel(tokenType)}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {getTokenTypeDescription(tokenType)}
              </p>

              {/* Configuration Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Token Lifetime:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDuration(config.tokenLifetime)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Redis TTL:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDuration(config.redisTTL)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Safety Margin:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDuration(config.safetyMargin)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Refresh Threshold:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDuration(config.refreshThreshold)}
                  </span>
                </div>

                {/* Effective Valid Time */}
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Effective Valid Time:
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatDuration(config.tokenLifetime - config.safetyMargin)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Token is considered valid until safety margin
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Configuration Guide
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Token Lifetime
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The actual JWT token validity period from the OIDC provider. This is how long the
                token is valid before it expires.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Redis TTL
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How long the token is cached in Redis before being automatically removed. Should be
                ≤ Token Lifetime to prevent caching expired tokens.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Safety Margin
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Buffer time before token expiry to trigger refresh. For example, if 5 minutes, the
                token will be refreshed 5 minutes before it actually expires.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Refresh Threshold
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If token TTL is below this value, trigger proactive refresh. Used for background
                token renewal to prevent expiration during active use.
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Best Practices
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Redis TTL should be ≤ Token Lifetime to prevent caching expired tokens</li>
                <li>Safety Margin ensures tokens are refreshed before they expire</li>
                <li>Longer Redis TTL = fewer token refreshes = better performance</li>
                <li>Shorter Redis TTL = more security (forced re-authentication)</li>
                <li>Refresh Threshold enables proactive background token renewal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration File Location */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Configuration File
          </h3>
          <code className="text-xs text-gray-700 dark:text-gray-300 font-mono">
            /libs/auth/config/token-config.ts
          </code>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Edit this file to modify token lifetime and Redis TTL settings
          </p>
        </div>
      </div>
    </div>
  );
}
