'use client';

// Export all types
export * from './types';

// Export components
export { default as UserMenu } from './UserMenu';
export { default as UserAvatar } from './UserAvatar';
export { default as SignInButton } from './SignInButton';
export { default as UserDropdown } from './UserDropdown';

// Export context and hooks
export { UserMenuProvider, useUserMenu } from './context';

// Default export
export { default } from './UserMenu';