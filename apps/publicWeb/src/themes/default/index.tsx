// Default Theme - Main Export
// Centralized export for the entire default theme

// Layouts
export { 
  RootLayout, 
  ThemeLayout, 
  ClientProviders, 
  ThemeProvider, 
  useTheme 
} from './layouts';

// Common components
export { 
  HeaderContainer, 
  HeaderBanner, 
  HeaderActions,
  HeaderNavigation,
  DesktopNavigation,
  MobileNavigation,
  NavigationItem
} from './common';

// Section components
export {
  SectionRenderer,
  HeroSection,
  ContentWithImageSection,
  FeatureListSection,
  CallToActionSection,
  GallerySection
} from './templates/section';

// Page templates
export {
  HomePage,
  ContentPage
} from './templates/page';

// Types
export type {
  HeaderContainerProps,
  FooterContainerProps
} from './common';

// Default export - the main theme entry point
export { RootLayout as default } from './layouts';