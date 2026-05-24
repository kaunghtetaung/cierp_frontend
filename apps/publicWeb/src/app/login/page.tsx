// Login page for publicWeb — minimal OIDC initiator.
//
// This route's only job is to bounce the visitor to the OIDC provider.
// There's no tenant-specific UI, no theme attachment — just a spinner
// while the browser kicks off the auth flow. We deliberately do NOT
// resolve tenant context here:
//   1. The OIDC provider lives at a fixed auth domain, not the tenant's;
//   2. Failing the page when tenant context is missing produced
//      misleading "Configuration Error" screens during plain login flows;
//   3. This page is also hit by token-expiry redirects, where the tenant
//      header may genuinely be absent.
//
// If we ever need tenant-aware login content (per-tenant login banner,
// custom OIDC clientId per tenant, etc.) reintroduce the resolution
// inside `LoginPageContent` so it stays a transient enhancement rather
// than a hard requirement.

import { Suspense } from "react";
import { LoginPageContent } from "./login-page-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg text-gray-700 font-medium">Processing…</p>
      </div>
    </div>
  );
}
