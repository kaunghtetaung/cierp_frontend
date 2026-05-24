'use client';

import React from 'react';
import { HeaderActionsProps } from '../../types';
import { MobileHeaderActions, DesktopHeaderActions } from '..';

/**
 * Main Header Actions Component
 * Switches between mobile and desktop based on isMobileView prop
 */
const HeaderActions: React.FC<HeaderActionsProps> = ({ 
  isMobileView = false, 
  ...props 
}) => {
  if (isMobileView) {
    return <MobileHeaderActions {...props} />;
  }
  
  return <DesktopHeaderActions {...props} />;
};

export default HeaderActions;