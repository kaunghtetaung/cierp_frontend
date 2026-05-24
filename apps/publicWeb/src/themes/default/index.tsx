// Default Theme — Main Export
// Centralized export for the default theme. Header / footer /
// navigation no longer live here — they were promoted to
// `src/components/site-shell/` so library/login/register can use
// them too. Import shell components directly from `@/components/site-shell/...`.

// Layouts
export {
  RootLayout,
  ThemeLayout,
  ClientProviders,
  ThemeProvider,
  useTheme,
} from './layouts';

// Section components
export {
  SectionRenderer,
  HeroSection,
  ContentWithImageSection,
  FeatureListSection,
  CallToActionSection,
  GallerySection,
} from './templates/section';

// Page templates
export { HomePage, ContentPage } from './templates/page';

// Post templates (article-style + event-style + dispatcher)
export { PostPage } from './templates/post/PostPage';

// Default export — the main theme entry point
export { RootLayout as default } from './layouts';