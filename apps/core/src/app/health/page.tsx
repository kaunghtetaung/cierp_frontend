import React from "react";
import { headers } from "next/headers";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import { getModuleSchemas, getSupportedLanguages, getServiceInfo } from "@repo/appSchema/wrapper";
import HealthPageClient from "./HealthPageClient";

export default async function HealthPage() {
  // Server-side data fetching
  const headersList = await headers();
  const middlewareData = await getMiddlewareDataFromHeaders();

  // Get tenant data on server side
  let tenant = null;
  let tenantError = null;

  try {
    tenant = await getCurrentTenantForClient();
  } catch (error) {
    console.error("Failed to get tenant:", error);
    tenantError =
      error instanceof Error ? error.message : "Failed to load tenant";
  }

  // Get app schema data on server side
  let appSchemaData = null;
  let appSchemaError = null;

  if (tenant?.id && middlewareData?.appId) {
    try {
      console.log(`🔧 Fetching app schema data for tenant: ${tenant.id}, app: ${middlewareData.appId}`);
      
      // Fetch module schemas using the app schema wrapper with app context
      const [moduleSchemas, supportedLanguages, serviceInfo] = await Promise.all([
        getModuleSchemas(tenant.id, middlewareData.appId),
        getSupportedLanguages(tenant.id, middlewareData.appId),
        getServiceInfo(tenant.id, middlewareData.appId)
      ]);

      appSchemaData = {
        modules: moduleSchemas.modules || [],
        supportedLanguages: supportedLanguages || [],
        serviceName: serviceInfo.serviceName || 'unknown',
        timestamp: serviceInfo.timestamp || new Date().toISOString(),
        appId: middlewareData.appId
      };

      console.log(`✅ Successfully fetched ${appSchemaData.modules.length} modules from app schema service for app: ${middlewareData.appId}`);
    } catch (error) {
      console.error("Failed to get app schema data:", error);
      appSchemaError = error instanceof Error ? error.message : "Failed to load app schema";
    }
  } else {
    appSchemaError = "No tenant ID or app ID available for app schema fetch";
  }

  // Pass server data to client component
  return (
    <HealthPageClient
      initialTenant={tenant}
      tenantError={tenantError}
      middlewareData={middlewareData}
      appSchemaData={appSchemaData}
      appSchemaError={appSchemaError}
    />
  );
}
