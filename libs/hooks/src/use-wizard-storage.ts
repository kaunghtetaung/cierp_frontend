"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FieldValues } from 'react-hook-form';

interface WizardStorageConfig {
  moduleName: string;
  userId?: string;
  action: 'create' | 'update';
  itemId?: string;
}

export function useWizardStorage(config: WizardStorageConfig) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate unique storage key (memoized)
  const storageKey = useMemo(() => 
    `wizard_${config.moduleName}_${config.action}${config.itemId ? `_${config.itemId}` : ''}_${config.userId || 'anonymous'}`,
    [config.moduleName, config.action, config.itemId, config.userId]
  );

  // Load data from localStorage
  const loadStoredData = useCallback((): FieldValues | null => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }
      
      const data = JSON.parse(stored);
      
      // Check if data is expired (older than 24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (data.timestamp && (now - data.timestamp) > maxAge) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return data.formData || null;
    } catch (error) {
      console.error('Error loading wizard data from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  // Save data to localStorage
  const saveToStorage = useCallback((formData: FieldValues) => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const dataToStore = {
        formData,
        timestamp: Date.now(),
        config,
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving wizard data to localStorage:', error);
    }
  }, [storageKey, config]);

  // Clear stored data
  const clearStorage = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing wizard data from localStorage:', error);
    }
  }, [storageKey]);

  // Get all wizard drafts for current user
  const getDrafts = useCallback(() => {
    try {
      if (typeof window === 'undefined') return [];
      
      const drafts = [];
      const prefix = `wizard_${config.moduleName}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const data = JSON.parse(stored);
              drafts.push({
                key,
                ...data,
                lastModified: new Date(data.timestamp),
              });
            } catch (e) {
              // Invalid data, skip
            }
          }
        }
      }
      
      return drafts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting wizard drafts:', error);
      return [];
    }
  }, [config.moduleName]);

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return {
    loadStoredData,
    saveToStorage,
    clearStorage,
    getDrafts,
    storageKey,
    isLoading,
  };
}