"use client";

import React, { useState, useEffect } from 'react';
import { IconComponent } from '@repo/ui';
import { useAuthContext } from './auth-provider';

/**
 * Session Warning Component
 * Shows a prominent modal when session is about to expire
 */
export function SessionWarning() {
  const { sessionExpiringInMinutes, extendSession, isAuthenticated } = useAuthContext();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);

  // Get current language
  const getCurrentLanguage = (): 'en' | 'mm' => {
    try {
      if (typeof window !== 'undefined') {
        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang === 'en' || pathLang === 'mm') return pathLang;
        
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'en' || storedLang === 'mm') return storedLang;
      }
    } catch (error) {
      // Ignore errors
    }
    return 'en';
  };

  const language = getCurrentLanguage();

  // Show modal when session is expiring in 2 minutes or less
  useEffect(() => {
    if (sessionExpiringInMinutes !== null && sessionExpiringInMinutes <= 2 && isAuthenticated) {
      setIsVisible(true);
      setCountdown(sessionExpiringInMinutes * 60); // Convert to seconds
    } else {
      setIsVisible(false);
      setIsExtending(false);
    }
  }, [sessionExpiringInMinutes, isAuthenticated]);

  // Countdown timer
  useEffect(() => {
    if (isVisible && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, countdown]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await extendSession();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    setIsVisible(false);
    // Clear local storage and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <IconComponent 
                name="AlertTriangle" 
                className="h-6 w-6 text-orange-500" 
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {language === 'mm' 
                  ? 'အကောင့်ဝင်ခွင့် သက်တမ်းကုန်မည်' 
                  : 'Session Expiring Soon'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {language === 'mm'
              ? 'သင့်အကောင့်ဝင်ခွင့် မကြာမီ သက်တမ်းကုန်မည်'
              : 'Your session will expire soon'}
          </p>
          
          {countdown > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400">
                {formatTime(countdown)}
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {language === 'mm' 
                  ? 'ကျန်ရှိသော အချိန်' 
                  : 'Time remaining'}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {language === 'mm'
              ? 'သင့်အကောင့်ဝင်ခွင့်ကို ဆက်လက်အသုံးပြုရန် သက်တမ်းတိုးပါ။'
              : 'Extend your session to continue working.'}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button 
            onClick={handleLogout}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <IconComponent name="LogOut" className="h-4 w-4" />
            {language === 'mm' ? 'ထွက်မည်' : 'Logout'}
          </button>
          
          <button 
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isExtending ? (
              <>
                <IconComponent name="Loader2" className="h-4 w-4 animate-spin" />
                {language === 'mm' ? 'တိုးနေသည်...' : 'Extending...'}
              </>
            ) : (
              <>
                <IconComponent name="RefreshCw" className="h-4 w-4" />
                {language === 'mm' ? 'သက်တမ်းတိုး' : 'Extend Session'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get session warning state for external components
 */
export function useSessionWarning() {
  const { sessionExpiringInMinutes, extendSession } = useAuthContext();
  
  return {
    isExpiringSoon: sessionExpiringInMinutes !== null && sessionExpiringInMinutes <= 5,
    minutesRemaining: sessionExpiringInMinutes,
    extendSession,
  };
}