import React from "react";
import { LibraryShellLayout } from "./_shell/LibraryShellLayout";
import type { NavigationItem } from "./_shell/navigation/types";

// Library routes use a DEDICATED LOCAL COPY of the site-shell chrome
// (header + footer + nav) at `./_shell/`. This isolation is
// intentional — when the (cms) team rewrites the home-page chrome
// for a new theme, the library OPAC stays untouched. Login and
// register continue to use the shared `components/site-shell`.

export const dynamic = "force-dynamic";

// Icon names match lucide-react components — resolved by `IconComponent`
// from `@repo/ui` inside the navigation renderer.
const LIBRARY_NAV_ITEMS: NavigationItem[] = [
  {
    id: "library-dept-home",
    title: { en: "Library", mm: "စာကြည့်တိုက်" },
    url: "/dept/library",
    icon: "Library",
  },
  {
    id: "university-home",
    title: { en: "University Home", mm: "ပင်မစာမျက်နှာ" },
    url: "/",
    icon: "GraduationCap",
  },
  {
    id: "library-about",
    title: { en: "About", mm: "အကြောင်း" },
    url: "/library/about",
    icon: "Info",
  },
];

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LibraryShellLayout navigationItems={LIBRARY_NAV_ITEMS}>
      {children}
    </LibraryShellLayout>
  );
}
