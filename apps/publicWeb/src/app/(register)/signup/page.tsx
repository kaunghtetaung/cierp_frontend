import { Metadata } from "next";
import { SignupPageClient } from "./SignupPageClient";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { TenantService } from "@repo/tenant/tenant-service";
import type { TenantSettings } from "@repo/types";
import { cookies } from "next/headers";

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

export default async function SignupPage() {
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