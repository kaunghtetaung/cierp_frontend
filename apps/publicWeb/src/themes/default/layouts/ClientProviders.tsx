"use client";

import React from "react";
import { LangSelectorProvider } from "@/feature-components/lang-selector";
import { UserMenuProvider } from "@/feature-components/user-menu";
import { SearchProvider } from "@/feature-components/search";
import { AuthProvider } from "@repo/auth";

interface ClientProvidersProps {
  children: React.ReactNode;
  initialLanguage?: string;
  initialUser?: any;
}

/**
 * Client Providers Component
 * Wraps children with all client-side providers
 * This component runs on the client side to handle state management
 */
export function ClientProviders({
  children,
  initialLanguage = "en",
  initialUser = null,
}: ClientProvidersProps) {
  return (
    <AuthProvider>
      <LangSelectorProvider initialLanguage={initialLanguage}>
        <UserMenuProvider initialUser={initialUser}>
          <SearchProvider searchEndpoint="/api/search">
            {children}
          </SearchProvider>
        </UserMenuProvider>
      </LangSelectorProvider>
    </AuthProvider>
  );
}

export default ClientProviders;
