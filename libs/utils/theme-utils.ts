/**
 * Theme Utilities
 * Helper functions for working with CSS custom properties
 */

// Type definitions for theme colors
export interface ThemeColors {
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  success: string;
  'success-foreground': string;
  warning: string;
  'warning-foreground': string;
  info: string;
  'info-foreground': string;
  danger: string;
  border: string;
  input: string;
  ring: string;
}

// Predefined theme presets
export const THEME_PRESETS = {
  default: {
    primary: 'hsl(105, 91%, 35%)',
    'primary-foreground': 'hsl(0 0% 98%)',
    secondary: 'hsl(240 4.8% 95.9%)',
    'secondary-foreground': 'hsl(240 5.9% 10%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(32.1 94.6% 43.7%)',
    info: 'hsl(221.2 83.2% 53.3%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  },
  blue: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    'primary-foreground': 'hsl(0 0% 98%)',
    secondary: 'hsl(210 40% 98%)',
    'secondary-foreground': 'hsl(222.2 84% 4.9%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(32.1 94.6% 43.7%)',
    info: 'hsl(221.2 83.2% 53.3%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  },
  purple: {
    primary: 'hsl(262.1 83.3% 57.8%)',
    'primary-foreground': 'hsl(0 0% 98%)',
    secondary: 'hsl(270 20% 98%)',
    'secondary-foreground': 'hsl(262.1 83.3% 30%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(32.1 94.6% 43.7%)',
    info: 'hsl(221.2 83.2% 53.3%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  },
  red: {
    primary: 'hsl(0 84.2% 60.2%)',
    'primary-foreground': 'hsl(0 0% 98%)',
    secondary: 'hsl(0 20% 98%)',
    'secondary-foreground': 'hsl(0 84.2% 30%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(32.1 94.6% 43.7%)',
    info: 'hsl(221.2 83.2% 53.3%)',
    destructive: 'hsl(0 84.2% 60.2%)',
  },
} as const;

/**
 * Get the current value of a CSS custom property
 */
export function getCSSVariable(property: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

/**
 * Set a CSS custom property value
 */
export function setCSSVariable(property: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(property, value);
}

/**
 * Get all current theme colors
 */
export function getCurrentThemeColors(): Partial<ThemeColors> {
  const colors: Partial<ThemeColors> = {};
  const colorKeys: (keyof ThemeColors)[] = [
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'background',
    'foreground',
    'success',
    'warning',
    'info',
    'destructive',
  ];

  colorKeys.forEach((key) => {
    colors[key] = getCSSVariable(`--color-${key}`);
  });

  return colors;
}

/**
 * Apply a theme preset
 */
export function applyThemePreset(presetName: keyof typeof THEME_PRESETS): void {
  const preset = THEME_PRESETS[presetName];
  
  Object.entries(preset).forEach(([key, value]) => {
    setCSSVariable(`--color-${key}`, value);
  });
}

/**
 * Apply custom theme colors
 */
export function applyCustomTheme(colors: Partial<ThemeColors>): void {
  Object.entries(colors).forEach(([key, value]) => {
    if (value) {
      setCSSVariable(`--color-${key}`, value);
    }
  });
}

/**
 * Generate a complete color palette from a primary color
 */
export function generateColorPalette(primaryHSL: string): Partial<ThemeColors> {
  // Parse HSL values
  const hslMatch = primaryHSL.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
  if (!hslMatch) {
    throw new Error('Invalid HSL color format. Use: hsl(h, s%, l%)');
  }

  const [, h, s, l] = hslMatch.map(Number);

  // Generate complementary colors
  return {
    primary: primaryHSL,
    'primary-foreground': 'hsl(0 0% 98%)',
    secondary: `hsl(${h} ${Math.max(s - 70, 5)}% ${Math.min(l + 60, 95)}%)`,
    'secondary-foreground': `hsl(${h} ${s}% ${Math.max(l - 70, 10)}%)`,
    accent: `hsl(${h} ${Math.max(s - 50, 10)}% ${Math.min(l + 50, 90)}%)`,
    'accent-foreground': `hsl(${h} ${s}% ${Math.max(l - 60, 10)}%)`,
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * Convert HEX to HSL
 */
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color format');
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return rgbToHsl(r, g, b);
}

/**
 * React hook for theme management
 */
export function useTheme() {
  const [currentColors, setCurrentColors] = React.useState<Partial<ThemeColors>>({});

  React.useEffect(() => {
    setCurrentColors(getCurrentThemeColors());
  }, []);

  const updateTheme = React.useCallback((colors: Partial<ThemeColors>) => {
    applyCustomTheme(colors);
    setCurrentColors((prev) => ({ ...prev, ...colors }));
  }, []);

  const applyPreset = React.useCallback((presetName: keyof typeof THEME_PRESETS) => {
    applyThemePreset(presetName);
    setCurrentColors(getCurrentThemeColors());
  }, []);

  const resetTheme = React.useCallback(() => {
    applyPreset('default');
  }, [applyPreset]);

  return {
    colors: currentColors,
    updateTheme,
    applyPreset,
    resetTheme,
    presets: Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[],
  };
}

// Import React for the hook
import React from 'react';