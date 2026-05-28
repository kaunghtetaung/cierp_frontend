import { Suspense } from "react";
import { redirect } from "next/navigation";
import { VerifyEmailClient } from "./VerifyEmailClient";
import { Metadata } from "next";
import { getApiDomain } from "@repo/utils/server";
import { TenantService } from "@repo/tenant/tenant-service";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { cookies } from "next/headers";
import type { TenantSettings } from "@repo/types";

export const metadata: Metadata = {
  title: "Verify Email | Confirm Your Account",
  description: "Verify your email address to activate your account",
};

async function fetchTenantSettings(): Promise<TenantSettings | null> {
  try {
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      console.error("No tenant ID found in middleware data");
      return null;
    }

    const apiUrl = await getApiDomain();
    const tenantService = new TenantService(apiUrl);
    const tenantDto = await tenantService.getSettings(tenantId);
    
    return tenantService.transformToClientSafe(tenantDto);
  } catch (error) {
    console.error("Failed to fetch tenant settings:", error);
    return null;
  }
}

/**
 * `/verify` carries an opaque token in the query string and is reached
 * from the verification email — by design it must work without a
 * session (the token *is* the auth). With a token we render the page
 * unconditionally; without one there's nothing to verify, so bounce
 * the visitor to a useful place rather than show an "invalid link"
 * dead-end:
 *
 *   no token + authenticated  → /
 *   no token + anonymous      → /signup
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = (await searchParams) ?? {};
  if (!params.token) {
    try {
      const { getCurrentUser } = await import("@repo/auth/server-api");
      const user = await getCurrentUser();
      redirect(user ? "/" : "/signup");
    } catch {
      redirect("/signup");
    }
  }

  const tenantSettings = await fetchTenantSettings();
  const cookieStore = await cookies();
  const initialLang = cookieStore.get('x-lang')?.value || 'en';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailClient 
        tenantSettings={tenantSettings}
        initialLang={initialLang}
      />
    </Suspense>
  );
}