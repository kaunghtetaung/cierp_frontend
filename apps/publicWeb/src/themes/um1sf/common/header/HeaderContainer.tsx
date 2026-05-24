import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { createHttpClient } from "@repo/api/client";
import { IconComponent } from "@repo/ui/components/icons";
import HeaderUserActions from "./HeaderUserActions";
import HeaderLangSelector from "./HeaderLangSelector";
import HeaderSearch from "./HeaderSearch";
import MobileMenu from "./MobileMenu";

interface HeaderContainerProps {
  currentLanguage?: "en" | "mm";
}

interface MenuTreeNode {
  _id: string;
  title?: { en?: string; mm?: string };
  url?: string;
  slug?: string;
  icon?: string;
  openInNewTab?: boolean;
  /**
   * 'dropdown' (default) → vertical drop panel.
   * 'mega'              → wide multi-column panel; each direct child
   *                        is a column header, grandchildren are the
   *                        column's links.
   */
  displayType?: "dropdown" | "mega";
  children?: MenuTreeNode[];
}

/**
 * Recursive list-item used inside the audience (secondary header)
 * dropdown. Renders the item as a `<Link>`; when it has children,
 * the link is wrapped in a `group/sub` flex row that shows a
 * `ChevronRight` indicator + reveals a side-out flyout positioned
 * `left-full top-0` (classic OS menu pattern). Each nested level
 * gets its OWN `group/sub` scope so the hover state cascades only
 * along the actually-hovered branch, not every sibling on that
 * level.
 *
 * Pure CSS, no JS — same `group-hover` pattern as the parent
 * dropdown, so the menu works without hydration and survives SSR.
 */
function AudienceMenuItem({
  node,
  currentLanguage,
}: {
  node: MenuTreeNode;
  currentLanguage: "en" | "mm";
}) {
  const label = pickLang(node.title, currentLanguage) || node.slug || "";
  const hasChildren = (node.children?.length ?? 0) > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={node.url || "#"}
          target={node.openInNewTab ? "_blank" : undefined}
          rel={node.openInNewTab ? "noopener noreferrer" : undefined}
          role="menuitem"
          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors whitespace-nowrap"
        >
          {node.icon && (
            <IconComponent
              name={node.icon}
              size={14}
              className="flex-shrink-0"
            />
          )}
          {label}
        </Link>
      </li>
    );
  }

  return (
    <li className="relative group/sub">
      <Link
        href={node.url || "#"}
        target={node.openInNewTab ? "_blank" : undefined}
        rel={node.openInNewTab ? "noopener noreferrer" : undefined}
        role="menuitem"
        aria-haspopup="menu"
        className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors whitespace-nowrap"
      >
        <span className="flex items-center gap-2">
          {node.icon && (
            <IconComponent
              name={node.icon}
              size={14}
              className="flex-shrink-0"
            />
          )}
          {label}
        </span>
        <ChevronRight
          className="h-3 w-3 opacity-70 shrink-0"
          aria-hidden
        />
      </Link>

      {/* Side-out flyout — positioned to the right of the parent
          panel. `pl-1` preserves a small hover-bridge so the cursor
          can travel between the trigger row and the flyout without
          losing hover. `z-50` keeps it above sibling panels. */}
      <div
        className="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-150 absolute left-full top-0 pl-1 z-50 min-w-[200px]"
        role="menu"
        aria-label={`${label} submenu`}
      >
        <ul
          className="rounded-md border border-border bg-background shadow-2xl overflow-hidden"
          style={{
            borderTopWidth: 3,
            borderTopColor: "var(--color-primary)",
          }}
        >
          {node.children!.map((child) => (
            <AudienceMenuItem
              key={child._id}
              node={child}
              currentLanguage={currentLanguage}
            />
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * um1sf Header — Stanford-inspired 2-row layout, dynamically driven.
 *
 * Row 1: audience gateway — pulled from the `secondary-header-menu`
 *        Navigation tree (Alumni, Students, Staff, Library, …).
 * Row 2: brand row with logo + primary nav + dual-scope search.
 *        Brand title / subtitle come from Content Settings
 *        (`header.customBannerTitle` / `customBannerSubtitle`); when
 *        `useOrgInfoAsBanner` is on (or when those fields are blank)
 *        the org's `fullName` is used in a single line.
 *        Primary nav items come from the `header` Navigation tree.
 *
 * Every fetch degrades gracefully on failure so a transient gateway
 * outage doesn't blank the chrome.
 */
export async function HeaderContainer({
  currentLanguage = "en",
}: HeaderContainerProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  // ── Fetch the three pieces in parallel.
  const [settings, primaryMenu, audienceMenu] = await Promise.all([
    tenantId
      ? getContentSettings(tenantId).catch(() => null)
      : Promise.resolve(null),
    fetchMenuTree("header", tenantId).catch(() => [] as MenuTreeNode[]),
    fetchMenuTree("secondary-header-menu", tenantId).catch(
      () => [] as MenuTreeNode[],
    ),
  ]);

  // ── Resolve brand title / subtitle.
  const useOrgInfoAsBanner =
    (settings as any)?.header?.useOrgInfoAsBanner ?? false;
  const customTitle = pickLang(
    (settings as any)?.header?.customBannerTitle,
    currentLanguage,
  );
  const customSubtitle = pickLang(
    (settings as any)?.header?.customBannerSubtitle,
    currentLanguage,
  );
  const orgFullName =
    (settings as any)?.organization?.fullName ||
    (settings as any)?.organizationName ||
    "";
  const brandTitle =
    !useOrgInfoAsBanner && customTitle ? customTitle : orgFullName;
  const brandSubtitle =
    !useOrgInfoAsBanner && customSubtitle ? customSubtitle : "";

  // ── Header section toggles (Content Settings → header.*).
  // Default to ON when absent so a fresh tenant doesn't get a chrome-
  // less header before the admin has visited the Settings page.
  const headerCfg = (settings as any)?.header ?? {};
  const showLogo = headerCfg.showLogo !== false;
  const showNavigation = headerCfg.showNavigation !== false;
  const showSearch = headerCfg.showSearch !== false;
  const showLanguageSelector = headerCfg.showLanguageSelector !== false;
  const showUserMenu = headerCfg.showUserMenu !== false;

  return (
    <header className="w-full border-b border-border">
      {/* Row 1 — audience gateway. Desktop-only (≥ lg) — on mobile
          the secondary menu lives inside the slide-in drawer. */}
      <div
        className="hidden lg:block w-full"
        style={{
          backgroundColor: "var(--color-gateway-bg)",
          color: "var(--color-gateway-text)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 py-3 text-sm">
            <nav className="flex items-center gap-5 flex-wrap">
              {(audienceMenu as MenuTreeNode[]).map((item) => {
                const label =
                  pickLang(item.title, currentLanguage) || item.slug || "";
                const hasChildren = (item.children?.length ?? 0) > 0;

                // Leaf item — plain link, original behaviour.
                if (!hasChildren) {
                  return (
                    <Link
                      key={item._id}
                      href={item.url || "#"}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={
                        item.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="inline-flex items-center gap-1.5 transition-colors"
                      style={{ color: "var(--color-gateway-link)" }}
                    >
                      {item.icon && (
                        <IconComponent
                          name={item.icon}
                          size={14}
                          className="flex-shrink-0"
                        />
                      )}
                      {label}
                    </Link>
                  );
                }

                // Parent with children — hover-reveal dropdown panel.
                // Scaled tighter than the primary nav's mega panel
                // since the secondary row is denser: small min-width,
                // vertical list, primary-coloured top border accent.
                // `<details>`-free pure CSS group-hover so the menu
                // works without JS and SSRs cleanly.
                return (
                  <div key={item._id} className="relative group">
                    <Link
                      href={item.url || "#"}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={
                        item.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="inline-flex items-center gap-1.5 transition-colors"
                      style={{ color: "var(--color-gateway-link)" }}
                    >
                      {item.icon && (
                        <IconComponent
                          name={item.icon}
                          size={14}
                          className="flex-shrink-0"
                        />
                      )}
                      {label}
                      <ChevronDown
                        className="h-3 w-3 opacity-70 transition-transform group-hover:rotate-180"
                        aria-hidden
                      />
                    </Link>

                    {/* Dropdown panel — visible on group-hover.
                        `pt-3` between trigger and panel preserves a
                        hover-bridge so the panel doesn't disappear
                        when the cursor crosses the gap. */}
                    <div
                      className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-3 z-50 min-w-[200px]"
                      role="menu"
                      aria-label={`${label} submenu`}
                    >
                      <ul
                        className="rounded-md border border-border bg-background shadow-2xl overflow-visible"
                        style={{
                          borderTopWidth: 3,
                          borderTopColor: "var(--color-primary)",
                        }}
                      >
                        {item.children!.map((child) => (
                          <AudienceMenuItem
                            key={child._id}
                            node={child}
                            currentLanguage={currentLanguage}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              {showLanguageSelector && <HeaderLangSelector />}
              {showUserMenu && (
                <HeaderUserActions language={currentLanguage} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — brand bar with logo + primary nav + search */}
      <div className="w-full bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-6 py-3 lg:py-5">
            {/* Logo / wordmark. On mobile (< lg) the title is allowed
                to truncate and the subtitle is hidden so the row stays
                a single compact line next to the hamburger trigger. */}
            {showLogo && (
              <Link
                href="/"
                className="flex items-baseline gap-2 min-w-0 lg:shrink-0"
              >
                <span
                  className="text-lg md:text-xl lg:text-[1.6rem] font-bold tracking-tight truncate"
                  style={{
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {brandTitle}
                </span>
                {brandSubtitle && (
                  <span
                    className="hidden lg:inline text-xs uppercase tracking-widest text-muted-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {brandSubtitle}
                  </span>
                )}
              </Link>
            )}

            {/* Primary nav — desktop only.
                Items with `children[]` render as a hover-reveal panel
                (CSS group-hover, no JS). Single-level items stay as
                plain links. ChevronDown indicator only when there's
                a sub-tree to expand. */}
            {showNavigation && (
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
              {(primaryMenu as MenuTreeNode[]).map((item) => {
                const label =
                  pickLang(item.title, currentLanguage) || item.slug || "";
                const hasChildren = (item.children?.length ?? 0) > 0;

                if (!hasChildren) {
                  return (
                    <Link
                      key={item._id}
                      href={item.url || "#"}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={
                        item.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="um1sf-nav-link inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 transition-colors hover:text-primary"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item.icon && (
                        <IconComponent
                          name={item.icon}
                          size={14}
                          className="flex-shrink-0"
                        />
                      )}
                      {label}
                    </Link>
                  );
                }

                const isMega = item.displayType === "mega";

                return (
                  <div key={item._id} className="relative group">
                    <Link
                      href={item.url || "#"}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={
                        item.openInNewTab ? "noopener noreferrer" : undefined
                      }
                      className="um1sf-nav-link inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 transition-colors hover:text-primary"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item.icon && (
                        <IconComponent
                          name={item.icon}
                          size={14}
                          className="flex-shrink-0"
                        />
                      )}
                      {label}
                      <ChevronDown
                        className="h-3 w-3 opacity-70 transition-transform group-hover:rotate-180"
                        aria-hidden
                      />
                    </Link>

                    {isMega ? (
                      // Mega panel — full-row width, multi-column
                      // grid. Each direct child becomes a column;
                      // each child's `children` become its links. If
                      // a child has no children, its row stands alone
                      // as a single header-link in its column. Spans
                      // the page-wide max-w-7xl so the panel feels
                      // anchored to the brand container, not the
                      // single nav item.
                      <div
                        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-1/2 -translate-x-1/2 top-full pt-3 z-40 w-screen max-w-7xl px-4 sm:px-6 lg:px-8"
                        role="menu"
                        aria-label={`${label} mega menu`}
                      >
                        <div
                          className="rounded-md border border-border bg-background shadow-2xl"
                          style={{
                            borderTopWidth: 3,
                            borderTopColor: "var(--color-primary)",
                          }}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6 p-6">
                            {item.children!.map((col) => {
                              const colLabel =
                                pickLang(col.title, currentLanguage) ||
                                col.slug ||
                                "";
                              const colHeaderInner = (
                                <span className="inline-flex items-center gap-1.5">
                                  {col.icon && (
                                    <IconComponent
                                      name={col.icon}
                                      size={14}
                                      className="flex-shrink-0"
                                    />
                                  )}
                                  {colLabel}
                                </span>
                              );
                              return (
                                <div key={col._id} className="min-w-0">
                                  <div
                                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                                    style={{
                                      color: "var(--color-primary)",
                                      fontFamily: "var(--font-sans)",
                                    }}
                                  >
                                    {col.url ? (
                                      <Link
                                        href={col.url}
                                        target={
                                          col.openInNewTab
                                            ? "_blank"
                                            : undefined
                                        }
                                        rel={
                                          col.openInNewTab
                                            ? "noopener noreferrer"
                                            : undefined
                                        }
                                        className="hover:underline"
                                      >
                                        {colHeaderInner}
                                      </Link>
                                    ) : (
                                      colHeaderInner
                                    )}
                                  </div>
                                  <ul className="space-y-1.5">
                                    {(col.children ?? []).map((leaf) => (
                                      <li key={leaf._id}>
                                        <Link
                                          href={leaf.url || "#"}
                                          target={
                                            leaf.openInNewTab
                                              ? "_blank"
                                              : undefined
                                          }
                                          rel={
                                            leaf.openInNewTab
                                              ? "noopener noreferrer"
                                              : undefined
                                          }
                                          className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
                                          style={{
                                            fontFamily: "var(--font-sans)",
                                          }}
                                        >
                                          {leaf.icon && (
                                            <IconComponent
                                              name={leaf.icon}
                                              size={14}
                                              className="flex-shrink-0"
                                            />
                                          )}
                                          {pickLang(
                                            leaf.title,
                                            currentLanguage,
                                          ) || leaf.slug}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Multi-level dropdown panel — items with their
                      // own children show a chevron and reveal a
                      // side-flyout on hover. CSS-only nesting via
                      // `group` per-li (each level is its own group, so
                      // `group-hover:` targets the closest ancestor).
                      //
                      // Auto-column layout based on item count:
                      //   ≤ 10 children → 1 column
                      //   11–30        → 2 columns
                      //   > 30         → 3 columns
                      // Children are chunked column-major (top-to-
                      // bottom, left-to-right) so reading order is
                      // preserved.
                      (() => {
                        const total = item.children!.length;
                        const colCount = total > 30 ? 3 : total > 10 ? 2 : 1;
                        const perCol = Math.ceil(total / colCount);
                        const chunks: MenuTreeNode[][] = [];
                        for (let i = 0; i < colCount; i++) {
                          chunks.push(
                            item.children!.slice(i * perCol, (i + 1) * perCol),
                          );
                        }
                        const colsClass =
                          colCount === 3
                            ? "grid-cols-3"
                            : colCount === 2
                              ? "grid-cols-2"
                              : "grid-cols-1";

                        return (
                          <div
                            className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-3 z-40"
                            role="menu"
                            aria-label={`${label} submenu`}
                          >
                            <div
                              className="min-w-[240px] rounded-md border border-border bg-background shadow-xl"
                              style={{
                                borderTopWidth: 3,
                                borderTopColor: "var(--color-primary)",
                              }}
                            >
                              <div className={`grid ${colsClass} gap-x-1 py-2`}>
                                {chunks.map((chunk, ci) => (
                                  <ul key={ci} className="min-w-[220px]">
                                    {chunk.map((child) => (
                                      <DropdownNode
                                        key={child._id}
                                        node={child}
                                        language={currentLanguage}
                                      />
                                    ))}
                                  </ul>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })}
            </nav>
            )}

            {/* Desktop search (≥ lg) — mobile gets a search icon inside
                the MobileMenu trigger row, so this is intentionally
                hidden on smaller widths. */}
            {showSearch && <HeaderSearch currentLanguage={currentLanguage} />}

            {/* Mobile shell (< lg): search icon + hamburger that opens
                a slide-in drawer with the full primary + audience nav,
                language switcher, and user actions. Desktop layout is
                unaffected — every desktop block above is gated by
                `hidden lg:flex` / `hidden lg:block`. */}
            <div className="lg:hidden">
              <MobileMenu
                primaryMenu={primaryMenu as MenuTreeNode[]}
                audienceMenu={audienceMenu as MenuTreeNode[]}
                currentLanguage={currentLanguage}
                showSearch={showSearch}
                showNavigation={showNavigation}
                showLanguageSelector={showLanguageSelector}
                showUserMenu={showUserMenu}
                brandTitle={brandTitle}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderContainer;

// ── Helpers ──────────────────────────────────────────────────────────

function pickLang(
  text: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!text) return "";
  return (text as any)[lang] || text.en || text.mm || "";
}

/**
 * Recursive dropdown row. Each level is its own `group` so the
 * flyout reveal is scoped to the closest ancestor — Tailwind's
 * `group-hover:` resolves to the nearest `group` parent, so nested
 * submenus open independently of one another. CSS-only, no client JS.
 *
 * The flyout is positioned to the RIGHT of its parent row (`left-full
 * top-0`); the `pl-1` keeps the hover region continuous so the user
 * can move from a parent row into its flyout without losing hover.
 */
function DropdownNode({
  node,
  language,
}: {
  node: MenuTreeNode;
  language: "en" | "mm";
}) {
  const label = pickLang(node.title, language) || node.slug || "";
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <li className={hasChildren ? "relative group/sub" : "relative"}>
      <Link
        href={node.url || "#"}
        target={node.openInNewTab ? "_blank" : undefined}
        rel={node.openInNewTab ? "noopener noreferrer" : undefined}
        className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <span className="inline-flex items-center gap-1.5">
          {node.icon && (
            <IconComponent
              name={node.icon}
              size={14}
              className="flex-shrink-0"
            />
          )}
          {label}
        </span>
        {hasChildren && (
          <ChevronRight
            className="h-3.5 w-3.5 opacity-60"
            aria-hidden
          />
        )}
      </Link>
      {hasChildren && (
        <div
          className="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-150 absolute left-full top-0 pl-1 z-50"
          role="menu"
          aria-label={`${label} submenu`}
        >
          <div
            className="min-w-[220px] rounded-md border border-border bg-background shadow-xl"
            style={{
              borderTopWidth: 3,
              borderTopColor: "var(--color-primary)",
            }}
          >
            <ul className="py-2">
              {node.children!.map((child) => (
                <DropdownNode
                  key={child._id}
                  node={child}
                  language={language}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Fetches a Navigation menu tree from the gateway. Routes through
 * `createHttpClient({ enableAuth: true })` + `withAuth: true` so the
 * Bearer token is attached the same way `content-service.ts` already
 * does — bare `fetch` gets 403 (CoreGuard rejects requests without
 * an access context).
 */
async function fetchMenuTree(
  menuType: string,
  tenantId: string | null | undefined,
): Promise<MenuTreeNode[]> {
  if (!tenantId) return [];
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10000,
    });
    // Anonymous menu fetch — matches the default theme's
    // NavigationMenuSection which uses the /public sibling.
    const response: any = await httpClient.request(
      `/content/navigations/menu/${encodeURIComponent(menuType)}/public?language=en`,
      {
        method: "GET",
        tenantId,
        withAuth: false,
      },
    );
    if (!response?.success) {
      console.warn(
        `HeaderContainer: menu ${menuType} fetch failed:`,
        response?.error,
      );
      return [];
    }
    // The response handler may pass `data` through unwrapped (array)
    // OR keep the `{data, meta}` envelope. Drill through both.
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = (data as { data: unknown }).data;
    }
    return Array.isArray(data) ? (data as MenuTreeNode[]) : [];
  } catch (err) {
    console.warn(
      `HeaderContainer: failed to fetch menu ${menuType}`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}
