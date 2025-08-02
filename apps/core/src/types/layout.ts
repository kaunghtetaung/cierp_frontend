// Layout-specific TypeScript interfaces
// Defines types for layout components and data structures

import type { TenantSettings, ModuleSchema } from "@repo/types"

/**
 * Middleware data from Next.js headers
 */
export interface MiddlewareData {
  tenantId: string | null
  language: string
  requestId: string | null
  hostname: string | null
  protocol: string
  appId: string
  appConfig?: any
}

/**
 * App schema data from backend API
 */
export interface AppSchemaData {
  modules: ModuleSchema[]
  supportedLanguages: any[]
  serviceName: string
  timestamp: string
  appId: string
}

/**
 * Complete layout data structure
 */
export interface LayoutData {
  middlewareData: MiddlewareData
  tenant: TenantSettings | null
  tenantError: string | null
  appSchemaData: AppSchemaData | null
}

/**
 * App providers props
 */
export interface AppProvidersProps {
  children: React.ReactNode
  initialLanguage: string
  initialTenant: TenantSettings | null
  initialError: string | null
}

/**
 * App layout props
 */
export interface AppLayoutProps {
  children: React.ReactNode
  tenant: TenantSettings | null
  appSchemaData: AppSchemaData | null
}

/**
 * Root layout props
 */
export interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * Page metadata structure
 */
export interface PageMetadata {
  title: string
  description: string
}

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  enableSidebar: boolean
  enableHeader: boolean
  enableErrorBoundaries: boolean
  sidebarCollapsible: boolean
  theme: 'light' | 'dark' | 'system'
}

/**
 * Layout context data
 */
export interface LayoutContextData {
  tenant: TenantSettings | null
  appSchemaData: AppSchemaData | null
  middlewareData: MiddlewareData
  config: LayoutConfig
}

export default {
  MiddlewareData,
  AppSchemaData,
  LayoutData,
  AppProvidersProps,
  AppLayoutProps,
  RootLayoutProps,
  PageMetadata,
  LayoutConfig,
  LayoutContextData
}