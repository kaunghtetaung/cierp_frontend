"use client";

import React from "react";
import { Button } from "@/styled-components/ui/Button";
import { User, Settings, UserCircle, Lock, LogIn } from "lucide-react";
import { useAuth, LoginButton, LogoutButton } from "@repo/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/styled-components/ui/DropdownMenu";

/**
 * User Menu Component
 * Shows signin button when not authenticated, user menu when authenticated
 */
export const UserMenu: React.FC<{
  className?: string;
  variant?: "mobile" | "desktop";
}> = ({ className = "", variant = "desktop" }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated) {
    if (variant === "mobile") {
      return (
        <LoginButton
          className={`min-h-[44px] min-w-[44px] p-0 touch-manipulation border-0 shadow-none bg-transparent hover:bg-accent focus:bg-accent outline-none flex items-center justify-center ${className}`}
        >
          <Lock className="h-4 w-4 text-muted-foreground" />
        </LoginButton>
      );
    }

    return (
      <LoginButton
        className={`px-3 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-transparent border-0 hover:underline underline-offset-4 min-h-[44px] touch-manipulation ${className}`}
      >
        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
        Sign In
      </LoginButton>
    );
  }

  // Authenticated - show user menu
  if (variant === "mobile") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`min-h-[44px] min-w-[44px] p-0 touch-manipulation border-0 shadow-none bg-transparent hover:bg-accent focus:bg-accent outline-none flex items-center justify-center ${className}`}
            aria-label="User menu"
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-background border border-border rounded-lg shadow-lg z-50"
        >
          <div className="p-2">
            <div className="text-sm text-foreground font-medium">
              {user?.name || "User"}
            </div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogoutButton className="w-full py-1 justify-start bg-transparent hover:bg-transparent text-foreground">
              <LogIn className="mr-2 h-4 w-4 rotate-180" />
              Sign Out
            </LogoutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop user menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          aria-label="User menu"
        >
          <User className="h-4 w-4" />
          <span className="text-sm text-muted-foreground font-medium">
            {user?.name || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 shadow-lg z-50">
        <div className="p-3 border-b border-border">
          <div className="text-sm text-foreground font-medium">
            {user?.name || "User"}
          </div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <DropdownMenuItem>
          <UserCircle className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Lock className="mr-2 h-4 w-4" />
          Change Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutButton className="w-full justify-start py-2 border-0 bg-transparent hover:bg-transparent text-foreground">
            <LogIn className="mr-2 h-4 w-4 rotate-180" />
            Sign Out
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
