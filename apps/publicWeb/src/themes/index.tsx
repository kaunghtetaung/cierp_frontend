// Theme System Entry Point
// Manages multiple themes and provides theme switching capability.
//
// The list of theme keys lives in the shared `@repo/types/themes`
// catalogue (`THEME_OPTIONS`) — that's the same list the admin
// Settings → Theme dropdown reads. Adding a new theme is a 2-step
// process:
//   1. Append `{ key, label }` to `libs/types/themes.ts`
//   2. Register the matching RootLayout in the `THEMES` const below.
// The runtime `assertRegistryMatchesCatalogue` check below catches
// the case where step 1 is done but step 2 is missed (a typo in the
// admin dropdown otherwise silently falls back to default).

import { THEME_KEYS } from "@repo/types";
import { RootLayout as DefaultTheme } from "./default/layouts/RootLayout";
import { RootLayout as Um1sfTheme } from "./um1sf/layouts/RootLayout";

import { HomePage as DefaultHomePage } from "./default/templates/page/HomePage";
import { ContentPage as DefaultContentPage } from "./default/templates/page/ContentPage";
import { PostPage as DefaultPostPage } from "./default/templates/post/PostPage";
import { PostListPage as DefaultPostListPage } from "./default/templates/post-list/PostListPage";
import { HomePage as Um1sfHomePage } from "./um1sf/templates/page/HomePage";
import { ContentPage as Um1sfContentPage } from "./um1sf/templates/page/ContentPage";
import { PostPage as Um1sfPostPage } from "./um1sf/templates/post/PostPage";
import { PostListPage as Um1sfPostListPage } from "./um1sf/templates/post-list/PostListPage";

const THEMES = {
  default: DefaultTheme,
  um1sf: Um1sfTheme, // University of Medicine 1 Yangon — Stanford-inspired
} as const;

// Per-theme page-template registry. `app/(cms)/page.tsx`'s
// SafeHomePage walks this to pick the active theme's HomePage so
// content rendering follows the theme — not just chrome.
// Per-theme post-page registry. Each theme owns its own PostPage
// dispatcher (which internally routes to ArticlePage / EventPage).
const THEME_TEMPLATES = {
  default: {
    HomePage: DefaultHomePage,
    ContentPage: DefaultContentPage,
    PostPage: DefaultPostPage,
    PostListPage: DefaultPostListPage,
  },
  um1sf: {
    HomePage: Um1sfHomePage,
    ContentPage: Um1sfContentPage,
    PostPage: Um1sfPostPage,
    PostListPage: Um1sfPostListPage,
  },
} as const;

if (process.env.NODE_ENV !== "production") {
  // Dev-only sanity: every key advertised to the admin dropdown must
  // resolve to a registered RootLayout here.
  for (const key of THEME_KEYS) {
    if (!(key in THEMES)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[themes] '${key}' is in THEME_OPTIONS but has no RootLayout registered in apps/publicWeb/src/themes/index.tsx — admin will let authors pick it but the public site will fall back to 'default'.`,
      );
    }
  }
}

export type ThemeName = keyof typeof THEMES;

/**
 * Get theme component by name
 */
export function getTheme(themeName: ThemeName = "default") {
  return THEMES[themeName] || THEMES.default;
}

/**
 * Get available theme names
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(THEMES) as ThemeName[];
}

/**
 * Check if theme exists
 */
export function isValidTheme(themeName: string): themeName is ThemeName {
  return themeName in THEMES;
}

/**
 * Get the active theme's page templates (HomePage, ContentPage).
 *
 * Used by `app/(cms)/page.tsx` and any other route that needs to
 * render a section-driven page using the theme's own templates
 * instead of the default's. Falls back to default's templates
 * when the requested theme isn't registered.
 */
export function getThemeTemplates(themeName: ThemeName = "default") {
  return THEME_TEMPLATES[themeName] || THEME_TEMPLATES.default;
}

// Export default theme for convenience
export { default as DefaultTheme } from "./default";
export * from "./default";

// Default export
export default getTheme;
