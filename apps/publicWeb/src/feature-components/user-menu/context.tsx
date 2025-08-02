'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserMenuContextValue, UserMenuProviderProps, User } from './types';

const UserMenuContext = createContext<UserMenuContextValue | undefined>(undefined);

/**
 * User Menu Provider
 * Manages user authentication state
 */
export function UserMenuProvider({ 
  children, 
  initialUser = null,
  onSignIn,
  onSignOut
}: UserMenuProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null && user.isAuthenticated;

  /**
   * Sign in handler
   */
  const signIn = useCallback(() => {
    if (onSignIn) {
      onSignIn();
    } else {
      // Default behavior: redirect to login
      window.location.href = '/api/auth/login';
    }
  }, [onSignIn]);

  /**
   * Sign out handler
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        
        if (onSignOut) {
          onSignOut();
        }
        
        // Redirect to home page
        window.location.href = '/';
      } else {
        console.error('Failed to sign out');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onSignOut]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      if (response.ok) {
        const sessionData = await response.json();
        
        if (sessionData.success && sessionData.data) {
          const userData: User = {
            id: sessionData.data.userId,
            email: sessionData.data.email || '',
            name: sessionData.data.name || sessionData.data.email || 'User',
            avatar: sessionData.data.avatar,
            roles: sessionData.data.roles || [],
            isAuthenticated: true
          };
          
          setUser(userData);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    if (!initialUser) {
      refreshUser();
    }
  }, [initialUser, refreshUser]);

  const contextValue: UserMenuContextValue = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    refreshUser
  };

  return (
    <UserMenuContext.Provider value={contextValue}>
      {children}
    </UserMenuContext.Provider>
  );
}

/**
 * Hook to use user menu context
 */
export function useUserMenu(): UserMenuContextValue {
  const context = useContext(UserMenuContext);
  
  if (context === undefined) {
    throw new Error('useUserMenu must be used within a UserMenuProvider');
  }
  
  return context;
}