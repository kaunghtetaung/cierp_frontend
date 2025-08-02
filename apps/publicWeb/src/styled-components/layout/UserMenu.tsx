"use client";

// Styled User Menu Component - Complete UI implementation
import React from "react";
import { UserMenu as FeatureUserMenu } from "@/feature-components/user-menu/UserMenu";
import { User, Lock } from "lucide-react";
import { Button } from "./Button";

export interface UserMenuProps {
  className?: string;
  variant?: "mobile" | "desktop";
  showTextOnMobile?: boolean;
  signInText?: string;
}

/**
 * Styled User Menu Component - WITH STYLING
 * Wraps feature UserMenu with complete theme styling
 */
export function UserMenu({
  className = "",
  variant = "desktop",
  showTextOnMobile = false,
  signInText = "Sign In",
}: UserMenuProps) {
  const styledClassName =
    variant === "mobile"
      ? `flex items-center justify-center ${className}`
      : `flex items-center space-x-2 ${className}`;

  return (
    <div className={styledClassName}>
      <FeatureUserMenu
        className=""
        variant={variant === "mobile" ? "compact" : "default"}
        showTextOnMobile={showTextOnMobile}
        signInText={signInText}
      />
    </div>
  );
}

export default UserMenu;
