"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/base-components/ui/dropdown-menu";
import { Button } from "@/base-components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { getLocalizedText } from "@repo/utils";
import { UserDropdownProps } from "./types";
import UserAvatar from "./UserAvatar";

/**
 * User Dropdown Component
 * Displays user menu with profile options
 */
export function UserDropdown({
  user,
  onSignOut,
  className = "",
}: UserDropdownProps) {
  const getUserDisplayName = (): string => {
    return (user as any).localizedDisplayName
      ? getLocalizedText((user as any).localizedDisplayName)
      : user.name || "User";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`p-1 min-h-[44px] min-w-[44px] touch-manipulation border-0 shadow-none hover:bg-gray-100 ${className}`}
          aria-label="User menu"
        >
          <UserAvatar user={user} size="md" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-1"
      >
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-white">
          <UserAvatar user={user} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem>
          <a
            href="/profile"
            className="flex items-center gap-2 cursor-pointer px-2 py-2 text-gray-900 hover:bg-gray-100 rounded-sm"
          >
            <User className="h-4 w-4 text-gray-700" />
            Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <a
            href="/settings"
            className="flex items-center gap-2 cursor-pointer px-2 py-2 text-gray-900 hover:bg-gray-100 rounded-sm"
          >
            <Settings className="h-4 w-4 text-gray-700" />
            Settings
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem>
          <a
            onClick={onSignOut}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 px-2 py-2 rounded-sm"
          >
            <LogOut className="h-4 w-4 text-red-600" />
            Sign Out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
