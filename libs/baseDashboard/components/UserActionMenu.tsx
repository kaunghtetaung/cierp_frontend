"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  User,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { getLocalizedText } from "@repo/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui";

interface UserData {
  name?: string;
  email: string;
  localizedDisplayName?: { [key: string]: string };
  roles?: string[];
}

interface UserActionMenuProps {
  user: UserData | null;
  currentLanguage: string;
  isLoading?: boolean;
  onLogout: () => Promise<void>;
}

export function UserActionMenu({ 
  user, 
  currentLanguage, 
  isLoading = false, 
  onLogout 
}: UserActionMenuProps) {
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted"></div>
            <div className="grid flex-1 gap-1">
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-2 bg-muted/70 rounded w-1/2"></div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (): string => {
    return (
      getLocalizedText(user.localizedDisplayName, currentLanguage) ||
      user.name ||
      "User"
    );
  };

  // Helper function for menu text localization
  const getMenuText = (en: string): string => {
    const menuTexts = {
      Profile: { en: "Profile", mm: "ပရိုဖိုင်" },
      Settings: { en: "Settings", mm: "ဆက်တင်များ" },
      Notifications: { en: "Notifications", mm: "အကြောင်းကြားစာများ" },
      "Admin Panel": { en: "Admin Panel", mm: "စီမံခန့်ခွဲမှုစာမျက်နှာ" },
      Billing: { en: "Billing", mm: "ငွေရှင်းချေမှု" },
      "Sign Out": { en: "Sign Out", mm: "ထွက်မည်" },
      "Signing out...": { en: "Signing out...", mm: "ထွက်နေသည်..." },
    };

    const textObj = menuTexts[en as keyof typeof menuTexts];
    if (!textObj) return en;

    return currentLanguage === "mm" && textObj.mm ? textObj.mm : textObj.en;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double clicks

    try {
      setIsLoggingOut(true);
      console.log("🚪 Initiating logout...");
      await onLogout();
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      setIsLoggingOut(false); // Re-enable button on error
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={undefined} alt={getUserDisplayName()} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {getInitials(getUserDisplayName())}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {getUserDisplayName()}
                </span>
                <span className="truncate text-xs text-secondary-foreground/70">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-card border-border"
            side={isMobile ? "top" : "right"}
            align={isMobile ? "center" : "start"}
            sideOffset={4}
            alignOffset={isMobile ? 0 : -4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={undefined} alt={getUserDisplayName()} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {getInitials(getUserDisplayName())}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {getUserDisplayName()}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="h-4 w-4" />
                {getMenuText("Profile")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4" />
                {getMenuText("Settings")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4" />
                {getMenuText("Notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {user.roles?.includes("admin") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck className="h-4 w-4" />
                    {getMenuText("Admin Panel")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="h-4 w-4" />
                    {getMenuText("Billing")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isLoggingOut
                ? getMenuText("Signing out...")
                : getMenuText("Sign Out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}