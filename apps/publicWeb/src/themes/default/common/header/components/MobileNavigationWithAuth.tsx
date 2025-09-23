'use client';

import React from 'react';
import { useSafeAuth } from '@/hooks/use-safe-auth';
import { MobileNavigation } from '../../navigation/MobileNavigation';

interface MobileNavigationWithAuthProps {
  items: any[];
  currentLanguage: string;

  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile Navigation wrapper that provides auth state
 * Uses safe auth hook that doesn't trigger redirects
 */
export const MobileNavigationWithAuth: React.FC<MobileNavigationWithAuthProps> = ({ 
  items, 
  currentLanguage, 
  isOpen, 
  onOpenChange 
}) => {
  const { isAuthenticated, user } = useSafeAuth();
  const userRoles = user?.roles || [];

  return (
    <MobileNavigation
      items={items}
      currentLanguage={['en', 'mm'].includes(currentLanguage) ? (currentLanguage as 'en' | 'mm') : undefined}
      isAuthenticated={isAuthenticated}
      userRoles={userRoles}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  );
};