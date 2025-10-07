"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import type { User } from "@repo/types";
import { RefreshCw, Key, Shield, User as UserIcon, Clock } from "lucide-react";

interface TestTokenClientProps {
  user: User | null;
}

interface TokenInfo {
  exists: boolean;
  redisTTL?: number;
  jwtExpiryTimestamp?: number;
  jwtRemainingSeconds?: number;
  jwtIsExpired?: boolean;
  token?: string;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export function TestTokenClient({ user }: TestTokenClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [initializerToken, setInitializerToken] = useState<TokenInfo | null>(null);
  const [tenantToken, setTenantToken] = useState<TokenInfo | null>(null);
  const [userAccessToken, setUserAccessToken] = useState<TokenInfo | null>(null);
  const [userRefreshToken, setUserRefreshToken] = useState<TokenInfo | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all token information
  const fetchAllTokens = async () => {
    try {
      const response = await fetch('/testToken/api/tokens');
      const data = await response.json();

      if (data.success) {
        setInitializerToken(data.tokens.initializer);
        setTenantToken(data.tokens.tenant);
        setUserAccessToken(data.tokens.userAccess);
        setUserRefreshToken(data.tokens.userRefresh);
        setSessionInfo(data.session);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  };

  useEffect(() => {
    fetchAllTokens();
  }, []);

  const handleRefreshInitializer = async () => {
    setLoading('initializer');
    setMessage(null);

    try {
      const response = await fetch('/testToken/api/refresh-initializer', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Initializer token refreshed successfully!' });
        await fetchAllTokens();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to refresh initializer token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error refreshing initializer token' });
    } finally {
      setLoading(null);
    }
  };

  const handleRefreshTenant = async () => {
    setLoading('tenant');
    setMessage(null);

    try {
      const response = await fetch('/testToken/api/refresh-tenant', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Tenant token refreshed successfully!' });
        await fetchAllTokens();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to refresh tenant token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error refreshing tenant token' });
    } finally {
      setLoading(null);
    }
  };

  const handleRefreshUserToken = async () => {
    setLoading('user');
    setMessage(null);

    try {
      const response = await fetch('/testToken/api/refresh-user', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'User access token refreshed successfully!' });
        await fetchAllTokens();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to refresh user token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error refreshing user token' });
    } finally {
      setLoading(null);
    }
  };

  const handleExtendSession = async () => {
    setLoading('session');
    setMessage(null);

    try {
      const response = await fetch('/testToken/api/extend-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Session extended successfully!' });
        await fetchAllTokens();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to extend session' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error extending session' });
    } finally {
      setLoading(null);
    }
  };

  const formatExpiresIn = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Test Page</h1>
          <p className="text-gray-600">
            Test token renewal strategies and session management
          </p>
        </div>

        {/* User Information */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-900">Current User</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-mono text-xs text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tenant ID</p>
                <p className="font-mono text-xs text-gray-900">{user.tenantId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profile State</p>
                <p className="font-medium text-gray-900">{user.profileState || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Roles</p>
                <p className="font-medium text-gray-900">
                  {user.roles?.map((r: any) => r.Role || r).join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Token Refresh Buttons */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {/* Initializer Token */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Initializer Token</h3>
            </div>
            <div className="mb-4 text-sm space-y-1">
              <p className="text-gray-600">Status: {initializerToken?.exists ? '✅ Exists' : '❌ Missing'}</p>
              {initializerToken?.redisTTL !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">Redis TTL:</span> {formatExpiresIn(initializerToken.redisTTL)}
                </p>
              )}
              {initializerToken?.jwtRemainingSeconds !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">JWT Expires:</span> {formatExpiresIn(initializerToken.jwtRemainingSeconds)}
                  {initializerToken.jwtIsExpired && <span className="text-red-600 ml-1">(Expired!)</span>}
                </p>
              )}
            </div>
            <Button
              onClick={handleRefreshInitializer}
              disabled={loading !== null}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading === 'initializer' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Initializer
                </>
              )}
            </Button>
          </div>

          {/* Tenant Token */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Tenant Token</h3>
            </div>
            <div className="mb-4 text-sm space-y-1">
              <p className="text-gray-600">Status: {tenantToken?.exists ? '✅ Exists' : '❌ Missing'}</p>
              {tenantToken?.redisTTL !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">Redis TTL:</span> {formatExpiresIn(tenantToken.redisTTL)}
                </p>
              )}
              {tenantToken?.jwtRemainingSeconds !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">JWT Expires:</span> {formatExpiresIn(tenantToken.jwtRemainingSeconds)}
                  {tenantToken.jwtIsExpired && <span className="text-red-600 ml-1">(Expired!)</span>}
                </p>
              )}
            </div>
            <Button
              onClick={handleRefreshTenant}
              disabled={loading !== null}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading === 'tenant' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Tenant
                </>
              )}
            </Button>
          </div>

          {/* User Access Token */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">User Access</h3>
            </div>
            <div className="mb-4 text-sm space-y-1">
              <p className="text-gray-600">Status: {userAccessToken?.exists ? '✅ Exists' : '❌ Missing'}</p>
              {userAccessToken?.redisTTL !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">Redis TTL:</span> {formatExpiresIn(userAccessToken.redisTTL)}
                </p>
              )}
              {userAccessToken?.jwtRemainingSeconds !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">JWT Expires:</span> {formatExpiresIn(userAccessToken.jwtRemainingSeconds)}
                  {userAccessToken.jwtIsExpired && <span className="text-red-600 ml-1">(Expired!)</span>}
                </p>
              )}
            </div>
            <Button
              onClick={handleRefreshUserToken}
              disabled={loading !== null || !user}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading === 'user' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh User
                </>
              )}
            </Button>
          </div>

          {/* User Refresh Token */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-gray-900">User Refresh</h3>
            </div>
            <div className="mb-4 text-sm space-y-1">
              <p className="text-gray-600">Status: {userRefreshToken?.exists ? '✅ Exists' : '❌ Missing'}</p>
              {userRefreshToken?.redisTTL !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">Redis TTL:</span> {formatExpiresIn(userRefreshToken.redisTTL)}
                </p>
              )}
              {userRefreshToken?.jwtRemainingSeconds !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">JWT Expires:</span> {formatExpiresIn(userRefreshToken.jwtRemainingSeconds)}
                  {userRefreshToken.jwtIsExpired && <span className="text-red-600 ml-1">(Expired!)</span>}
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Auto-refreshed with User Access
            </div>
          </div>
        </div>

        {/* Session Information */}
        {sessionInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-gray-900">Session Information</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Session ID</p>
                <p className="font-mono text-xs text-gray-900">{sessionInfo.sessionId.substring(0, 32)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="text-sm text-gray-900">{formatDate(sessionInfo.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-sm text-gray-900">{formatDate(sessionInfo.lastActivityAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expires At</p>
                <p className="text-sm text-gray-900">{formatDate(sessionInfo.expiresAt)}</p>
              </div>
            </div>
            <Button
              onClick={handleExtendSession}
              disabled={loading !== null}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading === 'session' ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Extend Session
                </>
              )}
            </Button>
          </div>
        )}

        {/* Token Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">Token Details</h3>
          <div className="space-y-4">
            {/* Initializer Token Details */}
            {initializerToken?.token && (
              <div>
                <p className="text-sm font-medium text-purple-600 mb-2">Initializer Token (JWT)</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {initializerToken.token.substring(0, 200)}...
                </pre>
              </div>
            )}

            {/* Tenant Token Details */}
            {tenantToken?.token && (
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">Tenant Token (JWT)</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {tenantToken.token.substring(0, 200)}...
                </pre>
              </div>
            )}

            {/* User Access Token Details */}
            {userAccessToken?.token && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">User Access Token (JWT)</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {userAccessToken.token.substring(0, 200)}...
                </pre>
              </div>
            )}

            {/* User Refresh Token Details */}
            {userRefreshToken?.token && typeof userRefreshToken.token === 'string' && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">User Refresh Token (JWT)</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {userRefreshToken.token.substring(0, 200)}...
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Refresh All Button */}
        <div className="mt-6">
          <Button
            onClick={fetchAllTokens}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All Information
          </Button>
        </div>
      </div>
    </div>
  );
}
