"use client";

import React from "react";
import { S3Image } from "@/components/common/S3Image";
import { getLocalizedText } from "@repo/utils";
import { UserAvatarProps } from "./types";

/**
 * User Avatar Component
 * Displays user profile picture or fallback
 */
export function UserAvatar({
  user,
  size = "md",
  className = "",
  showOnlineStatus = false,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (): string => {
    return (user as any).localizedDisplayName
      ? getLocalizedText((user as any).localizedDisplayName)
      : user.name || "User";
  };

  const avatarClass = `user-avatar ${sizeClasses[size]} ${className}`;

  return (
    <div className={`relative ${avatarClass}`}>
      {user.avatar ? (
        <S3Image
          src={user.avatar}
          alt={`${getUserDisplayName()}'s avatar`}
          className="rounded-full object-cover"
          fill
          sizes="40px"
        />
      ) : (
        <div className="user-avatar-fallback rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {getInitials(getUserDisplayName())}
        </div>
      )}

      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
      )}
    </div>
  );
}

export default UserAvatar;
