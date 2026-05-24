import { NavigationItem } from "./types";

/**
 * Get the title text in the current language
 */
export function getTitle(
  item: NavigationItem,
  currentLanguage: "en" | "mm"
): string {
  return item.title[currentLanguage] || item.title.en || "";
}

/**
 * Check if a navigation item should be visible based on authentication
 */
export function isItemVisible(
  item: NavigationItem,
  isAuthenticated?: boolean,
  userRoles?: string[]
): boolean {
  // If item requires authentication but user is not authenticated
  if (item.requiresAuth && !isAuthenticated) {
    return false;
  }

  // If item has role restrictions
  if (item.allowedRoles && item.allowedRoles.length > 0) {
    // User must be authenticated and have at least one of the allowed roles
    if (!isAuthenticated || !userRoles || userRoles.length === 0) {
      return false;
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = item.allowedRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasAllowedRole) {
      return false;
    }
  }

  return true;
}

/**
 * Filter navigation items based on authentication and roles
 */
export function filterNavigationItems(
  items: NavigationItem[],
  isAuthenticated?: boolean,
  userRoles?: string[]
): NavigationItem[] {
  return items
    .filter((item) => isItemVisible(item, isAuthenticated, userRoles))
    .map((item) => ({
      ...item,
      children: item.children && item.children.length > 0
        ? filterNavigationItems(item.children, isAuthenticated, userRoles)
        : item.children,
    }));
}

/**
 * Generate the href for a navigation item
 */
export function generateHref(item: NavigationItem): string {
  // Prefer url over pageId
  if (item.url) {
    return item.url;
  }

  // If pageId is provided, generate URL (you might want to customize this)
  if (item.pageId) {
    return `/page/${item.pageId}`;
  }

  // Fallback to # for items with children (dropdown triggers)
  return "#";
}

/**
 * Check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  );
}

/**
 * Get target attribute for links
 */
export function getLinkTarget(item: NavigationItem): string | undefined {
  if (item.openInNewTab) {
    return "_blank";
  }

  // Auto-detect external URLs
  const href = generateHref(item);
  if (isExternalUrl(href)) {
    return "_blank";
  }

  return undefined;
}

/**
 * Get rel attribute for links
 */
export function getLinkRel(item: NavigationItem): string | undefined {
  const target = getLinkTarget(item);

  if (target === "_blank") {
    return "noopener noreferrer";
  }

  return undefined;
}

/**
 * Check if an item has visible children
 */
export function hasVisibleChildren(
  item: NavigationItem,
  isAuthenticated?: boolean,
  userRoles?: string[]
): boolean {
  if (!item.children || item.children.length === 0) {
    return false;
  }
  
  // Filter children to see if any are visible
  const visibleChildren = filterNavigationItems(item.children, isAuthenticated, userRoles);
  return visibleChildren.length > 0;
}

/**
 * Get icon name from item (can be extended to map icon names)
 */
export function getIconName(item: NavigationItem): string | undefined {
  return item.icon;
}

/**
 * Combine CSS classes safely
 */
export function combineClasses(
  ...classes: (string | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}
