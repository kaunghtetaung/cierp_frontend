/**
 * Theme-aware asset loading utilities
 *
 * This module provides helper functions to load theme-specific assets
 * from the public directory. Supports fallback to shared assets.
 */

export type ThemeName = 'default' | 'crystal' | 'um1';

/**
 * Get the current active theme name
 * Can be extended to read from context, environment, or user preferences
 */
export function getCurrentTheme(): ThemeName {
  // TODO: Replace with actual theme detection logic
  // Options:
  // 1. Read from environment variable: process.env.NEXT_PUBLIC_THEME
  // 2. Read from user context/session
  // 3. Read from URL subdomain
  // 4. Read from database based on tenant

  if (typeof window !== 'undefined') {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && ['default', 'crystal', 'um1'].includes(savedTheme)) {
      return savedTheme as ThemeName;
    }
  }

  return 'default';
}

/**
 * Get theme-specific asset path
 *
 * @param path - Asset path relative to theme directory (e.g., 'images/backgrounds/hero.jpg')
 * @param theme - Theme name (optional, defaults to current theme)
 * @param fallbackToShared - If true, will try shared directory if theme asset doesn't exist
 * @returns Full public path to the asset
 *
 * @example
 * // Get background image for current theme
 * getThemeAsset('images/backgrounds/hero.jpg')
 * // Returns: '/themes/default/images/backgrounds/hero.jpg'
 *
 * @example
 * // Get logo for specific theme
 * getThemeAsset('images/logos/logo.png', 'crystal')
 * // Returns: '/themes/crystal/images/logos/logo.png'
 */
export function getThemeAsset(
  path: string,
  theme?: ThemeName,
  fallbackToShared: boolean = false
): string {
  const themeName = theme || getCurrentTheme();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `/themes/${themeName}/${cleanPath}`;
}

/**
 * Get shared asset path (assets used across all themes)
 *
 * @param path - Asset path relative to shared directory
 * @returns Full public path to the shared asset
 *
 * @example
 * getSharedAsset('images/common-icon.png')
 * // Returns: '/shared/images/common-icon.png'
 */
export function getSharedAsset(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/shared/${cleanPath}`;
}

/**
 * Get theme-specific background image URL for CSS
 *
 * @param path - Asset path relative to theme images directory
 * @param theme - Theme name (optional)
 * @returns CSS url() string
 *
 * @example
 * getThemeBackground('backgrounds/hero.jpg')
 * // Returns: "url('/themes/default/images/backgrounds/hero.jpg')"
 *
 * // Usage in component:
 * <div style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}>
 */
export function getThemeBackground(path: string, theme?: ThemeName): string {
  const imagePath = path.startsWith('images/') ? path : `images/${path}`;
  return `url('${getThemeAsset(imagePath, theme)}')`;
}

/**
 * Get theme-specific SVG pattern URL for CSS
 *
 * @param path - Asset path relative to theme svg directory
 * @param theme - Theme name (optional)
 * @returns CSS url() string
 *
 * @example
 * getThemeSvgPattern('patterns/dots.svg')
 * // Returns: "url('/themes/default/svg/patterns/dots.svg')"
 */
export function getThemeSvgPattern(path: string, theme?: ThemeName): string {
  const svgPath = path.startsWith('svg/') ? path : `svg/${path}`;
  return `url('${getThemeAsset(svgPath, theme)}')`;
}

/**
 * Preload theme assets for better performance
 * Call this early in your app to preload critical theme assets
 *
 * @param assets - Array of asset paths to preload
 * @param theme - Theme name (optional)
 *
 * @example
 * preloadThemeAssets([
 *   'images/backgrounds/hero.jpg',
 *   'images/logos/logo.png',
 *   'svg/patterns/dots.svg'
 * ]);
 */
export function preloadThemeAssets(assets: string[], theme?: ThemeName): void {
  if (typeof window === 'undefined') return;

  const themeName = theme || getCurrentTheme();

  assets.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = path.endsWith('.svg') ? 'image' : 'image';
    link.href = getThemeAsset(path, themeName);
    document.head.appendChild(link);
  });
}

/**
 * Theme asset configuration object
 * Use this to define all theme assets in one place
 */
export const themeAssetPaths = {
  backgrounds: {
    hero: 'images/backgrounds/hero.jpg',
    pattern: 'images/backgrounds/pattern.png',
    gradient: 'images/backgrounds/gradient.jpg',
  },
  logos: {
    main: 'images/logos/logo.png',
    icon: 'images/logos/icon.png',
    white: 'images/logos/logo-white.png',
  },
  patterns: {
    dots: 'svg/patterns/dots.svg',
    grid: 'svg/patterns/grid.svg',
    waves: 'svg/patterns/waves.svg',
  },
  icons: {
    custom: 'svg/icons/custom-icon.svg',
  },
  banners: {
    library: 'svg/banner.svg',
    librarySearch: 'svg/domain_search_banner.svg',
    dmFind: 'svg/dm_find_banner.svg',
    about: 'svg/about.svg',
    transfer: 'svg/transfer.svg',
    secure: 'svg/secure_trusted.svg',
    flexible: 'svg/easy_flexible.svg',
    aiLogo: 'svg/ai_logo.svg',
  }
} as const;

/**
 * Type-safe theme asset getter
 *
 * @example
 * const heroPath = getAsset('backgrounds', 'hero');
 * // Returns: '/themes/default/images/backgrounds/hero.jpg'
 */
export function getAsset(
  category: keyof typeof themeAssetPaths,
  name: string,
  theme?: ThemeName
): string {
  const path = (themeAssetPaths[category] as any)[name];
  if (!path) {
    console.warn(`Asset not found: ${category}.${name}`);
    return '';
  }
  return getThemeAsset(path, theme);
}
