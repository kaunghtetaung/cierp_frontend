"use client";

import React from "react";
import Link from "next/link";
import { getLocalizedText } from "@repo/utils";
import { HeaderBannerProps } from "./types";
import { S3Image } from "@/components/common/S3Image";

/**
 * Header Banner Component
 * Displays tenant logo, title, and subtitle
 * Uses CSS classes for responsive behavior
 */
export function HeaderBanner({
  className,
  logoUrl,
  title,
  subtitle,
  currentLanguage = "en",
  showLogo = true,
}: HeaderBannerProps) {
  // Helper function to get localized text or regular string
  const getDisplayText = (
    text: any,
    preferredLanguage: string = currentLanguage
  ): string => {
    if (typeof text === "string") return text;
    return getLocalizedText(text, preferredLanguage, "");
  };

  const displayTitle = getDisplayText(title, currentLanguage);
  const displaySubtitle = getDisplayText(subtitle, currentLanguage);

  return (
    <div
      className={`flex items-center justify-start gap-4 transition-all duration-300 hover:-translate-y-0.5 ${
        className || ""
      }`}
    >
      <Link
        href="/"
        className={`flex items-center justify-start gap-4 text-inherit no-underline transition-opacity duration-200 hover:opacity-80`}
      >
        {/* Logo */}
        {showLogo && (
          <div className="flex-shrink-0">
            {logoUrl ? (
              <S3Image
                src={logoUrl}
                alt={displayTitle || "Logo"}
                className="w-20 h-20 object-contain rounded-lg"
                width={80}
                height={80}
                priority
              />
            ) : (
              <div className="flex items-center justify-center w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-secondary/30 text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:via-white/20 before:to-transparent before:rotate-45 before:scale-150 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100">
                {displayTitle?.charAt(0) || "L"}
              </div>
            )}
          </div>
        )}

        {/* Title and Subtitle */}
        <div className={`flex flex-col gap-1 min-w-0`}>
          {displayTitle && (
            <h1 className="text-xl font-bold m-0 leading-tight text-[var(--color-header-banner-title)] transition-all duration-300">
              {displayTitle}
            </h1>
          )}
          {displaySubtitle && (
            <p className="text-sm text-[var(--color-header-banner-subtitle)] m-0 leading-snug opacity-80 transition-opacity duration-300 group-hover:opacity-100">
              {displaySubtitle}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default HeaderBanner;
