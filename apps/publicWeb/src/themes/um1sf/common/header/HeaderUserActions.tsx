"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LogIn,
  UserPlus,
  ChevronDown,
  LogOut,
  User as UserIcon,
  KeyRound,
  UserCog,
} from "lucide-react";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { ProfileSelectionDialog } from "@/components/profile/ProfileSelectionDialog";
import { useProfileCompletionPrompt } from "@/hooks/use-profile-completion-prompt";
import { useStaffProfilePrompt } from "@/hooks/use-staff-profile-prompt";

/**
 * Header auth slot — Sign in / Sign up when unauthenticated, user
 * dropdown when authenticated. Reads auth state from `useSafeAuth`,
 * which probes `/api/auth/session` and reads the top-level `user`
 * field — matching the response shape of `handleSessionStatus`.
 *
 * NOTE: We deliberately do NOT use `useUserMenu` from
 * `@/feature-components/user-menu` here — its `refreshUser` reads
 * `data.success` / `data.data`, which the session API does not
 * return. The old themes (site-shell, crystal) all use `useSafeAuth`
 * for exactly this reason.
 *
 * Visibility is gated by `header.showUserMenu` in Content Settings;
 * the parent `HeaderContainer` decides whether to mount this at all.
 */
export function HeaderUserActions({
  language,
}: {
  language: "en" | "mm";
}) {
  const { user, isAuthenticated, isLoading } = useSafeAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mode-A fix: previously this header had no path to the profile
  // completion popup, so guest users who verified their email landed
  // on um1's home page and saw nothing prompting them to finish Stage
  // 3 of signup. The hook auto-opens the dialog on first authenticated
  // render whenever role=guest + profileState∈{created,incomplete,
  // pending}; the dropdown menu item below lets users re-open it
  // manually after dismissing.
  const profilePrompt = useProfileCompletionPrompt();

  // Staff-only nag: after Mini submission the user still has more
  // they can add via Full form. We show "Profile X% complete" in the
  // dropdown so they have a clear path to finish — without forcing
  // them. Empty (no staff record) = no nag.
  const staffPrompt = useStaffProfilePrompt();

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* fall through to redirect even on network error */
    }
    window.location.href = "/";
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Render nothing during the initial probe to avoid a flash of the
  // Sign in/Sign up buttons for users who ARE logged in. The probe
  // is fast (single request to /api/auth/session) so the gap is brief.
  if (isLoading) {
    return (
      <div
        className="inline-flex items-center px-3 py-1.5"
        aria-hidden
        style={{ minHeight: 30 }}
      />
    );
  }

  if (isAuthenticated && user) {
    const userName = (user as any)?.name || "";
    const userEmail = (user as any)?.email || "";
    const initials =
      (userName || userEmail || "U")
        .split(/\s+/)
        .map((s: string) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "U";

    return (
      <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-white/10"
          style={{
            color: "var(--color-gateway-text)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: "#FFFFFF",
              color: "var(--color-primary)",
            }}
          >
            {initials}
          </span>
          <span className="hidden sm:inline">
            {userName || userEmail}
          </span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-background shadow-xl z-50"
            style={{
              borderTopWidth: 3,
              borderTopColor: "var(--color-primary)",
            }}
          >
            <div className="px-3 py-2 border-b border-border">
              <div className="text-sm font-semibold text-foreground truncate">
                {userName || userEmail}
              </div>
              {userName && userEmail && (
                <div className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </div>
              )}
            </div>
            <ul className="py-1">
              {profilePrompt.needsCompletion && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        profilePrompt.setOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors text-left"
                    >
                      <UserCog className="h-4 w-4" />
                      {language === "mm"
                        ? "ပရိုဖိုင် ဖြည့်စွက်ရန်"
                        : "Complete profile"}
                    </button>
                  </li>
                  <li className="border-t border-border my-1" />
                </>
              )}
              {staffPrompt.needsCompletion && (
                <>
                  <li className="px-3 py-2">
                    <Link
                      href="/profileSetup/staff"
                      onClick={() => setOpen(false)}
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {language === "mm"
                            ? "ပရိုဖိုင် ဖြည့်စွက်ရန်"
                            : "Profile complete"}
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
                        {language === "mm"
                          ? "အချိန်ရရင် ဆက်ပြီး ဖြည့်စွက်ပါ"
                          : "Finish when you have time"}
                      </p>
                    </Link>
                  </li>
                  <li className="border-t border-border my-1" />
                </>
              )}
              <li>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  {language === "mm" ? "ပရိုဖိုင်" : "Profile"}
                </Link>
              </li>
              <li>
                <Link
                  href="/profile?action=change-password"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <KeyRound className="h-4 w-4" />
                  {language === "mm" ? "စကားဝှက်ပြောင်းရန်" : "Change password"}
                </Link>
              </li>
              <li className="border-t border-border my-1" />
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  {language === "mm" ? "ထွက်ရန်" : "Sign out"}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ProfileSelectionDialog
        open={profilePrompt.open}
        onOpenChange={profilePrompt.setOpen}
        user={profilePrompt.user}
      />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-sm border border-white/40 px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-white/10"
        style={{
          color: "var(--color-gateway-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <LogIn className="h-3.5 w-3.5" />
        {language === "mm" ? "လော့ဂ်အင်ဝင်ရန်" : "Sign in"}
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors hover:opacity-90"
        style={{
          backgroundColor: "#FFFFFF",
          color: "var(--color-primary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {language === "mm" ? "အကောင့်ဖွင့်ရန်" : "Sign up"}
      </Link>
    </div>
  );
}

export default HeaderUserActions;
