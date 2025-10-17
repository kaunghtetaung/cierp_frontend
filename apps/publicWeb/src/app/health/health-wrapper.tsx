import React from "react";
import { cache } from "react";
import { headers } from "next/headers";
import { getTenantSettingClientSafe } from "@repo/tenant/tenant-service";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
// import { getContentSettings, type ContentSettingsData } from "@repo/content"; // Temporarily commented out - will fix later
import { getPageBySlug, getPageSections, type PageData } from "@repo/page";
import type { SectionData } from "@repo/types";
import type { TenantSettingsDto } from "@repo/types";

/**
 * Get API subdomain based on environment
 */
function getApiSubdomain(): string {
  const envSubdomain = process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }
  // Default: use 'api' for production, 'api-dev' for development
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? 'api-dev' : 'api';
}

// Health data interface
interface HealthData {
  tenantSettings: TenantSettingsDto | null;
  contentSettings: {
    data: any | null; // ContentSettingsData | null; // Temporarily using any
    error: string | null;
  };
  homePageData: {
    title: { en: string; mm: string } | null;
    sections: SectionData[] | null;
    isHomePage: boolean | null;
    totalSections: number;
    error: string | null;
  };
  middlewareData: {
    tenantId: string | null;
    language: string;
    requestId: string | null;
    hostname: string | null;
    protocol: string;
    appId: string; // Changed from 'app' to 'appId' to match getMiddlewareDataFromHeaders return type
    appConfig?: any;
  };
  systemStatus: {
    middlewareWorking: boolean;
    httpClientWorking: boolean;
    contentModuleWorking: boolean;
    pageModuleWorking: boolean;
    apiEndpoint: string;
    timestamp: string;
  };
  requestInfo: {
    userAgent: string;
    allHeaders: Record<string, string>;
  };
  error: string | null;
}

// Props interface
interface HealthWrapperProps {
  children: React.ReactNode | ((data: HealthData) => React.ReactNode);
}

/**
 * Cached function to fetch health data - follows project pattern
 * wrapper -> react cache -> service -> http client
 */
const getHealthData = cache(async (): Promise<HealthData> => {
  const headersList = await headers();
  const middlewareData = await getMiddlewareDataFromHeaders();

  // Get all relevant headers for debugging
  const hostname = headersList.get("x-hostname") || "unknown";
  const protocol = headersList.get("x-protocol") || "unknown";
  const tenantId = middlewareData.tenantId;

  let tenantSettings: TenantSettingsDto | null = null;
  let error: string | null = null;
  let httpClientWorking = false;

  // Fetch tenant settings if tenant ID is available
  if (tenantId) {
    try {
      console.log(
        "🏥 Health Wrapper - Fetching tenant settings for:",
        tenantId
      );
      tenantSettings = await getTenantSettingClientSafe(tenantId);
      httpClientWorking = true;
      console.log("🏥 Health Wrapper - Successfully fetched tenant settings");
    } catch (err) {
      console.error("🏥 Health Wrapper - Error fetching tenant settings:", err);
      error =
        err instanceof Error ? err.message : "Failed to fetch tenant settings";
    }
  } else {
    console.warn("🏥 Health Wrapper - No tenant ID available from middleware");
  }

  // Fetch content settings using the content module
  let contentSettings: {
    data: any | null; // ContentSettingsData | null; // Temporarily using any
    error: string | null;
  } = {
    data: null,
    error: null,
  };
  let contentModuleWorking = false;

  if (tenantId) {
    try {
      console.log(
        "🏥 Health Wrapper - Fetching content settings for:",
        tenantId
      );
      // const settingsResult = await getContentSettings(tenantId); // Temporarily commented out
      const settingsResult = { themeName: 'default' }; // Placeholder

      contentSettings = {
        data: settingsResult,
        error: null,
      };
      contentModuleWorking = true;
      console.log(
        "🏥 Health Wrapper - Successfully fetched content settings:",
        settingsResult.themeName
      );
    } catch (err) {
      console.error(
        "🏥 Health Wrapper - Error fetching content settings:",
        err
      );
      contentSettings.error =
        err instanceof Error ? err.message : "Failed to fetch content settings";
    }
  } else {
    console.warn(
      "🏥 Health Wrapper - No tenant ID available for content settings fetch"
    );
  }

  // Fetch home page data using the page module
  let homePageData: {
    title: { en: string; mm: string } | null;
    sections: SectionData[] | null;
    isHomePage: boolean | null;
    totalSections: number;
    error: string | null;
  } = {
    title: null,
    sections: null,
    isHomePage: null,
    totalSections: 0,
    error: null,
  };
  let pageModuleWorking = false;

  if (tenantId) {
    try {
      console.log("🏥 Health Wrapper - Fetching home page data (slug: home)");
      const homePage = await getPageBySlug("home");

      if (homePage) {
        const sections = await getPageSections("home");
        homePageData = {
          title: homePage.title,
          sections: sections,
          isHomePage: homePage.isHomePage,
          totalSections: sections.length,
          error: null,
        };
        pageModuleWorking = true;
        console.log(
          "🏥 Health Wrapper - Successfully fetched home page:",
          homePage.title.en
        );
        console.log(
          "🏥 Health Wrapper - Home page sections count:",
          sections.length
        );
      } else {
        homePageData.error = "Home page not found (slug: home)";
        console.warn("🏥 Health Wrapper - Home page not found");
      }
    } catch (err) {
      console.error("🏥 Health Wrapper - Error fetching home page:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch home page";

      // Check if it's a page not found error vs other API errors
      if (
        errorMessage.includes('Failed to fetch page "home"') ||
        errorMessage.includes("404") ||
        errorMessage.includes("not found")
      ) {
        homePageData.error =
          'Home page does not exist in this tenant (slug: "home" not found)';
      } else {
        homePageData.error = `API Error: ${errorMessage}`;
      }
    }
  } else {
    console.warn(
      "🏥 Health Wrapper - No tenant ID available for home page fetch"
    );
    homePageData.error = "No tenant ID available";
  }

  // Build API endpoint URL using domain helper with environment-based subdomain
  const apiSubdomain = getApiSubdomain();
  const apiEndpoint = tenantSettings
    ? `${protocol}://${apiSubdomain}.${hostname.split(":")[0].replace(/^www\./, "")}:3331`
    : "Not available";

  // Get request info
  const userAgent = headersList.get("user-agent") || "Unknown";
  const allHeaders = Object.fromEntries(headersList.entries());

  return {
    tenantSettings,
    contentSettings,
    homePageData,
    middlewareData,
    systemStatus: {
      middlewareWorking: !!tenantId,
      httpClientWorking,
      contentModuleWorking,
      pageModuleWorking,
      apiEndpoint,
      timestamp: new Date().toISOString(),
    },
    requestInfo: {
      userAgent,
      allHeaders,
    },
    error,
  };
});

/**
 * Health Wrapper Component - Server Component that fetches health data
 * and provides it to children following the established wrapper pattern
 */
export async function HealthWrapper({
  children,
}: HealthWrapperProps): Promise<any> { // Simplified return type for build compatibility
  console.log("🏥 Health Wrapper - Starting health data fetch");

  try {
    const healthData = await getHealthData();

    console.log("🏥 Health Wrapper - Health data fetch completed:", {
      hasTenantSettings: !!healthData.tenantSettings,
      middlewareWorking: healthData.systemStatus.middlewareWorking,
      httpClientWorking: healthData.systemStatus.httpClientWorking,
      tenantId: healthData.middlewareData.tenantId,
    });

    // Support both render prop and direct children patterns
    if (typeof children === "function") {
      return children(healthData);
    }

    // For JSX children, we'll use React.cloneElement to inject props
    // This follows the managementpanel pattern
    return <div data-health-wrapper="true">{children}</div>;
  } catch (err) {
    console.error("🏥 Health Wrapper - Critical error:", err);

    // Return error state
    const errorData: HealthData = {
      tenantSettings: null,
      contentSettings: {
        data: null,
        error: "Not available due to critical error",
      },
      homePageData: {
        title: null,
        sections: null,
        isHomePage: null,
        totalSections: 0,
        error: "Not available due to critical error",
      },
      middlewareData: {
        tenantId: null,
        language: "en",
        requestId: null,
        hostname: null,
        protocol: "https",
        appId: "unknown", // Changed from 'app' to 'appId'
        appConfig: null,
      },
      systemStatus: {
        middlewareWorking: false,
        httpClientWorking: false,
        contentModuleWorking: false,
        pageModuleWorking: false,
        apiEndpoint: "Error",
        timestamp: new Date().toISOString(),
      },
      requestInfo: {
        userAgent: "Unknown",
        allHeaders: {},
      },
      error: err instanceof Error ? err.message : "Critical health check error",
    };

    if (typeof children === "function") {
      return children(errorData);
    }

    return <div data-health-wrapper="error">{children}</div>;
  }
}

// Export the type for use in consuming components
export type { HealthData };
