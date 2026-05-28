"use client";

import { useEffect, useState } from "react";
import { useSafeAuth } from "@/hooks/use-safe-auth";

/**
 * Detects "guest user with no completed profile" and auto-opens the
 * `ProfileSelectionDialog` for them on every authenticated render.
 *
 * Conditions (kept in sync with the original inline check in
 * `site-shell/header/components/Action/UserMenu.tsx`):
 *   - `role === "guest"` in `user.roles[].Role`
 *   - `profileState ∈ {created, incomplete, pending}` (JWT claim)
 *
 * Returned controls let header variants render the dialog and expose
 * a manual "Complete Profile" trigger (e.g. in a user dropdown menu)
 * for users who closed the auto-popup.
 */
export function useProfileCompletionPrompt(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  needsCompletion: boolean;
  user: any;
} {
  const { isAuthenticated, user, isLoading } = useSafeAuth();
  const [open, setOpen] = useState(false);

  // Roles may arrive as either `string[]` (legacy) or
  // `Array<{Role:string,Organization:string,Department:string}>`
  // (current JWT shape). Cover both so we don't silently no-op for
  // a tenant whose JWT serializer differs.
  const hasGuestRole = Boolean(
    user?.roles?.some(
      (r: any) =>
        (typeof r === "string" && r.toLowerCase() === "guest") ||
        r?.Role === "guest" ||
        r?.role === "guest",
    ),
  );
  const profileState = (user as any)?.profileState;
  const incompleteProfile =
    profileState === "created" ||
    profileState === "incomplete" ||
    profileState === "pending";

  const needsCompletion = hasGuestRole && incompleteProfile;

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsCompletion) {
      setOpen(true);
    }
  }, [isLoading, isAuthenticated, needsCompletion]);

  return { open, setOpen, needsCompletion, user };
}
