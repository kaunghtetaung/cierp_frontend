import React from 'react';
import { redirect } from "next/navigation";
import { getApiDomain } from "@repo/utils/server";
import { TenantService } from "@repo/tenant/tenant-service";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { cookies } from "next/headers";
import { SuccessPageClient } from "./SuccessPageClient";
import type { TenantSettings } from "@repo/types";
import { getCurrentUser } from "@repo/auth/server-api";

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
 * `/success` is the "we sent you a verification email" landing — only
 * meaningful for users who just submitted the signup form. If they're
 * already signed in, send them somewhere useful instead.
 */
async function redirectIfAuthenticated(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const isGuest =
      user.roles?.some((r: any) => r.Role === "guest" || r === "guest") ?? false;
    redirect(isGuest ? "/profileSetup/student" : "/");
  } catch {
    // Token unreadable → fall through and render the page.
  }
}

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const email = params.email || '';

  // No email in the URL means this wasn't reached from a real signup
  // submit — drop the visitor on /signup instead of showing a generic
  // "Account Created" screen for an account that doesn't exist.
  if (!email) {
    redirect('/signup');
  }

  const tenantSettings = await fetchTenantSettings();
  const cookieStore = await cookies();
  const initialLang = cookieStore.get('x-lang')?.value || 'en';

  return (
    <SuccessPageClient
      tenantSettings={tenantSettings}
      initialLang={initialLang}
      email={email}
    />
  );
}