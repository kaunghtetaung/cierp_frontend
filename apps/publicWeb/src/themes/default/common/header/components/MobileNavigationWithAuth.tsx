'use client';

import React from 'react';
import { useAuth } from '@repo/auth';
import { MobileNavigation } from '../../navigation/MobileNavigation';

interface MobileNavigationWithAuthProps {
  items: any[];
  currentLanguage: string;

  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile Navigation wrapper that provides auth state
 * Connects auth context with MobileNavigation component
 */
export const MobileNavigationWithAuth: React.FC<MobileNavigationWithAuthProps> = ({ 
  items, 
  currentLanguage, 
  isOpen, 
  onOpenChange 
}) => {
  const { isAuthenticated, user } = useAuth();
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