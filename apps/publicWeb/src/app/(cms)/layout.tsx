import React from "react";
import { getTheme } from "@/themes";

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

    // Load content settings for this tenant
    try {
      // Simplified: just use default theme for now
      state.themeName = state.tenant?.theme || "default";
      state.contentSettings = { themeName: state.themeName };
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
