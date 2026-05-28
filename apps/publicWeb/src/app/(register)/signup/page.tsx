import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupPageClient } from "./SignupPageClient";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { TenantService } from "@repo/tenant/tenant-service";
import type { TenantSettings } from "@repo/types";
import { cookies } from "next/headers";
import { getCurrentUser } from "@repo/auth/server-api";
import { getMyProfile } from "@/app/profile/student/actions";

export const metadata: Metadata = {
  title: "Sign Up | Create Your Account",
  description: "Create a new account to get started",
};

async function fetchTenantSettings(): Promise<TenantSettings | null> {
  try {
    // Get tenant context from middleware
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      console.error("No tenant ID found in middleware data");
      return null;
    }

    // Get tenant settings
    const apiUrl = await getApiDomain();
    const tenantService = new TenantService(apiUrl);
    const tenantDto = await tenantService.getSettings(tenantId);
    
    // Transform to client-safe format
    return tenantService.transformToClientSafe(tenantDto);
  } catch (error) {
    console.error("Failed to fetch tenant settings:", error);
    return null;
  }
}

/**
 * Already-authenticated users hitting /signup get silently routed to
 * the most useful next step rather than being shown the form again:
 *
 *   guest + no profile  → /profileSetup/student  (resume signup at Stage 3)
 *   has full profile    → /                      (already onboarded)
 *   no session          → render form            (anonymous visitor)
 *   session invalid     → render form            (treat as anonymous)
 *
 * This mirrors what Stripe / GitHub / Vercel do — accidentally
 * showing the signup form to a logged-in user invites them to create
 * a duplicate account, which is the worst outcome.
 */
async function redirectIfAuthenticated(): Promise<void> {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    // Token expired or session unreadable → fall through to form.
    return;
  }
  if (!user) return;

  const isGuest =
    user.roles?.some((r: any) => r.Role === "guest" || r === "guest") ?? false;

  if (isGuest) {
    // Guest with no completed profile → send them to Stage 3 of signup.
    // If profile fetch fails (network or 401), fall back to home so we
    // don't strand them on /signup.
    try {
      const profile = await getMyProfile();
      if (!profile?.success || !profile.data) {
        redirect("/profileSetup/student");
      }
    } catch {
      redirect("/profileSetup/student");
    }
  }

  // Authenticated and not a brand-new guest → already onboarded.
  redirect("/");
}

export default async function SignupPage() {
  // Side-effect: throws `NEXT_REDIRECT` if user is signed in, which
  // Next.js handles before we render any signup UI.
  await redirectIfAuthenticated();

  const tenantSettings = await fetchTenantSettings();

  // Get initial language from cookie
  const cookieStore = await cookies();
  const initialLang = cookieStore.get('x-lang')?.value || 'en';

  return (
    <SignupPageClient
      tenantSettings={tenantSettings}
      initialLang={initialLang}
    />
  );
}