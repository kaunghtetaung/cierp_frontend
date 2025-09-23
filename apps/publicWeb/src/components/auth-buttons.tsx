// Auth buttons for public pages that don't require AuthProvider
'use client';

import React from 'react';
import { initiateLogin, initiateLogout } from '@repo/auth/login-utils';

interface LoginButtonProps {
  children: React.ReactNode;
  className?: string;
  returnUrl?: string;
}

/**
 * Login button that doesn't require AuthProvider
 */
export function LoginButton({ children, className = '', returnUrl }: LoginButtonProps) {
  const handleLogin = async () => {
    try {
      await initiateLogin(returnUrl || window.location.href);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      className={className}
    >
      {children}
    </button>
  );
}

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Logout button that doesn't require AuthProvider
 */
export function LogoutButton({ children, className = '' }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await initiateLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
    >
      {children}
    </button>
  );
}