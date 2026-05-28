import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { getMyStaffProfile } from "./staff-actions";
import { StaffSetupClient } from "./StaffSetupClient";

export const metadata: Metadata = {
  title: "Staff Registration | Complete Your Profile",
  description: "Register as staff — mini or full profile setup",
};

function hasRoleName(roles: any, name: string): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some(
    (r: any) =>
      (typeof r === "string" && r.toLowerCase() === name.toLowerCase()) ||
      r?.Role?.toLowerCase?.() === name.toLowerCase() ||
      r?.role?.toLowerCase?.() === name.toLowerCase(),
  );
}

/**
 * Staff self-registration entry. Two flows:
 *   - Mini  → quick onboarding (single page, narrow field set)
 *   - Full  → multi-step wizard (everything; can be filled later too)
 *
 * Routing rules:
 *   - Not authenticated         → /login?callbackUrl=/profileSetup/staff
 *   - Authenticated, not guest  → /            (already onboarded somehow)
 *   - Guest, no record yet      → render the Mini/Full mode picker
 *   - Guest, record exists      → render the picker (defaults to Full,
 *                                 since Mini is already submitted)
 */
export default async function StaffProfileSetupPage() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/login?callbackUrl=/profileSetup/staff");
  }

  if (!user) {
    redirect("/login?callbackUrl=/profileSetup/staff");
  }

  // Non-guest users shouldn't be filling staff onboarding (HR creates
  // their records directly). Send them home.
  if (!hasRoleName(user.roles, "guest")) {
    redirect("/");
  }

  // Pre-fetch existing record so the picker can default to Full mode
  // (Mini already submitted) instead of showing the choice screen for
  // a returning user who's already past Stage 1.
  const profileResult = await getMyStaffProfile();
  const existingProfile = profileResult.success ? profileResult.data : null;

  return (
    <StaffSetupClient
      user={user}
      initialProfile={existingProfile}
    />
  );
}
