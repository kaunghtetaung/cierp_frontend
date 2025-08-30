// Base Dashboard Library
// Common components and utilities for dashboard applications (core, library, ctms, cmps)

// Components
export { DashboardLayout } from './components/DashboardLayout'
export { DashboardErrorBoundary } from './components/ErrorBoundary'
export { DashboardLoadingPage } from './components/LoadingPage'
export { AppSelector } from './components/AppSelector'
export { LanguageSelector } from './components/LanguageSelector'
export { UserActionMenu } from './components/UserActionMenu'
export { ThemeScript } from './components/theme-script'

// Layouts
export { FullDashboardLayout } from './layouts/FullDashboardLayout'
export { MinimalDashboardLayout } from './layouts/MinimalDashboardLayout'

// Providers
export { DashboardProviders } from './providers/DashboardProviders'
export { AppProviders } from './providers/AppProviders'
export { 
  createDashboardProviders, 
  createStandardDashboardProviders,
  createDashboardProvidersWithLanguage 
} from './providers/provider-factory'

// Utilities
export { 
  generateDashboardMetadata, 
  createTenantErrorHandler, 
  createAppSchemaErrorHandler,
  mergeDashboardLayoutData 
} from './utils/layout-data'

// Types
export type {
  DashboardLayoutData,
  DashboardLayoutProps,
  DashboardProvidersProps,
  DashboardConfig,
  DashboardMetadata,
  MiddlewareData,
  AppSchemaData
} from './types'