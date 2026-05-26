import React from "react";
import { cookies } from "next/headers";
import AuthShell from "./_components/AuthShell";

interface RegisterLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for all `(register)` routes — signup, verify, success,
 * profileSetup. Wraps children in `AuthShell` so signup/verify flows
 * never inherit the marketing `(cms)` theme chrome. This is the
 * single source of truth for auth-shell branding; per-screen client
 * components should render plain content only.
 */
export default async function RegisterLayout({
  children,
}: RegisterLayoutProps) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("x-lang");
  const initialLanguage = langCookie?.value || "en";

  return <AuthShell initialLanguage={initialLanguage}>{children}</AuthShell>;
}
