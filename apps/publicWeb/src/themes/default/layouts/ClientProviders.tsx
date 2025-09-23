"use client";

import React from "react";
import { LangSelectorProvider } from "@/feature-components/lang-selector";
import { UserMenuProvider } from "@/feature-components/user-menu";
import { SearchProvider } from "@/feature-components/search";

interface ClientProvidersProps {
  children: React.ReactNode;
  initialLanguage?: string;
  initialUser?: any;
}

/**
 * Client Providers Component
 * Wraps children with all client-side providers
 * This component runs on the client side to handle state management
 * 
 * NOTE: AuthProvider removed - publicWeb is a public website that doesn't require authentication.
 * For pages that need authentication, wrap them individually with AuthProvider.
 */
export function ClientProviders({
  children,
  initialLanguage = "en",
  initialUser = null,
}: ClientProvidersProps) {
  return (
    <LangSelectorProvider initialLanguage={initialLanguage}>
      <UserMenuProvider initialUser={initialUser}>
        <SearchProvider searchEndpoint="/api/search">
          {children}
        </SearchProvider>
      </UserMenuProvider>
    </LangSelectorProvider>
  );
}

export default ClientProviders;
