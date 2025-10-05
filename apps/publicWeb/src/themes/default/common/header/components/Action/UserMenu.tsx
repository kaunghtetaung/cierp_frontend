import React from "react";
import Link from "next/link";
import { Button } from "@/styled-components/ui/Button";
import {
  User,
  Settings,
  UserCircle,
  Lock,
  LogIn,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { LoginButton, LogoutButton } from "@/components/auth-buttons";
import { useSafeAuth } from "@/hooks/use-safe-auth";
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
 * Uses safe auth hook that doesn't trigger redirects
 */
export const UserMenu: React.FC<{
  className?: string;
  variant?: "mobile" | "desktop";
}> = ({ className = "", variant = "desktop" }) => {
  const { isAuthenticated, user, isLoading } = useSafeAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  console.log("Where");
  // Not authenticated - show login/signup options
  if (!isAuthenticated) {
    if (variant === "mobile") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`min-h-[44px] min-w-[44px] p-2 touch-manipulation border border-border rounded-lg bg-transparent hover:bg-accent focus:bg-accent outline-none flex items-center justify-center transition-all duration-200 ${className}`}
              aria-label="Authentication menu"
            >
              <LogIn className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-background border border-border rounded-lg shadow-lg z-50"
          >
            <DropdownMenuItem>
              <LoginButton className="w-full justify-start py-0.5 border-0 bg-transparent hover:bg-transparent text-foreground">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </LoginButton>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/signup"
                className="flex items-center w-full py-0.5 text-foreground hover:bg-transparent"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Desktop - show compact text links
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LoginButton className="px-2 py-1 text-sm font-medium transition-colors bg-transparent border-0 text-white hover:text-white/90">
          Sign In
        </LoginButton>
        <span className="text-sm text-white">|</span>
        <Link
          href="/signup"
          className="px-2 py-1 text-sm font-medium transition-colors text-white hover:text-white/90"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Authenticated - show user menu
  // Check if user has 'guest' role in any of their organization/department roles
  // Role object format: { Organization, Department, Role, _id }
  const isGuestUser =
    user?.roles?.some((roleObj: any) => roleObj.Role === "guest") ?? false;

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
            <User className="h-4 w-4 text-white" />
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
            {user?.roles && user.roles.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Role: {user.roles.map((r: any) => r.Role).join(", ")}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          {isGuestUser && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href="/profile/complete"
                  className="flex items-center w-full py-0.5 text-amber-600 hover:text-amber-700 font-medium"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Complete Your Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
          <DropdownMenuItem className="p-0">
            <LogoutButton className="w-full justify-start px-2 py-1.5 bg-transparent hover:bg-transparent text-foreground flex items-center cursor-pointer rounded-sm hover:bg-accent">
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
        <button
          className="px-2 py-1 text-sm font-medium transition-colors bg-transparent border-0 text-white hover:text-white/90"
          aria-label="User menu"
        >
          {user?.name || "Account"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 shadow-lg z-50">
        <div className="p-3 border-b border-border">
          <div className="text-sm text-foreground font-medium">
            {user?.name || "User"}
          </div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
          {user?.roles && user.roles.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Role: {user.roles.map((r: any) => r.Role).join(", ")}
            </div>
          )}
        </div>
        {isGuestUser && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/profile/complete"
                className="flex items-center w-full py-2 text-amber-600 hover:text-amber-700 font-medium"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Complete Your Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
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
        <DropdownMenuItem className="p-0">
          <LogoutButton className="w-full justify-start px-2 py-1.5 border-0 bg-transparent hover:bg-transparent text-foreground flex items-center cursor-pointer rounded-sm hover:bg-accent">
            <LogIn className="mr-2 h-4 w-4 rotate-180" />
            Sign Out
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
