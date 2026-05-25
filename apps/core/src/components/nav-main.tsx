"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@repo/ui";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { currentLanguage } = useLanguage();
  // `state === 'collapsed'` is the icon-only sidebar mode. We swap
  // the inline <Collapsible> sub-menu for a flyout <DropdownMenu> so
  // sub-items reach the user via hover/click on the icon instead of
  // vanishing because the parent text + chevron are hidden.
  const { state, isMobile } = useSidebar();
  const isIconOnly = state === "collapsed" && !isMobile;

  // Function to check if a path is active - updated for path-based routing
  const isPathActive = (itemUrl: string, subItems?: any[]) => {
    // Exact match
    if (pathname === itemUrl) {
      return true;
    }

    // For path-based routing, check if current path starts with the item URL
    // e.g., /core/users should be active when on /core/users/new or /core/users/123
    if (itemUrl !== "/" && !itemUrl.endsWith("/") && pathname.startsWith(itemUrl + "/")) {
      return true;
    }

    // Check sub-items
    if (subItems) {
      return subItems.some(subItem =>
        pathname === subItem.url || pathname.startsWith(subItem.url + "/")
      );
    }

    return false;
  };

  // Check if a sub-item (not parent) is active - EXACT match only
  const isSubItemActive = (subItemUrl: string, parentUrl: string) => {
    // Exact match
    if (pathname === subItemUrl) {
      return true;
    }

    // For sub-items that are NOT the same as parent URL
    // Check if we're on a child route of this specific sub-item
    if (subItemUrl !== parentUrl && pathname.startsWith(subItemUrl + "/")) {
      return true;
    }

    return false;
  };

  // Check if parent menu item should be highlighted (NOT highlighted if sub-item is active)
  const isParentActive = (itemUrl: string, subItems?: any[]) => {
    // If there are no sub-items, use normal active check
    if (!subItems || subItems.length === 0) {
      return isPathActive(itemUrl);
    }

    // If any sub-item is active, parent should NOT be highlighted
    const hasActiveSubItem = subItems.some(subItem =>
      isSubItemActive(subItem.url, itemUrl)
    );

    if (hasActiveSubItem) {
      return false; // Don't highlight parent when sub-item is active
    }

    // Only highlight parent on exact match
    return pathname === itemUrl;
  };

  // Get current app from path for dashboard link
  const getCurrentAppPrefix = (): string => {
    const pathSegments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const appFromPath = pathSegments.length > 0 ? pathSegments[0] : '';
    
    if (appFromPath && (appFromPath === 'core' || appFromPath === 'library' || appFromPath === 'school' || appFromPath === 'content')) {
      return `/${appFromPath}`;
    }
    return '/core'; // Default fallback
  };

  const currentAppPrefix = getCurrentAppPrefix();
  
  // Check if we're on the dashboard (root of current app)
  const isDashboardActive = pathname === currentAppPrefix || pathname === currentAppPrefix + "/" || pathname === "/";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {/* Dashboard Link */}
        <SidebarMenuItem>
          <SidebarMenuButton 
            asChild 
            tooltip={getLocalizedText({ en: "Dashboard", mm: "ဒက်ရှ်ဘုတ်" }, currentLanguage)} 
            isActive={isDashboardActive}
          >
            <Link href={currentAppPrefix}>
              <IconComponent name="LayoutDashboard" />
              <span>{getLocalizedText({ en: "Dashboard", mm: "ဒက်ရှ်ဘုတ်" }, currentLanguage)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        {items.map((item) => {
          const isActive = isPathActive(item.url, item.items);
          const isParentHighlighted = isParentActive(item.url, item.items);
          const hasSubItems = !!item.items?.length;

          // Icon-only mode with children → render a dropdown anchored
          // to the icon button. Sub-items surface on hover/click so
          // the collapsed sidebar stays functional. Items without
          // children behave the same in both modes (plain link).
          if (isIconOnly && hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isParentHighlighted}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={4}
                    className="min-w-48"
                  >
                    <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items!.map((subItem) => {
                      const isSubActive = isSubItemActive(
                        subItem.url,
                        item.url,
                      );
                      return (
                        <DropdownMenuItem
                          key={subItem.title}
                          asChild
                          className={isSubActive ? "bg-accent" : ""}
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                {hasSubItems ? (
                  // If item has subitems, make it non-clickable (just for expand/collapse)
                  <SidebarMenuButton tooltip={item.title} isActive={isParentHighlighted}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  // If no subitems, make it a clickable link
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isParentHighlighted}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              {hasSubItems ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = isSubItemActive(subItem.url, item.url);

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
