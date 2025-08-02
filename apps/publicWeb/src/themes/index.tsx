// Theme System Entry Point
// Manages multiple themes and provides theme switching capability

import { RootLayout as DefaultTheme } from "./default/layouts/RootLayout";

// Theme registry
const THEMES = {
  default: DefaultTheme,
  // Additional themes can be added here
  // custom: CustomTheme,
  // enterprise: EnterpriseTheme,
} as const;

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

// Export default theme for convenience
export { default as DefaultTheme } from "./default";
export * from "./default";

// Default export
export default getTheme;
