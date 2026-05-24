// um1sf Theme — Main Export
//
// First per-tenant theme: University of Medicine 1 Yangon
// (ဆေးတက္ကသိုလ် ၁ ရန်ကုန်). Stanford-inspired editorial design with a
// cardinal-red + neutral palette. Owns its own header, footer, and
// 4 section overrides (hero, featureList, testimonials, cta);
// other section types fall through to the default theme.
//
// Home page reads the real authored doc + sections from the CMS via
// the standard SafeHomePage pipeline; no theme-side placeholder data
// is wired in any more. The previous demo dataset is preserved at
// `data/home_backup.ts` for reference but is intentionally NOT
// re-exported.

export { RootLayout, ThemeLayout, ThemeProvider, useTheme } from "./layouts";
export { HomePage, ContentPage } from "./templates/page";
export { SectionRenderer } from "./templates/section";

export { RootLayout as default } from "./layouts";
