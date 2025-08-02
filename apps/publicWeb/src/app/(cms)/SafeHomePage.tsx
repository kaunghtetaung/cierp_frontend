import React from "react";
import { getPageBySlug, getPageSections } from "@repo/page";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { HomePage } from "../../themes/default/templates/page/HomePage";
import { ErrorPage } from "../../feature-components/error";

/**
 * Safe page wrapper that handles service errors gracefully
 */
export default async function SafeHomePage() {
  console.log("SafeHomePage: Starting with error handling...");

  try {
    // Get tenant and middleware data first
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;
    const currentLanguage = middlewareData.language as "en" | "mm";

    if (!tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant configuration. Please check your setup."
          showRetry={false}
        />
      );
    }

    // Try to fetch page data with proper error handling
    console.log("SafeHomePage: Fetching page data...");
    const [homePage, sections] = await Promise.all([
      getPageBySlug("home"),
      getPageSections("home"),
    ]);

    console.log("SafeHomePage: Data fetched successfully");
    return (
      <HomePage
        tenantId={tenantId}
        currentLanguage={currentLanguage}
        homePage={homePage}
        sections={sections || []}
      />
    );
  } catch (error) {
    console.error("SafeHomePage: Service error detected:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isGatewayError = errorMessage.toLowerCase().includes("gateway");

    if (isGatewayError) {
      console.log("SafeHomePage: Gateway error - showing service unavailable");
      const debugInfo = `Error: ${errorMessage}\nType: Gateway/Service Error\nTimestamp: ${new Date().toISOString()}`;

      return (
        <ErrorPage
          type="service"
          title="Service Unavailable"
          message="The content management system is currently experiencing issues. Please try again later."
          debugInfo={debugInfo}
        />
      );
    }

    // For other errors, show a generic error page
    const debugInfo = `Error: ${errorMessage}\nType: General Error\nTimestamp: ${new Date().toISOString()}`;

    return (
      <ErrorPage
        type="page"
        title="Page Load Error"
        message="Unable to load page content. Please try again or contact support if the problem persists."
        debugInfo={debugInfo}
      />
    );
  }
}
