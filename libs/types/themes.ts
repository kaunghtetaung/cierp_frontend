// Shared theme catalogue — single source of truth consumed by:
//   * publicWeb `apps/publicWeb/src/themes/index.tsx` registry (which
//     maps each key to a RootLayout component)
//   * admin Settings page `apps/core/src/staticModules/content/settings/page.tsx`
//     theme dropdown + variant picker
//
// Adding a new theme:
//   1. Append a new `{ key, label, ... }` entry to THEME_OPTIONS below.
//   2. Create the matching folder `apps/publicWeb/src/themes/<key>/`.
//   3. Register the RootLayout in publicWeb `themes/index.tsx`.
//
// Adding a variant to an existing theme:
//   1. Append a new `{ key, label, ... }` entry under that theme's
//      `variants[]` array below.
//   2. Add the matching `.theme-variant-<key>` block in the theme's
//      `styles/index.css` redefining the relevant CSS variables.

/** A colour / preset variant within a theme — e.g. the same theme
 *  shipped in "Blue + Orange" and "Teal + Gold" palettes. */
export interface ThemeVariant {
  /** Stored verbatim in `Settings.themeVariant`. */
  key: string;
  /** Display name in the admin variant picker. */
  label: string;
  /** Optional one-line description for the picker subtext. */
  description?: string;
}

export interface ThemeOption {
  /** Stored verbatim in `Settings.themeName`. Must match the key in
   *  publicWeb `themes/index.tsx`'s registry. */
  key: string;
  /** Display name for the admin Settings dropdown. */
  label: string;
  /** Optional one-line description for the dropdown subtext. */
  description?: string;
  /** Optional colour / preset variants. When present, the admin
   *  shows a variant picker so authors can switch palette without a
   *  full theme swap. When omitted or empty, the theme has a single
   *  fixed palette. */
  variants?: ThemeVariant[];
  /** Variant chosen when `Settings.themeVariant` is unset. Defaults
   *  to the first entry in `variants[]` when not specified. */
  defaultVariant?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    key: "default",
    label: "Default Theme",
    description: "Generic CMS look — pick a colour variant below",
    variants: [
      {
        key: "blue",
        label: "Blue + Orange",
        description: "Bright blue + orange accents (original palette)",
      },
      {
        key: "teal",
        label: "Teal + Gold",
        description: "Medical teal + gold accents",
      },
    ],
    defaultVariant: "blue",
  },
  {
    key: "um1sf",
    label: "UM1 Yangon (ဆေးတက္ကသိုလ် ၁)",
    description: "Stanford-inspired editorial — pick a colour variant below",
    variants: [
      {
        key: "cardinal",
        label: "Cardinal Red",
        description: "Stanford-inspired cardinal red + neutral (original)",
      },
      {
        key: "blue",
        label: "Blue + Orange",
        description: "Editorial layout in default theme's blue + orange palette",
      },
      {
        key: "teal",
        label: "Teal + Gold",
        description: "Editorial layout in medical teal + gold palette",
      },
    ],
    defaultVariant: "cardinal",
  },
];

/** Convenience — derives the list of valid theme keys. */
export const THEME_KEYS = THEME_OPTIONS.map((t) => t.key);

/** Type guard for runtime checks. */
export function isKnownTheme(key: string): boolean {
  return THEME_KEYS.includes(key);
}

/** Look up a theme by key. */
export function findTheme(key: string | undefined): ThemeOption | undefined {
  if (!key) return undefined;
  return THEME_OPTIONS.find((t) => t.key === key);
}

/** Returns the effective variant key for a theme, falling back to
 *  the theme's `defaultVariant` (or the first variant) when the
 *  caller hasn't set one. Returns undefined for variant-less themes. */
export function resolveThemeVariant(
  themeKey: string | undefined,
  variantKey: string | undefined,
): string | undefined {
  const theme = findTheme(themeKey);
  if (!theme?.variants?.length) return undefined;

  // If caller's value is valid for this theme, use it.
  if (variantKey && theme.variants.some((v) => v.key === variantKey)) {
    return variantKey;
  }
  // Otherwise fall back to defaultVariant or the first declared variant.
  return theme.defaultVariant ?? theme.variants[0].key;
}
