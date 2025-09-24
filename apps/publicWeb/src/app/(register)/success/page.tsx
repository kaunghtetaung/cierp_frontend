import React from 'react';
import { getApiDomain } from "@repo/utils/server";
import { TenantService } from "@repo/tenant/tenant-service";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { cookies } from "next/headers";
import { SuccessPageClient } from "./SuccessPageClient";
import type { TenantSettings } from "@repo/types";

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

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const tenantSettings = await fetchTenantSettings();
  const cookieStore = await cookies();
  const initialLang = cookieStore.get('x-lang')?.value || 'en';
  const params = await searchParams;
  const email = params.email || '';

  return (
    <SuccessPageClient
      tenantSettings={tenantSettings}
      initialLang={initialLang}
      email={email}
    />
  );
}