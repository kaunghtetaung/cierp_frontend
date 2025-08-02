'use client';

import React from 'react';
import { Button } from '@/base-components/ui/button';
import { SignInButtonProps } from './types';

/**
 * Sign In Button Component
 * Displays sign in button with various styles
 */
export function SignInButton({ 
  text = 'Sign In',
  variant = 'default',
  size = 'md',
  className = '',
  onClick
}: SignInButtonProps) {
  return (
    <Button
      variant={variant}
      size={size === 'md' ? 'default' : size}
      className={`min-h-[44px] touch-manipulation border-0 shadow-none hover:bg-gray-100 ${className}`}
      onClick={onClick}
      type="button"
    >
      {text}
    </Button>
  );
}

export default SignInButton;