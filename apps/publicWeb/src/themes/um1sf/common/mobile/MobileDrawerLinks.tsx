import React from "react";
import Link from "next/link";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";

interface MobileDrawerLinksProps {
  tenantId?: string | null;
  currentLanguage: "en" | "mm";
  menuType?: string;
}

interface MenuNode {
  _id: string;
  title?: { en?: string; mm?: string };
  url?: string;
  slug?: string;
  openInNewTab?: boolean;
  children?: MenuNode[];
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

async function fetchMenu(
  menuType: string,
  tenantId: string | null | undefined,
): Promise<MenuNode[]> {
  if (!tenantId) return [];
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10000,
    });
    const response: any = await httpClient.request(
      `/content/navigations/menu/${encodeURIComponent(menuType)}/public?language=en`,
      { method: "GET", tenantId, withAuth: false },
    );
    if (!response?.success) return [];
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = (data as { data: unknown }).data;
    }
    return Array.isArray(data) ? (data as MenuNode[]) : [];
  } catch {
    return [];
  }
}

/**
 * Server-rendered navigation list for the MobileTopBar drawer.
 *
 * Fetches the primary menu (default `'header'`, override via
 * `menuType`) and renders it as a flat-with-indentation link list.
 * Two levels deep is enough for the drawer surface; deeper trees
 * collapse onto the second level so users can still reach them.
 *
 * Server component so the menu travels with the initial HTML —
 * no client-side fetch flash inside the drawer.
 */
export async function MobileDrawerLinks({
  tenantId,
  currentLanguage,
  menuType = "header",
}: MobileDrawerLinksProps) {
  const menu = await fetchMenu(menuType, tenantId);

  if (menu.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
        {currentLanguage === "mm" ? "ဘာမှ မရှိပါ" : "No menu items"}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {menu.map((node) => {
        const label = pickLang(node.title, currentLanguage) || node.slug || "";
        const hasChildren = (node.children?.length ?? 0) > 0;
        return (
          <li key={node._id}>
            <Link
              href={node.url || "#"}
              target={node.openInNewTab ? "_blank" : undefined}
              rel={node.openInNewTab ? "noopener noreferrer" : undefined}
              className="block px-3 py-2.5 text-sm font-medium text-foreground rounded-md hover:bg-muted/60 transition-colors"
            >
              {label}
            </Link>
            {hasChildren && (
              <ul className="ml-3 mt-0.5 mb-1 border-l border-border/60 pl-2 space-y-0.5">
                {node.children!.map((child) => (
                  <li key={child._id}>
                    <Link
                      href={child.url || "#"}
                      target={child.openInNewTab ? "_blank" : undefined}
                      rel={
                        child.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="block px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      {pickLang(child.title, currentLanguage) || child.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default MobileDrawerLinks;
