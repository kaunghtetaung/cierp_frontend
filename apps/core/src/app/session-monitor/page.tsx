"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { Separator } from '@repo/ui';
import { useLanguage } from '@repo/language';
import { toastSuccess, toastError, toastWarning } from '@repo/utils';
import type { User, AuthSession } from '@repo/types';

interface SessionMonitorData {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  tenantId: string | null;
  error?: string;
}

interface TokenStatus {
  type: string;
  status: 'active' | 'expired' | 'missing';
  expiresAt: string | null;
  isExpired: boolean;
  timeRemaining: number | null;
  createdAt?: string;
  tokenType?: string;
}

interface TokenData {
  success: boolean;
  tokens: {
    initializer: TokenStatus;
    tenant: TokenStatus;
    userAccess: TokenStatus;
    userRefresh: TokenStatus;
  };
  user: {
    id: string;
    tenantId: string;
  };
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  tenantId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
}

interface SessionsData {
  success: boolean;
  sessions: SessionInfo[];
  isAdmin: boolean;
}

export default function SessionMonitorPage() {
  const { currentLanguage } = useLanguage();
  const [sessionData, setSessionData] = useState<SessionMonitorData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [sessionsData, setSessionsData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current' | 'tokens' | 'sessions'>('current');

  // Fetch session data
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      } else {
        setSessionData({
          isAuthenticated: false,
          user: null,
          session: null,
          tenantId: null,
          error: 'Failed to fetch session data'
        });
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      setSessionData({
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId: null,
        error: 'Network error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch token data
  const fetchTokenData = async () => {
    try {
      const response = await fetch('/api/auth/tokens', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTokenData(data);
      } else {
        console.error('Failed to fetch token data');
        setTokenData(null);
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error);
      setTokenData(null);
    }
  };

  // Fetch sessions data
  const fetchSessionsData = async () => {
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSessionsData(data);
      } else {
        console.error('Failed to fetch sessions data');
        setSessionsData(null);
      }
    } catch (error) {
      console.error('Failed to fetch sessions data:', error);
      setSessionsData(null);
    }
  };

  // Extend session
  const extendSession = async () => {
    try {
      setExtending(true);
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toastSuccess(
          currentLanguage === 'mm' 
            ? '🎉 အကောင့်ဝင်ခွင့် သက်တမ်းတိုးပြီးပါပြီ - သင့်အကောင့်ကို ဆက်လက်အသုံးပြုနိုင်ပါပြီ'
            : '🎉 Session extended successfully - You can continue working without interruption',
          {
            duration: 5000
          }
        );
        
        // Refresh session data to show new expiry time
        await fetchAllData();
      } else {
        const error = await response.json();
        toastError(
          currentLanguage === 'mm'
            ? 'အကောင့်ဝင်ခွင့် သက်တမ်းတိုးမှု မအောင်မြင်ပါ - ' + (error.error || 'ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ သို့မဟုတ် ပြန်လည်လော့ဂ်အင်လုပ်ပါ')
            : 'Failed to extend session - ' + (error.error || 'Please try again or log in again'),
          {
            duration: 8000
          }
        );
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      toastError(
        currentLanguage === 'mm'
          ? 'အကောင့်ဝင်ခွင့် သက်တမ်းတိုးရာတွင် ပြဿနာတွေ့ရှိပါသည် - ကွန်ယက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ'
          : 'Session extension failed - Please check your connection and try again',
        {
          duration: 8000
        }
      );
    } finally {
      setExtending(false);
    }
  };

  // Calculate time remaining
  useEffect(() => {
    if (!sessionData?.session?.expiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const expiresAt = new Date(sessionData.session!.expiresAt);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        setTimeRemaining(`${hours}h ${remainingMinutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [sessionData?.session?.expiresAt]);

  // Fetch all data together
  const fetchAllData = async () => {
    await Promise.all([
      fetchSessionData(),
      fetchTokenData(),
      fetchSessionsData()
    ]);
  };

  // Force logout specific session
  const forceLogout = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toastSuccess(result.message || 'Session logged out successfully');
        await fetchSessionsData(); // Refresh sessions list
      } else {
        const error = await response.json();
        toastError(error.error || 'Failed to logout session');
      }
    } catch (error) {
      console.error('Failed to force logout:', error);
      toastError('Network error occurred while logging out session');
    }
  };

  // Format time remaining helper
  const formatTimeRemaining = (timeMs: number | null) => {
    if (!timeMs || timeMs <= 0) return 'Expired';
    
    const minutes = Math.floor(timeMs / (1000 * 60));
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Initial load and refresh every 30 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <IconComponent name="Monitor" className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု' : 'Session Monitor'}
          </h1>
        </div>
        <div className="flex justify-center py-8">
          <IconComponent name="Loader2" className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <IconComponent name="Monitor" className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု' : 'Session Monitor'}
          </h1>
        </div>
        <Alert>
          <IconComponent name="AlertTriangle" className="h-4 w-4" />
          <AlertDescription>
            {currentLanguage === 'mm' 
              ? 'အကောင့်ဝင်ခွင့် အချက်အလက်များကို ရယူ၍ မရပါ'
              : 'Failed to load session data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconComponent name="Monitor" className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု' : 'Session Monitor'}
          </h1>
        </div>
        <Button 
          onClick={fetchAllData} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <IconComponent name="RefreshCw" className="h-4 w-4 mr-2" />
          {currentLanguage === 'mm' ? 'ပြန်လည်ဖွင့်' : 'Refresh'}
        </Button>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent 
              name={sessionData.isAuthenticated ? "CheckCircle" : "XCircle"} 
              className={`h-5 w-5 ${sessionData.isAuthenticated ? 'text-green-500' : 'text-red-500'}`}
            />
            {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် အခြေအနေ' : 'Authentication Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {currentLanguage === 'mm' ? 'အခြေအနေ' : 'Status'}
              </span>
              <Badge variant={sessionData.isAuthenticated ? "default" : "destructive"}>
                {sessionData.isAuthenticated 
                  ? (currentLanguage === 'mm' ? 'အကောင့်ဝင်ပြီး' : 'Authenticated')
                  : (currentLanguage === 'mm' ? 'အကောင့်မဝင်ရောက်ရသေး' : 'Not Authenticated')
                }
              </Badge>
            </div>

            {sessionData.tenantId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {currentLanguage === 'mm' ? 'အဖွဲ့အစည်း ID' : 'Tenant ID'}
                </span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {sessionData.tenantId}
                </code>
              </div>
            )}

            {sessionData.error && (
              <Alert>
                <IconComponent name="AlertTriangle" className="h-4 w-4" />
                <AlertDescription>{sessionData.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {sessionData.isAuthenticated && sessionData.user && (
        <>
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent name="User" className="h-5 w-5" />
                {currentLanguage === 'mm' ? 'အသုံးပြုသူ အချက်အလက်' : 'User Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {currentLanguage === 'mm' ? 'အမည်' : 'Name'}
                    </span>
                    <span className="font-medium">{sessionData.user.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {currentLanguage === 'mm' ? 'အီးမေးလ်' : 'Email'}
                    </span>
                    <span className="font-medium">{sessionData.user.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {currentLanguage === 'mm' ? 'အသုံးပြုသူ ID' : 'User ID'}
                    </span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {sessionData.user.id}
                    </code>
                  </div>
                </div>

                <div className="space-y-3">
                  {sessionData.user.roles && sessionData.user.roles.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">
                        {currentLanguage === 'mm' ? 'ရာထူးများ' : 'Roles'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sessionData.user.roles.map((role, index) => {
                          // Handle both string roles and object roles
                          let roleText = '';
                          
                          if (typeof role === 'string') {
                            roleText = role;
                          } else if (typeof role === 'object' && role !== null) {
                            // For object roles like {Organization, Department, Role, _id}
                            const roleObj = role as any; // Type assertion to handle dynamic object properties
                            const roleName = roleObj.Role || roleObj.role || roleObj.name;
                            const orgName = roleObj.Organization || roleObj.organization;
                            const deptName = roleObj.Department || roleObj.department;
                            
                            if (roleName && orgName) {
                              roleText = `${roleName} (${orgName}${deptName ? ` - ${deptName}` : ''})`;
                            } else if (roleName) {
                              roleText = roleName;
                            } else {
                              // Fallback to a readable representation
                              const keys = Object.keys(roleObj).filter(key => key !== '_id');
                              roleText = keys.map(key => `${key}: ${roleObj[key]}`).join(', ');
                            }
                          } else {
                            roleText = String(role);
                          }
                          
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {roleText}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sessionData.user.permissions && sessionData.user.permissions.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">
                        {currentLanguage === 'mm' ? 'ခွင့်ပြုချက်များ' : 'Permissions'}
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {sessionData.user.permissions.slice(0, 10).map((permission, index) => {
                          // Handle both string permissions and object permissions
                          let permissionText = '';
                          
                          if (typeof permission === 'string') {
                            permissionText = permission;
                          } else if (typeof permission === 'object' && permission !== null) {
                            const permObj = permission as any; // Type assertion to handle dynamic object properties
                            permissionText = permObj.name || permObj.permission || permObj.action || JSON.stringify(permission);
                          } else {
                            permissionText = String(permission);
                          }
                          
                          return (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permissionText}
                            </Badge>
                          );
                        })}
                        {sessionData.user.permissions.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{sessionData.user.permissions.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Information */}
          {sessionData.session && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent name="Clock" className="h-5 w-5" />
                  {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် သတင်းအချက်အလက်' : 'Session Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {currentLanguage === 'mm' ? 'အကောင့်ဝင်ခွင့် ID' : 'Session ID'}
                        </span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {sessionData.session.id.substring(0, 12)}...
                        </code>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {currentLanguage === 'mm' ? 'သက်တမ်းကုန်မည့်အချိန်' : 'Expires At'}
                        </span>
                        <span className="font-medium">
                          {new Date(sessionData.session.expiresAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {currentLanguage === 'mm' ? 'ကျန်ရှိသော အချိန်' : 'Time Remaining'}
                        </span>
                        <Badge 
                          variant={timeRemaining === 'Expired' ? "destructive" : 
                                  timeRemaining.includes('m') && parseInt(timeRemaining) < 5 ? "secondary" : "default"}
                          className="font-mono"
                        >
                          {timeRemaining || 'Calculating...'}
                        </Badge>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={extendSession}
                          disabled={extending || timeRemaining === 'Expired'}
                          size="sm"
                        >
                          {extending ? (
                            <>
                              <IconComponent name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                              {currentLanguage === 'mm' ? 'တိုးနေသည်...' : 'Extending...'}
                            </>
                          ) : (
                            <>
                              <IconComponent name="RefreshCw" className="h-4 w-4 mr-2" />
                              {currentLanguage === 'mm' ? 'သက်တမ်းတိုး' : 'Extend Session'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {timeRemaining === 'Expired' && (
                    <Alert>
                      <IconComponent name="AlertTriangle" className="h-4 w-4" />
                      <AlertDescription>
                        {currentLanguage === 'mm'
                          ? 'သင့်အကောင့်ဝင်ခွင့် သက်တမ်းကုန်ပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည်လော့ဂ်အင်လုပ်ပါ။'
                          : 'Your session has expired. Please log in again.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {timeRemaining.includes('m') && parseInt(timeRemaining) < 5 && timeRemaining !== 'Expired' && (
                    <Alert>
                      <IconComponent name="Clock" className="h-4 w-4" />
                      <AlertDescription>
                        {currentLanguage === 'mm'
                          ? 'သင့်အကောင့်ဝင်ခွင့် မကြာမီ သက်တမ်းကုန်မည်။ သက်တမ်းတိုးရန် စဉ်းစားပါ။'
                          : 'Your session will expire soon. Consider extending it.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Features - Tabs for Tokens and Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent name="Settings" className="h-5 w-5" />
                {currentLanguage === 'mm' ? 'အဆင့်မြင့် စောင့်ကြည့်မှု' : 'Advanced Monitoring'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tab Navigation */}
              <div className="flex space-x-1 border-b border-muted mb-4">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'current'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentLanguage === 'mm' ? 'လက်ရှိအကောင့်' : 'Current Session'}
                </button>
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'tokens'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentLanguage === 'mm' ? 'တိုကင်များ' : 'Tokens'}
                </button>
                {sessionsData?.isAdmin && (
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'sessions'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {currentLanguage === 'mm' ? 'အားလုံးအကောင့်များ' : 'All Sessions'}
                  </button>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === 'current' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'mm' 
                      ? 'လက်ရှိအကောင့်ဝင်ခွင့်အချက်အလက်များကို အပေါ်တွင်ကြည့်နိုင်ပါသည်။'
                      : 'Current session information is displayed above.'}
                  </p>
                </div>
              )}

              {activeTab === 'tokens' && (
                <div className="space-y-4">
                  {tokenData ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(tokenData.tokens).map(([tokenType, token]) => (
                        <div key={tokenType} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">
                              {tokenType.replace(/([A-Z])/g, ' $1').trim()} Token
                            </h4>
                            <Badge 
                              variant={
                                token.status === 'active' ? 'default' :
                                token.status === 'expired' ? 'destructive' : 'secondary'
                              }
                            >
                              {token.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {token.expiresAt && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Expires:</span>
                                <span>{new Date(token.expiresAt).toLocaleString()}</span>
                              </div>
                            )}
                            
                            {token.timeRemaining && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-mono">
                                  {formatTimeRemaining(token.timeRemaining)}
                                </span>
                              </div>
                            )}
                            
                            {token.createdAt && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span>{new Date(token.createdAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <IconComponent name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading token data...</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && sessionsData?.isAdmin && (
                <div className="space-y-4">
                  {sessionsData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          {sessionsData.sessions.length} active session(s) found
                        </p>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sessionsData.sessions.map((session) => (
                          <div key={session.sessionId} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{session.userName || session.userEmail}</span>
                                  {session.isCurrent && (
                                    <Badge variant="default" className="text-xs">Current</Badge>
                                  )}
                                </div>
                                
                                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                  <div>Email: {session.userEmail}</div>
                                  <div>IP: {session.ipAddress}</div>
                                  <div>Created: {new Date(session.createdAt).toLocaleString()}</div>
                                  <div>Expires: {new Date(session.expiresAt).toLocaleString()}</div>
                                  <div>Last Activity: {new Date(session.lastActivityAt).toLocaleString()}</div>
                                </div>
                                
                                {session.userAgent && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    UA: {session.userAgent}
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4">
                                <Button
                                  onClick={() => forceLogout(session.sessionId)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={session.isCurrent}
                                >
                                  <IconComponent name="LogOut" className="h-4 w-4 mr-2" />
                                  {session.isCurrent ? 'Current' : 'Force Logout'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <IconComponent name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading sessions data...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!sessionData.isAuthenticated && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <IconComponent name="LogIn" className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium">
                  {currentLanguage === 'mm' 
                    ? 'အကောင့်မဝင်ရောက်ရသေး' 
                    : 'Not Authenticated'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentLanguage === 'mm'
                    ? 'အကောင့်ဝင်ခွင့် အချက်အလက်များကို ကြည့်ရှုရန် အကောင့်ဝင်ရောက်ပါ'
                    : 'Please log in to view session information'}
                </p>
              </div>
              <Button onClick={() => window.location.href = '/login'}>
                <IconComponent name="LogIn" className="h-4 w-4 mr-2" />
                {currentLanguage === 'mm' ? 'လော့ဂ်အင်' : 'Log In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}