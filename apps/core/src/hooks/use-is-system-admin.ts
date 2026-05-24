"use client";

import { useAuth } from "@repo/auth";

/**
 * Client-side hook that returns `true` when the current authenticated
 * user holds the SystemAdmin role.
 *
 * Mirrors the server-side `isSystemAdmin(user)` in
 * `src/lib/auth-utils.ts` — duplicated here because the server-side
 * version pulls in server-only imports (`headers`, etc.) and can't be
 * called from client components like `DeleteActionsMenu`.
 *
 * Role detection accepts the three shapes the backend has historically
 * shipped:
 *   - plain string: `"systemAdmin"`
 *   - object with `Role`: `{ Role: "systemAdmin", ... }`
 *   - object with `roles` array: `{ roles: ["systemAdmin"], ... }`
 *
 * Case-insensitive comparison — guard against `"SystemAdmin"` vs
 * `"systemadmin"` drift across services.
 */
export function useIsSystemAdmin(): boolean {
  const { user } = useAuth();
  if (!user?.roles || user.roles.length === 0) return false;

  const roleInfo: any = user.roles[0];

  if (typeof roleInfo === "string") {
    return roleInfo.toLowerCase() === "systemadmin";
  }

  if (typeof roleInfo === "object" && roleInfo !== null) {
    if (typeof roleInfo.Role === "string") {
      return roleInfo.Role.toLowerCase() === "systemadmin";
    }
    if (Array.isArray(roleInfo.roles) && roleInfo.roles.length > 0) {
      return String(roleInfo.roles[0]).toLowerCase() === "systemadmin";
    }
  }

  return false;
}
