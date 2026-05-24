"use client";

import React from "react";
import { LangSelectorProvider } from "@/feature-components/lang-selector";
import { UserMenuProvider } from "@/feature-components/user-menu";
import { SearchProvider } from "@/feature-components/search";

interface AppClientProvidersProps {
  children: React.ReactNode;
  initialLanguage?: string;
  initialUser?: any;
}

/**
 * App-wide client providers — language selector, user menu, search.
 *
 * These were previously mounted inside `themes/default/layouts/ClientProviders.tsx`
 * but they are tenant-wide concerns (not theme-specific). Routes that
 * live OUTSIDE the `(cms)` route group — `app/library/`, `app/login/`,
 * `app/(register)/` — also need access to these contexts. Promoting
 * them to the root layout means every route in the app gets them.
 *
 * Theme RootLayouts no longer need to mount these themselves; if they
 * do, the inner provider just shadows the outer one harmlessly.
 */
export function AppClientProviders({
  children,
  initialLanguage = "en",
  initialUser = null,
}: AppClientProvidersProps) {
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

export default AppClientProviders;
