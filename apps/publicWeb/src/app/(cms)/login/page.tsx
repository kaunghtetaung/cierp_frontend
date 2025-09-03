// Login page for publicWeb app
import { Suspense } from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { LoginPageContent } from "./login-page-content";
import { ErrorPage } from "../../../feature-components/error";
import { FullPageLoadingDisplay } from "../../../styled-components/ui/LoadingSpinners";

// Force this page to be dynamic since it accesses runtime headers
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default async function LoginPage() {
  try {
    // Get tenant context from middleware
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant. Please check your URL."
          showRetry={false}
        />
      );
    }

    // Get tenant settings for customization
    const tenantSettings = null; // Temporarily disabled

    return (
      <Suspense fallback={<LoginPageFallback />}>
        <LoginPageContent tenantSettings={tenantSettings} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading login page:", error);

    return (
      <ErrorPage
        type="page"
        title="Login Error"
        message="Unable to load login page. Please try again."
      />
    );
  }
}

function LoginPageFallback() {
  return <FullPageLoadingDisplay text="Loading login page..." />;
}
