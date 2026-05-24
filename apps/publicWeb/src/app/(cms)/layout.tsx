import React from "react";
import { getTheme } from "@/themes";
import { isKnownTheme } from "@repo/types";
import { getContentSettings } from "@repo/content";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

// Force all CMS pages to be dynamic to avoid header serialization issues
export const dynamic = 'force-dynamic';

interface CMSLayoutState {
  tenant: Record<string, any> | null;
  contentSettings: Record<string, any> | null;
  themeName: string;
}

/**
 * Load tenant and content settings
 */
async function loadCMSData(): Promise<CMSLayoutState> {
  const state: CMSLayoutState = {
    tenant: null,
    contentSettings: null,
    themeName: "default",
  };

  try {
    // Get tenant from parent TenantProvider context
    const { getCurrentTenantForClient } = await import("@repo/tenant/wrapper");
    state.tenant = await getCurrentTenantForClient();

    // Resolve `themeName` from the tenant's content settings doc.
    // Read order:
    //   1. `Settings.themeName` (admin-authored, single source of truth)
    //   2. legacy `tenant.theme` field (back-compat for tenants that
    //      haven't authored Settings yet)
    //   3. 'default' as a final fallback
    // Theme keys not in the registry catalogue are rejected so a
    // typo in the DB doesn't crash the layout — fall back instead.
    try {
      const middleware = await getMiddlewareDataFromHeaders();
      const tenantId = middleware?.tenantId;
      if (tenantId) {
        const contentSettings = await getContentSettings(tenantId);
        state.contentSettings = contentSettings as any;
        const candidate = (contentSettings as any)?.themeName;
        if (candidate && isKnownTheme(candidate)) {
          state.themeName = candidate;
        } else if (state.tenant?.theme && isKnownTheme(state.tenant.theme)) {
          state.themeName = state.tenant.theme;
        }
      } else if (state.tenant?.theme && isKnownTheme(state.tenant.theme)) {
        state.themeName = state.tenant.theme;
      }
    } catch (settingsError) {
      console.error("Failed to load content settings:", settingsError);
      // Continue with defaults
    }
  } catch (error) {
    console.error("Error in CMSLayout:", error);
    // Continue with defaults
  }

  return state;
}

/**
 * Render theme layout with children
 */
function renderThemeLayout(
  state: CMSLayoutState,
  children: React.ReactNode
): React.ReactElement {
  try {
    const ThemeLayout = getTheme(state.themeName as "default");
    return <ThemeLayout tenantSetting={state.tenant}>{children}</ThemeLayout>;
  } catch (themeError) {
    console.error(
      `Failed to load theme "${state.themeName}", falling back to default:`,
      themeError
    );

    // Fallback to default theme
    const DefaultTheme = getTheme("default");
    return <DefaultTheme>{children}</DefaultTheme>;
  }
}

export default async function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load CMS data (tenant and content settings)
  const state = await loadCMSData();

  // Render theme layout - children will handle their own error management
  return renderThemeLayout(state, children);
}
