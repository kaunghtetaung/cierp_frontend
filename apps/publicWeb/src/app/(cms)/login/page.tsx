// Login page for publicWeb app
import { Suspense } from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { LoginPageContent } from "./login-page-content";
import { ErrorPage } from "../../../feature-components/error";

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-700 font-medium">Processing...</p>
      </div>
    </div>
  );
}
