// Login page component
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "./auth-provider";
import { DevUtils } from "../utils/login-utils";

export interface LoginPageProps {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  companyName?: string;
  className?: string;
  showDevTools?: boolean;
  onLoginStart?: () => void;
  onLoginError?: (error: Error) => void;
  customFooter?: React.ReactNode;
}

/**
 * Full login page component with OIDC authentication
 */
export function LoginPage({
  title = "Welcome Back",
  subtitle = "Sign in to your account",
  logoUrl,
  companyName = "Your Company",
  className = "",
  showDevTools = false,
  onLoginStart,
  onLoginError,
  customFooter,
}: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error } = useAuthContext();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, router, returnUrl]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      onLoginStart?.();

      DevUtils.logAuthEvent("LOGIN_PAGE_LOGIN_STARTED", { returnUrl });
      await login(returnUrl);
    } catch (error) {
      const authError = error as Error;
      DevUtils.logAuthEvent("LOGIN_PAGE_LOGIN_ERROR", authError);
      onLoginError?.(authError);
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {logoUrl && (
            <img
              className="mx-auto h-12 w-auto mb-4"
              src={logoUrl}
              alt={companyName}
            />
          )}
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Login Failed
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign in with SSO
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our terms of service and privacy
              policy
            </p>
          </div>
        </div>

        {customFooter && <div className="text-center">{customFooter}</div>}

        {showDevTools && process.env.NODE_ENV === "development" && (
          <div className="bg-gray-800 text-white p-4 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Development Tools</h3>
            <div className="space-y-1">
              <div>Return URL: {returnUrl}</div>
              <div>Loading: {isLoading ? "Yes" : "No"}</div>
              <div>Logging In: {isLoggingIn ? "Yes" : "No"}</div>
              <div>Error: {error || "None"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple login button component
 */
export interface LoginButtonProps {
  children?: React.ReactNode;
  returnUrl?: string;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  onLoginStart?: () => void;
  onLoginError?: (error: Error) => void;
}

export function LoginButton({
  children = "Sign In",
  returnUrl,
  className = "",
  disabled = false,
  showIcon = false,
  onLoginStart,
  onLoginError,
}: LoginButtonProps) {
  const { login, isLoading } = useAuthContext();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      onLoginStart?.();
      await login(returnUrl);
    } catch (error) {
      const authError = error as Error;
      onLoginError?.(authError);
      setIsLoggingIn(false);
    }
  };

  const buttonClasses = `inline-flex items-center justify-center font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={disabled || isLoading || isLoggingIn}
      className={buttonClasses}
    >
      {isLoading || isLoggingIn ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Signing in...
        </>
      ) : (
        <>
          {showIcon && (
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          )}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * Logout button component
 */
export interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  onLogoutStart?: () => void;
  onLogoutError?: (error: Error) => void;
}

export function LogoutButton({
  children = "Sign Out",
  className = "",
  showIcon = false,
  onLogoutStart,
  onLogoutError,
}: LogoutButtonProps) {
  const { logout, isLoading } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      onLogoutStart?.();
      await logout();
    } catch (error) {
      const authError = error as Error;
      onLogoutError?.(authError);
      setIsLoggingOut(false);
    }
  };

  const buttonClasses = `inline-flex items-center font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading || isLoggingOut}
      className={buttonClasses}
    >
      {isLoading || isLoggingOut ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Signing out...
        </>
      ) : (
        <>
          {showIcon && (
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
              />
            </svg>
          )}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * User profile component
 */
export interface UserProfileProps {
  className?: string;
  showLogoutButton?: boolean;
  showUserInfo?: boolean;
  onLogout?: () => void;
}

export function UserProfile({
  className = "",
  showLogoutButton = true,
  showUserInfo = true,
  onLogout,
}: UserProfileProps) {
  const { user, isAuthenticated } = useAuthContext();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showUserInfo && (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name?.charAt(0)?.toUpperCase() ||
                  user.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.email}
            </p>
            {user.name && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>
        </div>
      )}

      {showLogoutButton && (
        <LogoutButton
          className="px-3 py-2 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          onLogoutStart={onLogout}
        >
          Sign Out
        </LogoutButton>
      )}
    </div>
  );
}
