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
  ChevronDown,
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
import { ProfileSelectionDialog } from "@/components/profile/ProfileSelectionDialog";
import { useProfileCompletionPrompt } from "@/hooks/use-profile-completion-prompt";
import { useStaffProfilePrompt } from "@/hooks/use-staff-profile-prompt";

/**
 * User Menu Component
 * Shows signin button when not authenticated, user menu when authenticated.
 * The inline `ProfileSelectionDialog` that used to live here was lifted
 * to `@/components/profile/ProfileSelectionDialog` and the auto-open
 * detection to `useProfileCompletionPrompt`, so per-tenant header
 * variants (um1sf's HeaderUserActions, etc.) can mount it too.
 */
export const UserMenu: React.FC<{
  className?: string;
  variant?: "mobile" | "desktop";
}> = ({ className = "", variant = "desktop" }) => {
  const { isAuthenticated, user, isLoading } = useSafeAuth();
  const profilePrompt = useProfileCompletionPrompt();
  const needsProfileCompletion = profilePrompt.needsCompletion;
  const showProfileDialog = profilePrompt.open;
  const setShowProfileDialog = profilePrompt.setOpen;
  // Staff-only nag for users who submitted Mini but haven't finished
  // Full. Empty (no staff record) → hook returns 0% → no UI shown.
  const staffPrompt = useStaffProfilePrompt();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
            className="w-48 bg-background border border-border rounded-lg shadow-lg"
          >
            <DropdownMenuItem>
              <LoginButton className="flex items-center w-full justify-start py-0.5 border-0 bg-transparent hover:bg-transparent text-foreground">
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
      <div className={`flex items-center gap-2 mt-0 ${className}`}>
        <LoginButton className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-action-button)] border-0 text-white rounded-b-md rounded-t-none hover:opacity-90">
          <LogIn className="h-4 w-4" />
          Sign In
        </LoginButton>
        <Link
          href="/signup"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-signup-button)] text-white rounded-b-md rounded-t-none hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Link>
      </div>
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
            <User className="h-4 w-4 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-background border border-border rounded-lg shadow-lg"
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
            {user?.profileState && (
              <div className="text-xs text-muted-foreground mt-1">
                Profile Status: {user.profileState}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          {needsProfileCompletion && (
            <>
              <DropdownMenuItem
                onClick={() => setShowProfileDialog(true)}
                className="flex items-center w-full py-0.5 text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Complete Your Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {staffPrompt.needsCompletion && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profileSetup/staff" className="block w-full px-2 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Profile complete
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {staffPrompt.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${staffPrompt.percentage}%`,
                        backgroundColor: "var(--color-primary)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
                    Finish when you have time
                  </p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center w-full">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/settings" className="flex items-center w-full">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center w-full">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Link>
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

  // Desktop user menu - Matches sign-in button design
  return (
    <>
      <ProfileSelectionDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={user}
      />
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-action-button)] border-0 text-white rounded-b-md rounded-t-none hover:opacity-90"
              aria-haspopup="menu"
              aria-label="User menu"
              type="button"
            >
              <User className="h-4 w-4" />
              <span>{user?.name || "Account"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[280px] !bg-[var(--color-banner-bg)] border-white/20 shadow-lg rounded-md"
          >
            <div className="p-3 border-b border-white/20">
              <div className="text-sm text-white font-medium">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-white/80">{user?.email}</div>
              {user?.roles && user.roles.length > 0 && (
                <div className="text-xs text-white/80 mt-1">
                  Role: {user.roles.map((r: any) => r.Role).join(", ")}
                </div>
              )}
              {user?.profileState && (
                <div className="text-xs text-white/80 mt-1">
                  Profile Status: {user.profileState}
                </div>
              )}
            </div>
            {needsProfileCompletion && (
              <>
                <DropdownMenuItem
                  onClick={() => setShowProfileDialog(true)}
                  className="cursor-pointer hover:bg-white/10 p-3 text-amber-400 hover:text-amber-300 font-medium"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Complete Your Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-white/20" />
              </>
            )}
            {staffPrompt.needsCompletion && (
              <>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-3">
                  <Link href="/profileSetup/staff" className="block w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white">
                        Profile complete
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {staffPrompt.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${staffPrompt.percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/70 mt-1.5 leading-tight">
                      Finish when you have time
                    </p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-white/20" />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/profile" className="flex items-center w-full">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/profile" className="flex items-center w-full">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-white/20" />
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <LogoutButton className="w-full justify-start p-0 border-0 bg-transparent hover:bg-transparent text-white flex items-center">
                <LogIn className="mr-2 h-4 w-4 rotate-180" />
                Sign Out
              </LogoutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
