// Library-specific layout types
// Shared types for layout data and components

import type { TenantSettings } from "@repo/types"

/**
 * Middleware data from headers including app routing info
 */
export interface MiddlewareData {
  language: string
  tenantId?: string
  appId?: string
  [key: string]: any
}

/**
 * App schema data containing module configuration
 */
export interface AppSchemaData {
  modules: any[]
  supportedLanguages: string[]
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
 * Page metadata for SEO and head tags
 */
export interface PageMetadata {
  title: string
  description: string
}

/**
 * Root layout component props
 */
export interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * App layout component props
 */
export interface AppLayoutProps {
  children: React.ReactNode
  tenant: TenantSettings | null
  appSchemaData: AppSchemaData | null
}