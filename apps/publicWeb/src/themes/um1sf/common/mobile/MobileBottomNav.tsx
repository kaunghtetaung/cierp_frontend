"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Megaphone, BookOpen } from "lucide-react";

interface MobileBottomNavProps {
  currentLanguage?: "en" | "mm";
}

/**
 * Mobile-app-style bottom tab bar for um1sf.
 *
 * Fixed to the bottom of the viewport on screens < lg. Hidden on
 * desktop where the regular header nav is used. Renders 4 tabs:
 * Home / News / Announcements / Library — the most common
 * destinations for an everyday visitor. The active tab is
 * highlighted based on the current pathname.
 *
 * Safe-area inset bottom padding handles iOS home-bar overlap;
 * `ThemeLayout` adds `pb-16` (or equivalent) to main on mobile so
 * page content isn't covered.
 */
type Tab = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: { en: string; mm: string };
  // Active match: exact pathname OR pathname startsWith(matchPrefix).
  matchPrefix?: string;
};

const TABS: Tab[] = [
  {
    href: "/",
    icon: Home,
    label: { en: "Home", mm: "ပင်မ" },
  },
  {
    href: "/post/news",
    icon: Newspaper,
    label: { en: "News", mm: "သတင်း" },
    matchPrefix: "/post/news",
  },
  {
    href: "/post/announcements",
    icon: Megaphone,
    label: { en: "Notices", mm: "အကြောင်းကြား" },
    matchPrefix: "/post/announcements",
  },
  {
    href: "/library",
    icon: BookOpen,
    label: { en: "Library", mm: "စာကြည့်တိုက်" },
    matchPrefix: "/library",
  },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.href === "/" && pathname === "/") return true;
  if (
    tab.matchPrefix &&
    (pathname === tab.matchPrefix || pathname.startsWith(tab.matchPrefix + "/"))
  ) {
    return true;
  }
  return false;
}

export function MobileBottomNav({
  currentLanguage = "en",
}: MobileBottomNavProps) {
  const pathname = usePathname() || "/";
  const lang = currentLanguage === "mm" ? "mm" : "en";

  return (
    <nav
      aria-label="Primary mobile navigation"
      // Fixed bottom, full-width, hidden on lg+ screens (which use
      // the regular header). Backdrop blur keeps it readable over
      // scrolled content. iOS safe-area padding via env(safe-area).
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="flex items-stretch justify-around h-16">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex h-full w-full flex-col items-center justify-center gap-0.5 px-2 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={22}
                  className={active ? "stroke-[2.25]" : "stroke-[1.75]"}
                />
                <span
                  className={`text-[10px] leading-tight ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {tab.label[lang]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileBottomNav;
