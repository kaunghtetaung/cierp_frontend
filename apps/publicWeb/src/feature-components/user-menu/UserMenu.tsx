"use client";

import React from "react";
import { UserMenuProps } from "./types";
import { useUserMenu } from "./context";
import UserDropdown from "./UserDropdown";
import SignInButton from "./SignInButton";

/**
 * Main User Menu Component
 * Shows appropriate UI based on authentication state
 */
export function UserMenu({
  showTextOnMobile = false,
  signInText = "Sign In",
  className = "",
  variant = "default",
}: UserMenuProps) {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useUserMenu();

  // Loading state
  if (isLoading) {
    return (
      <div className={className} data-loading="true">
        Loading...
      </div>
    );
  }

  // Authenticated state - show user dropdown
  if (isAuthenticated && user) {
    return (
      <div className={className} data-authenticated="true">
        <UserDropdown user={user} onSignOut={signOut} />
      </div>
    );
  }

  // Unauthenticated state - show sign in button
  return (
    <div className={className} data-authenticated="false">
      <SignInButton text={signInText} onClick={signIn} />
    </div>
  );
}

export default UserMenu;
