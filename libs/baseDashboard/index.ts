// Base Dashboard Library
// Common components and utilities for dashboard applications (core, library, ctms, cmps)

// Components
export { DashboardLayout } from './components/DashboardLayout'
export { DashboardErrorBoundary } from './components/ErrorBoundary'
export { DashboardLoadingPage } from './components/LoadingPage'
export { AppSelector } from './components/AppSelector'
export { ClientAppSelector } from './components/ClientAppSelector'
// Note: ServerAppSelector should be imported directly when needed, not through barrel export
export { LanguageSelector } from './components/LanguageSelector'
export { UserActionMenu } from './components/UserActionMenu'

// Layouts
export { FullDashboardLayout } from './layouts/FullDashboardLayout'
export { MinimalDashboardLayout } from './layouts/MinimalDashboardLayout'

// Providers
export { DashboardProviders } from './providers/DashboardProviders'
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