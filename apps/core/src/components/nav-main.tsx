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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
          
          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              {item.items?.length ? (
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
                        const isSubActive = isPathActive(subItem.url);
                        
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
