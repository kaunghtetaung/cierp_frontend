import React from "react";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";
import type { NavigationMenuSectionData, SectionProps } from "../types";
import { NavigationMenuList, type MenuNode } from "./NavigationMenuList";
import {
  getSectionSpacingStyles,
  hasAnySpacing,
} from "../section-spacing";

/**
 * Server-side fetched sidebar nav. Resolves `section.menuType` to a
 * Navigation tree via `/content/navigations/menu/<menuType>/public`,
 * then hands the tree to the client `NavigationMenuList` for the
 * interactive render (expand/collapse, active-item highlighting,
 * auto-open of the branch containing the current route).
 *
 * Errors collapse the section to `null` rather than 500-ing the
 * surrounding page — a missing nav usually shares a column with
 * other content and a stray error block would be more disruptive
 * than the absent nav itself.
 */

async function fetchMenuTree(
  menuType: string,
  tenantId: string | null | undefined,
  language: "en" | "mm",
): Promise<MenuNode[]> {
  if (!tenantId || !menuType) return [];
  try {
    const apiDomain = await getApiDomain();
    const client = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 8000,
    });
    const resp: any = await client.request(
      `/content/navigations/menu/${encodeURIComponent(menuType)}/public?language=${language}`,
      { method: "GET", tenantId, withAuth: false },
    );
    let data: any = resp?.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = (data as { data: unknown }).data;
    }
    return Array.isArray(data) ? (data as MenuNode[]) : [];
  } catch (err) {
    console.warn(
      `NavigationMenuSection: failed to fetch menu '${menuType}':`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function NavigationMenuSection({
  section,
  currentLanguage = "en",
}: SectionProps<NavigationMenuSectionData>) {
  const menuType = (section as any).menuType as string;
  const showIcons = (section as any).showIcons === true;

  // Tenant context comes from the middleware-set request headers.
  // Without a tenant we can't fetch — render nothing.
  const middleware = await getMiddlewareDataFromHeaders().catch(
    () => ({}) as any,
  );
  const tenantId: string | undefined = (middleware as any)?.tenantId;
  const tree = await fetchMenuTree(menuType, tenantId, currentLanguage);

  if (!tree || tree.length === 0) return null;

  // Author-configurable spacing falls through to inline `style`.
  // Default rhythm is `py-2` (sidebars are usually tight); drops
  // when ANY author override is configured to avoid asymmetry.
  const spacingStyles = getSectionSpacingStyles(section as any);
  const sectionHasSpacing = hasAnySpacing(section as any);

  return (
    <nav
      aria-label={`${menuType} menu`}
      data-section-type="navigationMenu"
      data-menu-type={menuType}
      className={sectionHasSpacing ? "" : "py-2"}
      style={spacingStyles}
    >
      <NavigationMenuList
        tree={tree}
        showIcons={showIcons}
        currentLanguage={currentLanguage}
      />
    </nav>
  );
}

export default NavigationMenuSection;
